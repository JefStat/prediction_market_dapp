module.exports = function(deployer) {
  deployer.deploy(Administrated);
  deployer.deploy(Owned);
  deployer.autolink();
  deployer.deploy(PredictionMarket);
};
