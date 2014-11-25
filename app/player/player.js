/**
* jamstash.player Module
*
* Control the HTML5 player through jplayer.js
*/
angular.module('jamstash.player.ctrl', ['jamstash.player.service', 'jamstash.player.directive'])

.controller('PlayerCtrl', ['$scope', 'player', function($scope, player){
	'use strict';

    $scope.previousTrack = function () {
        player.previousTrack();
    };

    $scope.nextTrack = function () {
        player.nextTrack();
    };

    $scope.defaultPlay = function () {
        player.defaultPlay();
    };
}]);
