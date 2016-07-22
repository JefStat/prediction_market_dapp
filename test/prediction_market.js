
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

contract( 'PredictionMarket', function ( accounts ) {
  it( 'should create a new poll', function ( done ) {
    var pm            = PredictionMarket.deployed();
    var question      = 'Does it blend?';
    var trustedSource = accounts[0];
    var closingDate   = Date.now();

    pm.PollOpened( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'PollOpened event' );
      console.log( event );
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
        assert.equal(  '' + closingDate, pollObj.closingDate.toString(), 'closing date wrong' );
        assert.equal( '0', pollObj.totalNo, 'closing balance wrong' );
        assert.equal( trustedSource, pollObj.trustedSource.toString(), 'trusted source wrong' );

      } );
    } ).catch( done );

  } );

  /*order matter here the test follow the previous open poll*/
  it( 'should let trusted source close poll', function ( done ) {
    var pm       = PredictionMarket.deployed();

    pm.PollClosed( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'PollClosed event' );
      console.log( event );
      done();
    } );

    pm.closePoll( false ).then( function ( tx ) {
    } ).catch( done );

  } );

  it.skip( 'should close expired poll', function ( done ) { //todo start a new poll to close
    var pm       = PredictionMarket.deployed();
    var question = 'Does it blend?';

    pm.PollClosed( {}, [], function ( error, event ) {
      if ( error ) done( error );
      console.log( 'PollClosed event' );
      console.log( event );
      done();
    } );

    pm.openNewPoll( question, accounts[0], Date.now() - 100000).then( function ( tx ) {
      return pm.closePoll( false, {from: accounts[1] } ).then( function ( tx ) {
        console.log('close tx: ' + tx);
      } )
    } ).catch( done );

  } );
} );

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
