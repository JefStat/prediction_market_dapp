// Factory "morphs" into a Pudding class.
// The reasoning is that calling load in each context
// is cumbersome.

(function() {

  var contract_data = {
    abi: [{"constant":false,"inputs":[{"name":"curAdmin","type":"address"}],"name":"removeAdmin","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isAdmin","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[],"name":"betAgainst","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"result","type":"bool"}],"name":"closePoll","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"question","type":"string"},{"name":"trustedSource","type":"address"},{"name":"closingDate","type":"uint256"}],"name":"openNewPoll","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"newAdmin","type":"address"}],"name":"addAdmin","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[],"name":"betFor","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"poll","outputs":[{"name":"question","type":"string"},{"name":"totalYes","type":"uint256"},{"name":"totalNo","type":"uint256"},{"name":"open","type":"bool"},{"name":"result","type":"bool"},{"name":"closingDate","type":"uint256"},{"name":"closingBalance","type":"uint256"},{"name":"trustedSource","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"changeOwner","outputs":[],"type":"function"},{"constant":false,"inputs":[],"name":"payOut","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"trustedSource","type":"address"}],"name":"setNewTrustedSource","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[],"name":"PollClosed","type":"event"},{"anonymous":false,"inputs":[],"name":"PollOpened","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"totalYes","type":"uint256"},{"indexed":false,"name":"totalNo","type":"uint256"}],"name":"PredictionUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"recipient","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PaidOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"message","type":"string"},{"indexed":false,"name":"msgSender","type":"address"},{"indexed":false,"name":"aValue","type":"uint256"}],"name":"Debug","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAdmin","type":"address"}],"name":"AdminAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"removedAdmin","type":"address"}],"name":"AdminRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newOwner","type":"address"}],"name":"OwnerChanged","type":"event"}],
    binary: "606060405260008054600160a060020a0319163317905560273360006000341115608f576002565b50610b42806100b06000396000f35b60408120805460ff19166001908117909155600280549091019055600160a060020a03821660609081527f44d6d25963f097ad14f29f06854a01f575648a1ef82f30e562ccd3889717e33990602090a15060015b919050565b600160a060020a03821681526001602052604081205460ff1615603657608a56606060405236156100a35760e060020a60003504631785f53c81146100ac57806324d7806c146100d95780633937ac40146100f45780633a52719b1461010d57806341c0e1b51461012757806348f0f6411461014857806370480275146101ba5780638da5cb5b146101e75780639ae3be25146101f9578063a117527914610212578063a6f9dae114610246578063c205240314610269578063c53b1c5114610287575b6102b45b610002565b6102b6600435600160a060020a03331660009081526001602052604081205460ff16151561041957610002565b6102b660043560016020526000908152604090205460ff1681565b6102b6600654600090819060ff1615156104d857610002565b6102b660043560065460009060ff1615156104e657610002565b6102b660008054600160a060020a0390811633919091161461057157610002565b6040805160206004803580820135601f81018490048402850184019095528484526102b6949193602493909291840191908190840183828082843750949650509335935050604435915050600160a060020a03331660009081526001602052604081205460ff16151561058f57610002565b6102b6600435600160a060020a03331660009081526001602052604081205460ff1615156106ac57610002565b6102ca600054600160a060020a031681565b6102b6600654600090819060ff1615156106c757610002565b6102e760065460045460055460075460085460095460039560ff8181169461010090920416929091600160a060020a031688565b6102b4600435600054600160a060020a0390811633919091161461074b57610002565b6102b6600654600090819081908190819060ff161561079f57610002565b6102b6600435600160a060020a03331660009081526001602052604081205460ff1615156109d157610002565b005b604080519115158252519081900360200190f35b60408051600160a060020a03929092168252519081900360200190f35b60408051602081018990529081018790528515156060820152841515608082015260a0810184905260c08101839052600160a060020a03821660e08201526101008082528954600260018216158302600019019091160490820181905281906101208201908b90801561039b5780601f106103705761010080835404028352916020019161039b565b820191906000526020600020905b81548152906001019060200180831161037e57829003601f168201915b5050995050505050505050505060405180910390f35b600160a060020a038216600081815260016020908152604091829020805460ff1916905560028054600019019055815192835290517fa3b62bc36326052d97ea62d63c3d60308ed4c3ea8ac079dd8499f1e9c4f80c0f9281900390910190a15060015b919050565b600034111561042757610002565b600160a060020a03821660009081526001602052604090205460ff1615806104555750600254600019016000145b156103b157506000610414565b5060058054349081018255600160a060020a0333166000908152600a60209081526040918290206001018054840190559254600454825190815293840152805191927f2a6d7249ddb98890b5dd0a1de681af71fe5fdd35b468228ad62f836709b79b0d929081900390910190a1600191505b5090565b346000141561046257610002565b60003411156104f457610002565b600954600160a060020a0390811633909116148061051457506007544290105b156100a7576006805461ff00191661010084021760ff191690554260075530600160a060020a0316316008556040517f5e24da2538f801728822124bb8a94fd11c332883ca34345e44ddf7f79587cef990600090a1506001610414565b60065460ff161561058157610002565b600054600160a060020a0316ff5b60065460ff161561059f57610002565b60003411156105ad57610002565b60075460009011156105be57610002565b6106798484846101006040519081016040528084815260200160008152602001600081526020016001815260200160008152602001828152602001600081526020018381526020015060036000506000820151816000016000509080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f10610a0a57805160ff19168380011785555b50610a3a9291505b808211156104d45760008155600101610665565b6040517fd286aab26c83aacb04720da27f087833c19413501027f7db4200d506aca2c78b90600090a15060019392505050565b6106c08260006000341115610ab057610002565b9050610414565b34600014156106d557610002565b5060048054349081018255600160a060020a0333166000908152600a60209081526040918290208054840190559254600554825191825293810193909352805191927f2a6d7249ddb98890b5dd0a1de681af71fe5fdd35b468228ad62f836709b79b0d929081900390910190a1600191506104d4565b60008054600160a060020a03191682179081905560408051600160a060020a03929092168252517fa2ea9883a321a3e97b8266c2b078bfeec6d50c711ed71f874a90d500ae2eaf369181900360200190a150565b60003411156107ad57610002565b600160a060020a0383166000908152600a602052604090206002015460ff16156107d657610002565b600160a060020a039283166000908152600a60209081526040808320600201805460ff19166001179055600554600454339788168086529483902080548451958601969096528484019590955260608085526007908501527f626574207965730000000000000000000000000000000000000000000000000060808501529151910196509193507fe5589756feb14fa54053633b30d9de8c8c4a3347afc5bd6efc411f7823ae87f2919081900360a00190a17fe5589756feb14fa54053633b30d9de8c8c4a3347afc5bd6efc411f7823ae87f2338360010160005054604051808060200184600160a060020a03168152602001838152602001828103825260068152602001807f626574206e6f0000000000000000000000000000000000000000000000000000815260200150602001935050505060405180910390a16006548490610100900460ff1661092e576001830154610931565b82545b6008540204905030600160a060020a031631811115610957575030600160a060020a0316315b604051600160a060020a03841690600090839082818181858883f19350505050151561098257610002565b60408051600160a060020a03851681526020810183905281517f85614384dd52aa71c3b02d6986abe55274cb38b9b13fc323db17de1b950c2727929181900390910190a1600194505050505090565b60065460ff1615156109e257610002565b60003411156109f057610002565b5060098054600160a060020a031916821790556001610414565b8280016001018555821561065d579182015b8281111561065d578251826000505591602001919060010190610a1c565b50506020820151600182015560408201516002820155606082015160038201805460808501516101000261ff001960ff19929092169093171691909117905560a0820151600482015560c0820151600582015560e091909101516006919091018054600160a060020a0319169091179055505050565b600160a060020a03821660009081526001602052604090205460ff1615610ad957506000610414565b600160a060020a038216600081815260016020818152604092839020805460ff19168317905560028054909201909155815192835290517f44d6d25963f097ad14f29f06854a01f575648a1ef82f30e562ccd3889717e3399281900390910190a150600161041456",
    unlinked_binary: "606060405260008054600160a060020a0319163317905560273360006000341115608f576002565b50610b42806100b06000396000f35b60408120805460ff19166001908117909155600280549091019055600160a060020a03821660609081527f44d6d25963f097ad14f29f06854a01f575648a1ef82f30e562ccd3889717e33990602090a15060015b919050565b600160a060020a03821681526001602052604081205460ff1615603657608a56606060405236156100a35760e060020a60003504631785f53c81146100ac57806324d7806c146100d95780633937ac40146100f45780633a52719b1461010d57806341c0e1b51461012757806348f0f6411461014857806370480275146101ba5780638da5cb5b146101e75780639ae3be25146101f9578063a117527914610212578063a6f9dae114610246578063c205240314610269578063c53b1c5114610287575b6102b45b610002565b6102b6600435600160a060020a03331660009081526001602052604081205460ff16151561041957610002565b6102b660043560016020526000908152604090205460ff1681565b6102b6600654600090819060ff1615156104d857610002565b6102b660043560065460009060ff1615156104e657610002565b6102b660008054600160a060020a0390811633919091161461057157610002565b6040805160206004803580820135601f81018490048402850184019095528484526102b6949193602493909291840191908190840183828082843750949650509335935050604435915050600160a060020a03331660009081526001602052604081205460ff16151561058f57610002565b6102b6600435600160a060020a03331660009081526001602052604081205460ff1615156106ac57610002565b6102ca600054600160a060020a031681565b6102b6600654600090819060ff1615156106c757610002565b6102e760065460045460055460075460085460095460039560ff8181169461010090920416929091600160a060020a031688565b6102b4600435600054600160a060020a0390811633919091161461074b57610002565b6102b6600654600090819081908190819060ff161561079f57610002565b6102b6600435600160a060020a03331660009081526001602052604081205460ff1615156109d157610002565b005b604080519115158252519081900360200190f35b60408051600160a060020a03929092168252519081900360200190f35b60408051602081018990529081018790528515156060820152841515608082015260a0810184905260c08101839052600160a060020a03821660e08201526101008082528954600260018216158302600019019091160490820181905281906101208201908b90801561039b5780601f106103705761010080835404028352916020019161039b565b820191906000526020600020905b81548152906001019060200180831161037e57829003601f168201915b5050995050505050505050505060405180910390f35b600160a060020a038216600081815260016020908152604091829020805460ff1916905560028054600019019055815192835290517fa3b62bc36326052d97ea62d63c3d60308ed4c3ea8ac079dd8499f1e9c4f80c0f9281900390910190a15060015b919050565b600034111561042757610002565b600160a060020a03821660009081526001602052604090205460ff1615806104555750600254600019016000145b156103b157506000610414565b5060058054349081018255600160a060020a0333166000908152600a60209081526040918290206001018054840190559254600454825190815293840152805191927f2a6d7249ddb98890b5dd0a1de681af71fe5fdd35b468228ad62f836709b79b0d929081900390910190a1600191505b5090565b346000141561046257610002565b60003411156104f457610002565b600954600160a060020a0390811633909116148061051457506007544290105b156100a7576006805461ff00191661010084021760ff191690554260075530600160a060020a0316316008556040517f5e24da2538f801728822124bb8a94fd11c332883ca34345e44ddf7f79587cef990600090a1506001610414565b60065460ff161561058157610002565b600054600160a060020a0316ff5b60065460ff161561059f57610002565b60003411156105ad57610002565b60075460009011156105be57610002565b6106798484846101006040519081016040528084815260200160008152602001600081526020016001815260200160008152602001828152602001600081526020018381526020015060036000506000820151816000016000509080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f10610a0a57805160ff19168380011785555b50610a3a9291505b808211156104d45760008155600101610665565b6040517fd286aab26c83aacb04720da27f087833c19413501027f7db4200d506aca2c78b90600090a15060019392505050565b6106c08260006000341115610ab057610002565b9050610414565b34600014156106d557610002565b5060048054349081018255600160a060020a0333166000908152600a60209081526040918290208054840190559254600554825191825293810193909352805191927f2a6d7249ddb98890b5dd0a1de681af71fe5fdd35b468228ad62f836709b79b0d929081900390910190a1600191506104d4565b60008054600160a060020a03191682179081905560408051600160a060020a03929092168252517fa2ea9883a321a3e97b8266c2b078bfeec6d50c711ed71f874a90d500ae2eaf369181900360200190a150565b60003411156107ad57610002565b600160a060020a0383166000908152600a602052604090206002015460ff16156107d657610002565b600160a060020a039283166000908152600a60209081526040808320600201805460ff19166001179055600554600454339788168086529483902080548451958601969096528484019590955260608085526007908501527f626574207965730000000000000000000000000000000000000000000000000060808501529151910196509193507fe5589756feb14fa54053633b30d9de8c8c4a3347afc5bd6efc411f7823ae87f2919081900360a00190a17fe5589756feb14fa54053633b30d9de8c8c4a3347afc5bd6efc411f7823ae87f2338360010160005054604051808060200184600160a060020a03168152602001838152602001828103825260068152602001807f626574206e6f0000000000000000000000000000000000000000000000000000815260200150602001935050505060405180910390a16006548490610100900460ff1661092e576001830154610931565b82545b6008540204905030600160a060020a031631811115610957575030600160a060020a0316315b604051600160a060020a03841690600090839082818181858883f19350505050151561098257610002565b60408051600160a060020a03851681526020810183905281517f85614384dd52aa71c3b02d6986abe55274cb38b9b13fc323db17de1b950c2727929181900390910190a1600194505050505090565b60065460ff1615156109e257610002565b60003411156109f057610002565b5060098054600160a060020a031916821790556001610414565b8280016001018555821561065d579182015b8281111561065d578251826000505591602001919060010190610a1c565b50506020820151600182015560408201516002820155606082015160038201805460808501516101000261ff001960ff19929092169093171691909117905560a0820151600482015560c0820151600582015560e091909101516006919091018054600160a060020a0319169091179055505050565b600160a060020a03821660009081526001602052604090205460ff1615610ad957506000610414565b600160a060020a038216600081815260016020818152604092839020805460ff19168317905560028054909201909155815192835290517f44d6d25963f097ad14f29f06854a01f575648a1ef82f30e562ccd3889717e3399281900390910190a150600161041456",
    address: "0x5720251c1053aab02c86716fbe992abd5938a815",
    generated_with: "2.0.9",
    contract_name: "PredictionMarket"
  };

  function Contract() {
    if (Contract.Pudding == null) {
      throw new Error("PredictionMarket error: Please call load() first before creating new instance of this contract.");
    }

    Contract.Pudding.apply(this, arguments);
  };

  Contract.load = function(Pudding) {
    Contract.Pudding = Pudding;

    Pudding.whisk(contract_data, Contract);

    // Return itself for backwards compatibility.
    return Contract;
  }

  Contract.new = function() {
    if (Contract.Pudding == null) {
      throw new Error("PredictionMarket error: Please call load() first before calling new().");
    }

    return Contract.Pudding.new.apply(Contract, arguments);
  };

  Contract.at = function() {
    if (Contract.Pudding == null) {
      throw new Error("PredictionMarket error: Please call load() first before calling at().");
    }

    return Contract.Pudding.at.apply(Contract, arguments);
  };

  Contract.deployed = function() {
    if (Contract.Pudding == null) {
      throw new Error("PredictionMarket error: Please call load() first before calling deployed().");
    }

    return Contract.Pudding.deployed.apply(Contract, arguments);
  };

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of Pudding in the browser,
    // and we can use that.
    window.PredictionMarket = Contract;
  }

})();
