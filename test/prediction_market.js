contract('PredictionMarket', function(accounts) {
  it("should create a new poll", function(done) {
    var pm = PredictionMarket.deployed();

    pm.openNewPoll.call('Does it blend?', accounts[0], date.now()).then(function(success) {
      assert.true(success, 'open new poll failed');
    }).then(done).catch(done);
  });
});
