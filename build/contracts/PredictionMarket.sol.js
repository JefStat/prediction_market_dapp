var Web3 = require("web3");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  return accept(tx, receipt);
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("PredictionMarket error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("PredictionMarket error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("PredictionMarket contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of PredictionMarket: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to PredictionMarket.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: PredictionMarket not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "curAdmin",
            "type": "address"
          }
        ],
        "name": "removeAdmin",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "isAdmin",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "betAgainst",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "result",
            "type": "bool"
          }
        ],
        "name": "closePoll",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "kill",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "question",
            "type": "string"
          },
          {
            "name": "trustedSource",
            "type": "address"
          },
          {
            "name": "closingDate",
            "type": "uint256"
          }
        ],
        "name": "openNewPoll",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "addAdmin",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "betFor",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "poll",
        "outputs": [
          {
            "name": "question",
            "type": "string"
          },
          {
            "name": "totalYes",
            "type": "uint256"
          },
          {
            "name": "totalNo",
            "type": "uint256"
          },
          {
            "name": "open",
            "type": "bool"
          },
          {
            "name": "result",
            "type": "bool"
          },
          {
            "name": "closingDate",
            "type": "uint256"
          },
          {
            "name": "closingBalance",
            "type": "uint256"
          },
          {
            "name": "trustedSource",
            "type": "address"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "changeOwner",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "payOut",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "trustedSource",
            "type": "address"
          }
        ],
        "name": "setNewTrustedSource",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "inputs": [],
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "PollClosed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "PollOpened",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "totalYes",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalNo",
            "type": "uint256"
          }
        ],
        "name": "PredictionUpdate",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "PaidOut",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "msgSender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "aValue",
            "type": "uint256"
          }
        ],
        "name": "Debug",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "AdminAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "removedAdmin",
            "type": "address"
          }
        ],
        "name": "AdminRemoved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnerChanged",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x606060405260008054600160a060020a0319163317905560273360006000341115608f576002565b50610a46806100b06000396000f35b60408120805460ff19166001908117909155600280549091019055600160a060020a03821660609081527f44d6d25963f097ad14f29f06854a01f575648a1ef82f30e562ccd3889717e33990602090a15060015b919050565b600160a060020a03821681526001602052604081205460ff1615603657608a56606060405236156100a35760e060020a60003504631785f53c81146100ac57806324d7806c146100d95780633937ac40146100f45780633a52719b1461010d57806341c0e1b51461012757806348f0f6411461014857806370480275146101ba5780638da5cb5b146101e75780639ae3be25146101f9578063a117527914610212578063a6f9dae114610246578063c205240314610269578063c53b1c5114610287575b6102b45b610002565b6102b6600435600160a060020a03331660009081526001602052604081205460ff16151561041957610002565b6102b660043560016020526000908152604090205460ff1681565b6102b6600654600090819060ff1615156104d857610002565b6102b660043560065460009060ff1615156104e657610002565b6102b660008054600160a060020a0390811633919091161461057157610002565b6040805160206004803580820135601f81018490048402850184019095528484526102b6949193602493909291840191908190840183828082843750949650509335935050604435915050600160a060020a03331660009081526001602052604081205460ff16151561058f57610002565b6102b6600435600160a060020a03331660009081526001602052604081205460ff1615156106ac57610002565b6102ca600054600160a060020a031681565b6102b6600654600090819060ff1615156106c757610002565b6102e760065460045460055460075460085460095460039560ff8181169461010090920416929091600160a060020a031688565b6102b4600435600054600160a060020a0390811633919091161461074b57610002565b6102b6600654600090819081908190819060ff161561079f57610002565b6102b6600435600160a060020a03331660009081526001602052604081205460ff1615156108d557610002565b005b604080519115158252519081900360200190f35b60408051600160a060020a03929092168252519081900360200190f35b60408051602081018990529081018790528515156060820152841515608082015260a0810184905260c08101839052600160a060020a03821660e08201526101008082528954600260018216158302600019019091160490820181905281906101208201908b90801561039b5780601f106103705761010080835404028352916020019161039b565b820191906000526020600020905b81548152906001019060200180831161037e57829003601f168201915b5050995050505050505050505060405180910390f35b600160a060020a038216600081815260016020908152604091829020805460ff1916905560028054600019019055815192835290517fa3b62bc36326052d97ea62d63c3d60308ed4c3ea8ac079dd8499f1e9c4f80c0f9281900390910190a15060015b919050565b600034111561042757610002565b600160a060020a03821660009081526001602052604090205460ff1615806104555750600254600019016000145b156103b157506000610414565b5060058054349081018255600160a060020a0333166000908152600a60209081526040918290206001018054840190559254600454825190815293840152805191927f2a6d7249ddb98890b5dd0a1de681af71fe5fdd35b468228ad62f836709b79b0d929081900390910190a1600191505b5090565b346000141561046257610002565b60003411156104f457610002565b600954600160a060020a0390811633909116148061051457506007544290105b156100a7576006805461ff00191661010084021760ff191690554260075530600160a060020a0316316008556040517f5e24da2538f801728822124bb8a94fd11c332883ca34345e44ddf7f79587cef990600090a1506001610414565b60065460ff161561058157610002565b600054600160a060020a0316ff5b60065460ff161561059f57610002565b60003411156105ad57610002565b60075460009011156105be57610002565b6106798484846101006040519081016040528084815260200160008152602001600081526020016001815260200160008152602001828152602001600081526020018381526020015060036000506000820151816000016000509080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061090e57805160ff19168380011785555b5061093e9291505b808211156104d45760008155600101610665565b6040517fd286aab26c83aacb04720da27f087833c19413501027f7db4200d506aca2c78b90600090a15060019392505050565b6106c082600060003411156109b457610002565b9050610414565b34600014156106d557610002565b5060048054349081018255600160a060020a0333166000908152600a60209081526040918290208054840190559254600554825191825293810193909352805191927f2a6d7249ddb98890b5dd0a1de681af71fe5fdd35b468228ad62f836709b79b0d929081900390910190a1600191506104d4565b60008054600160a060020a03191682179081905560408051600160a060020a03929092168252517fa2ea9883a321a3e97b8266c2b078bfeec6d50c711ed71f874a90d500ae2eaf369181900360200190a150565b60003411156107ad57610002565b600160a060020a0383166000908152600a602052604090206002015460ff16156107d657610002565b600160a060020a039283166000908152600a6020526040808220600201805460ff19166001179055600554600454339687168452919092206006549190920195509092508490610100900460ff16610832576001830154610835565b82545b6008540204905030600160a060020a03163181111561085b575030600160a060020a0316315b604051600160a060020a03841690600090839082818181858883f19350505050151561088657610002565b60408051600160a060020a03851681526020810183905281517f85614384dd52aa71c3b02d6986abe55274cb38b9b13fc323db17de1b950c2727929181900390910190a1600194505050505090565b60065460ff1615156108e657610002565b60003411156108f457610002565b5060098054600160a060020a031916821790556001610414565b8280016001018555821561065d579182015b8281111561065d578251826000505591602001919060010190610920565b50506020820151600182015560408201516002820155606082015160038201805460808501516101000261ff001960ff19929092169093171691909117905560a0820151600482015560c0820151600582015560e091909101516006919091018054600160a060020a0319169091179055505050565b600160a060020a03821660009081526001602052604090205460ff16156109dd57506000610414565b600160a060020a038216600081815260016020818152604092839020805460ff19168317905560028054909201909155815192835290517f44d6d25963f097ad14f29f06854a01f575648a1ef82f30e562ccd3889717e3399281900390910190a150600161041456",
    "updated_at": 1470604005115,
    "links": {},
    "address": "0x5274ac13ebc703c38aa68ae285c63fc7fb3c75a4"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "object") {
      Object.keys(name).forEach(function(n) {
        var a = name[n];
        Contract.link(n, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "PredictionMarket";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.1.2";

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.PredictionMarket = Contract;
  }
})();
