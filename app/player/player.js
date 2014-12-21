/**
* jamstash.player Module
*
* Enables access to the player service through the scope
*/
angular.module('jamstash.player.controller', ['jamstash.player.service', 'jamstash.player.directive'])

.controller('PlayerController', ['$scope', 'player', function($scope, player){
	'use strict';

    $scope.player = player;

    $scope.updateFavorite = function (song) {
        // TODO
    };
}]);
