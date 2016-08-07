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
    };
  }
};


app.controller( "predictionMarketController", ['$scope', '$location', '$http', '$q', '$window', '$timeout', function ( $scope, $location, $http, $q, $window, $timeout ) {
  $scope.pm          = PredictionMarket.deployed();
  $scope.currentPoll = {
    question        : ''
    , totalYes      : 0
    , totalNo       : 0
    , open          : false
    , result        : null
    , closingDate   : null
    , closingBalance: null
    , trustedSource : ''
  };
  $scope.pm.poll.call().then( function ( poll ) {
    $scope.currentPoll = PollStruct.newPollStruct( poll );
  } );


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
  $scope.openPoll = function ( question, trustedSource, closingDate ) {
    $scope.pm.openNewPoll( question, trustedSource, closingDate ).then( function ( tx ) {
      console.log( '[openPoll]  tx: ', tx );
    } );
  };

  $scope.closePoll = function ( pollResult ) {
    $scope.pm.closePoll( pollResult ).then( function ( tx ) {
      console.log( '[closePoll]  tx: ', tx );
    } );
  };

  $scope.betFor     = function ( betValue ) {
    $scope.pm.betFor( { value: betValue } ).then( function ( tx ) {
      console.log( '[betFor]  tx: ', tx );
    } );
  };
  $scope.betAgainst = function ( betValue ) {
    $scope.pm.betAgainst( { value: betValue } ).then( function ( tx ) {
      console.log( '[betAgainst]  tx: ', tx );
    } );
  };

}] );