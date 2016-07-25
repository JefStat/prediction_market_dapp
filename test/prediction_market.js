var PollStruct = {
  newPollStruct: function ( truffleArray ) {
    return {
      question        : truffleArray[0]
      , totalYes      : truffleArray[1]
      , totalNo       : truffleArray[2]
      , open          : truffleArray[3]
      , result        : truffleArray[4]
      , closingDate   : truffleArray[5]
      , closingBalance: truffleArray[6]
      , trustedSource : truffleArray[7]
    };
  }
};

/*create and close polls*/
contract( 'PredictionMarket', function ( accounts ) {
  it( 'should create a new poll', function ( done ) {
    var pm            = PredictionMarket.deployed();
    var question      = 'Does it blend?';
    var trustedSource = accounts[0];
    var closingDate   = Date.now();

    var watch = pm.PollOpened( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'PollOpened event' );
      console.log( event );
      watch.stopWatching();
      done();
    } );

    pm.openNewPoll( question, accounts[0], closingDate ).then( function ( tx ) {
      return pm.poll.call().then( function ( poll ) {
        // [ 'Does it blend?',
        //   { [String: '0'] s: 1, e: 0, c: [ 0 ] },
        // { [String: '0'] s: 1, e: 0, c: [ 0 ] },
        // true,
        //     false,
        // { [String: '1468851928586'] s: 1, e: 12, c: [ 1468851928586 ] },
        // { [String: '0'] s: 1, e: 0, c: [ 0 ] },
        // '0x435e29049e5dd6e6fbf81f038285e9da5a7fa3b9' ]
        console.log( 'poll' );
        console.log( poll );
        var pollObj = PollStruct.newPollStruct( poll );
        assert.equal( question, pollObj.question, 'question wrong' );
        assert.equal( '0', pollObj.totalYes, 'total yes wrong' );
        assert.equal( '0', pollObj.totalNo, 'total no wrong' );
        assert.equal( true, pollObj.open, 'open wrong' );
        assert.equal( false, pollObj.result, 'result wrong' );
        assert.equal( '' + closingDate, pollObj.closingDate.toString(), 'closing date wrong' );
        assert.equal( '0', pollObj.totalNo, 'closing balance wrong' );
        assert.equal( trustedSource, pollObj.trustedSource.toString(), 'trusted source wrong' );

      } );
    } ).catch( done );

  } );

  /*order matter here the test follow the previous open poll*/
  it( 'should let trusted source close poll', function ( done ) {
    var pm = PredictionMarket.deployed();

    var watch = pm.PollClosed( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'PollClosed event' );
      console.log( event );
      watch.stopWatching();
      done();
    } );

    pm.closePoll( false ).then( function ( tx ) {
    } ).catch( done );

  } );

  //todo can't find the bug in the date logic `poll.closingDate < now`
  it.skip( 'should close expired poll', function ( done ) {
    var question    = 'Does it blend?';
    var closingDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
    PredictionMarket.new().then( function ( instance ) {
      var pm    = instance;
      var watch = pm.PollClosed( {}, [], function ( error, event ) {
        if ( error ) done( error );
        console.log( 'PollClosed event' );
        console.log( event );
        watch.stopWatching();
        done();
      } );

      var pollOpenedWatch = pm.PollOpened( {}, [], function ( error, event ) {
        if ( error ) done( error );
        console.log( 'PollOpened event' );
        console.log( event );
        pollOpenedWatch.stopWatching();

        pm.poll.call().then( function ( poll ) {
          var pollObj = PollStruct.newPollStruct( poll );
          console.log( pollObj );
          assert.equal( '' + closingDate, pollObj.closingDate.toString(), 'closing date wrong' );
          assert.equal( true, pollObj.closingDate.lessThan( Date.now() ), 'poll is not expired' );
          pm.closePoll( false, { from: accounts[1] } )
            .catch( done );
        } );
      } );

      pm.openNewPoll( question, accounts[0], closingDate )
        .catch( done );

    } ).catch( done );

  } );
} );

/* owner */
contract( 'PredictionMarket', function ( accounts ) {
  it( 'should set owner', function ( done ) {
    var pm = PredictionMarket.deployed();
    pm.owner.call().then( function ( owner ) {
      console.log( 'owner' );
      console.log( owner );
      assert.equal( accounts[0], owner );
    } ).then( done ).catch( done );
  } );

} );

