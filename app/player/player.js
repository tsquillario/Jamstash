/**
* jamstash.player Module
*
* Enables basic control of the player : play, pause, previous track, next track.
* Also provides the currently playing song's info through the scope so it can be displayed next to
* the player controls.
*/
angular.module('jamstash.player.controller', ['jamstash.player.service', 'jamstash.player.directive'])

.controller('PlayerController', ['$scope', 'player', 'globals',
    function($scope, player, globals){
	'use strict';

    $scope.getPlayingSong = function () {
        return player.getPlayingSong();
    };

    $scope.play = function () {
        if (globals.settings.Jukebox) {
            $scope.sendToJukebox('start');
        }
    };

    $scope.pause = function () {
        if (globals.settings.Jukebox) {
            $scope.sendToJukebox('stop');
        }
    };

    $scope.previousTrack = function () {
        player.previousTrack();
    };

    $scope.nextTrack = function () {
        player.nextTrack();
    };

    //TODO: Hyz: updateFavorite - leave in rootScope ?
}]);
