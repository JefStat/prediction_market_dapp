module.exports = {
  build: {
    "index.html": "index.html",
    "predictionMarket.js": [
      "javascripts/_vendor/angular.js",
      "javascripts/predictionMarketController.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    "images/": "images/"
  },
  deploy: [
    "PredictionMarket"
  ],
  rpc: {
    host: "192.168.1.16",
    port: 8545
  }
  ,networks:{
    "live": {
      network_id: 1 // Ethereum public network
      // ,host: "192.168.1.16"
      // ,port: 8545
    }
    ,"morden": {
      network_id: 2       // Official Ethereum test network
      // ,host: "192.168.1.16"
      // ,port: 8545
    }
    ,"staging": {
      network_id: 14658 // b9labs student network
      ,host: "192.168.1.16"
      ,port: 8545
    }
    ,"development": {
      network_id: "default"
      ,host: "192.168.1.16"
      ,port: 8546
    }
  }
};