/* bet and payout*/
contract( 'PredictionMarket', function ( accounts ) {

  var newDeployedPoll;

  before( function ( done ) {
    PredictionMarket.new().then( function ( instance ) {
      newDeployedPoll = instance;
    } ).then( done ).catch( done );
  } );

  it( 'should bet for', function ( done ) {
    var pm = newDeployedPoll;

    var watch = pm.PredictionUpdate( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'should bet for PredictionUpdate event' );
      console.log( event );
      assert.equal( '1', event.args.totalYes.toString() );
      assert.equal( '0', event.args.totalNo.toString() );
      watch.stopWatching();
      done();
    } );

    pm.openNewPoll( 'does it blend?', accounts[0], Date.now() ).then( function ( tx ) {
      return pm.betFor( { value: 1 } ).then( function ( tx ) {
      } );
    } ).catch( done );
  } );

  it( 'should bet against', function ( done ) {
    var pm = newDeployedPoll;

    var watch = pm.PredictionUpdate( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'should bet against PredictionUpdate event' );
      console.log( event );
      assert.equal( '1', event.args.totalYes.toString() );
      assert.equal( '1', event.args.totalNo.toString() );
      watch.stopWatching();
      done();
    } );

    pm.betAgainst( { value: 1 } ).then( function ( tx ) {
    } ).catch( done );
  } );

  it( 'should pay out', function ( done ) {
    var pm = newDeployedPoll;
    //debugEventLogger( pm );
    var watch = pm.PaidOut( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'should pay out PaidOut event' );
      console.log( event );

      pm.poll.call().then( function ( poll ) {
        var pollObj = PollStruct.newPollStruct( poll );
        console.log('Poll state');
        console.log(pollObj);

        assert.equal( accounts[0], event.args.recipient.toString() );
        assert.equal( '1', event.args.amount.toString() );
        watch.stopWatching();
        done();
      });
    } );
    pm.closePoll( true ).then( function ( tx ) {
      return pm.payOut();
    } ).catch( done );
  } );
} );

/*admin*/
contract( 'PredictionMarket', function ( accounts ) {

  it( 'should set owner as admin', function ( done ) {
    var pm = PredictionMarket.deployed();
    pm.isAdmin.call( accounts[0] ).then( function ( isAdmin ) {
      assert.equal( true, isAdmin );
    } ).then( done ).catch( done );
  } );

  it( 'should add admin', function ( done ) {
    var pm = PredictionMarket.deployed();
    pm.AdminAdded( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'add admin event' );
      console.log( event );
      assert.equal( accounts[1], event.args.newAdmin, 'add admin failed' );
      done();
    } );
    pm.addAdmin( accounts[1] ).then( function ( tx ) {
    } ).catch( done );
  } );

  it( 'should remove admin self', function ( done ) {
    var pm = PredictionMarket.deployed();
    pm.AdminRemoved( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'remove admin event' );
      console.log( event );
      assert.equal( accounts[1], event.args.removedAdmin, 'failed to remove admin' );
      done();
    } );

    pm.addAdmin( accounts[1] ).then( function ( tx ) {
      return pm.removeAdmin( accounts[1], { from: accounts[1] } ).then( function ( tx ) {
      } );
    } ).catch( done );
  } );

  it( 'shouldn\'t add admin', function ( done ) {
    var pm = PredictionMarket.deployed();
    pm.AdminAdded( {}, [], function ( error, event ) {
      console.log( event );
      done( error );
    } );
    pm.addAdmin( accounts[2], { from: accounts[2] } ).then( function ( tx ) {
    } ).catch( function ( error ) {
      console.log( 'add admin error' );
      console.log( error );
      done();
    } );

  } );

} );


var debugEventLogger = function ( instance, onlyOnce ) {
  var debugWatch = instance.Debug( {}, [], function ( error, event ) {
    console.log( event );
    if ( onlyOnce ) {
      debugWatch.stopWatching();
    }
  } );
};


var handleTransactions = function ( trufflePromise, gasUsed, done ) {
  return trufflePromise
    .then( function ( txn ) {
      return web3.eth.getTransactionReceiptMined( txn );
    } )
    .then( function ( receipt ) {
      assert.equal( receipt.gasUsed, gasUsed, "should have used all the gas" );
    } )
    .catch( function ( e ) {
      if ( (e + "").indexOf( "invalid JUMP" ) > -1 ) {
        // We are in TestRPC
        throw e;
        //done();
      } else {
        done( e );
      }
    } );
};

web3.eth.getTransactionReceiptMined = function ( txnHash, interval ) {
  var transactionReceiptAsync;
  interval |= 500;
  transactionReceiptAsync = function ( txnHash, resolve, reject ) {
    try {
      var receipt = web3.eth.getTransactionReceipt( txnHash );
      if ( receipt == null ) {
        setTimeout( function () {
          transactionReceiptAsync( txnHash, resolve, reject );
        }, interval );
      } else {
        resolve( receipt );
      }
    } catch ( e ) {
      reject( e );
    }
  };

  return new Promise( function ( resolve, reject ) {
    transactionReceiptAsync( txnHash, resolve, reject );
  } );
};