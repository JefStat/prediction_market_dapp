

var app = angular.module( 'predictionMarketApp', [] );

app.config( function ( $locationProvider ) {
  $locationProvider.html5Mode( true );
} );

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
      , finished      : truffleArray[8]
    };
  }
};
// TODO convert closing date into a date string from mills epoch
app.controller( "predictionMarketController", ['$scope', '$location', '$http', '$q', '$window', '$timeout', function ( $scope, $location, $http, $q, $window, $timeout ) {
  $scope.pm          = PredictionMarket.deployed();
  $scope.currentPoll = {
    question        : 'Does it blend?'
    , totalYes      : 0
    , totalNo       : 0
    , open          : false
    , result        : null
    , closingDate   : Date.now()
    , closingBalance: null
    , trustedSource : ''
    , finished      : false
  };
  $scope.pm.poll.call().then( function ( poll ) {
    $scope.currentPoll = PollStruct.newPollStruct( poll );
  } );
  $scope.from = web3.eth.accounts[0];

  // Event watches
  var debugWatch            = $scope.pm.Debug( {}, [], function ( error, event ) {
    console.log( '[Debug]  ', event );
  } );
  var pollOpenedWatch       = $scope.pm.PollOpened( {}, [], function ( error, event ) {
    if ( error ) {
      console.error( '[PollOpened]  ', error );
      return;
    }
    console.log( '[PollOpened] ', event );
    $scope.pm.poll.call().then( function ( poll ) {
      $scope.currentPoll = PollStruct.newPollStruct( poll );
      $scope.$apply();
    } );
  } );
  var pollClosedWatch       = $scope.pm.PollClosed( {}, [], function ( error, event ) {
    if ( error ) {
      console.error( '[PollClosed]  ', error );
      return;
    }
    console.log( '[PollClosed]  ', event );
    $scope.pm.poll.call().then( function ( poll ) {
      $scope.currentPoll = PollStruct.newPollStruct( poll );
      $scope.$apply();
    } );
  } );
  var predictionUpdateWatch = $scope.pm.PredictionUpdate( {}, [], function ( error, event ) {
    if ( error ) {
      console.error( '[PredictionUpdate]  ', error );
      return;
    }
    console.log( '[PredictionUpdate]  ', event );
    $scope.pm.poll.call().then( function ( poll ) {
      $scope.currentPoll = PollStruct.newPollStruct( poll );
      $scope.$apply();
    } );
  } );


  $scope.onPaidOut = function () {
    return $scope.pm.PaidOut( {}, [], function ( error, event ) {
      if ( error ) {
        console.error( '[PaidOut]  ', error );
        return;
      }
      console.log( '[PaidOut]  ', event );
      // TODO update some ui things
    } );
  };


// Reading public values
// pm.owner.call().then( function ( owner ) {});

// Transactions
  $scope.openPoll = function ( question, trustedSource, closingDate, from ) {
    if (!closingDate || question == '' || trustedSource == ''){
      console.error('missing parameters for open poll');
      return;
    }
    $scope.openingPoll = true;
    $scope.pm.openNewPoll( question, trustedSource, closingDate.valueOf(), { from: from } )
          .then( function ( tx ) {
            console.log( '[openPoll]  tx: ', tx );
          } )
          .catch( function ( err ) {
            console.error( '[openPoll] error', err );
          } )
          .finally( function () {
            $scope.openingPoll = false;
            $scope.$apply();
          } );
  };

  $scope.closePoll = function ( pollResult, from ) {
    $scope.closingPoll = true;
    $scope.pm.closePoll( pollResult, { from: from } )
          .then( function ( tx ) {
            console.log( '[closePoll]  tx: ', tx );
          } )
          .catch( function ( err ) {
            console.error( '[closePoll] error ', err );
          } )
          .finally( function () {
            $scope.closingPoll = false;
            $scope.$apply();
          } );
  };

  $scope.betFor     = function ( betValue, from ) {
    $scope.betting = true;
    $scope.pm.betFor( { value: betValue, from: from } )
          .then( function ( tx ) {
            console.log( '[betFor]  tx: ', tx );
          } )
          .catch( function ( err ) {
            console.error( '[betFor] error', err );
          } )
          .finally( function () {
            $scope.betting = false;
            $scope.$apply();
          } );
  };
  $scope.betAgainst = function ( betValue, from ) {
    $scope.betting = true;
    $scope.pm.betAgainst( { value: betValue, from: from } )
          .then( function ( tx ) {
            console.log( '[betAgainst]  tx: ', tx );
          } )
          .catch( function ( err ) {
            console.error( '[betAgainst] error', err );
          } )
          .finally( function () {
            $scope.betting = false;
            $scope.$apply();
          } );
  };
//TODO add pay out action
}] );
