/**
* jamstash.player Module
*
* Enables basic control of the player : play, pause, previous track, next track.
* Also provides the currently playing song's info through the scope so it can be displayed next to
* the player controls.
*/
angular.module('jamstash.player.controller', ['jamstash.player.service', 'jamstash.player.directive', 'jamstash.repeat.directive'])

.controller('PlayerController', ['$scope', 'player', 'globals',
    function ($scope, player, globals) {
	'use strict';

    $scope.getPlayingSong = player.getPlayingSong;
    $scope.settings = globals.settings;
    $scope.playerSettings = player.settings;

    $scope.play = function () {
        if (globals.settings.Jukebox) {
            $scope.sendToJukebox('start');
        } else {
            player.togglePause();
        }
    };

    $scope.pause = function () {
        if (globals.settings.Jukebox) {
            $scope.sendToJukebox('stop');
        } else {
            player.togglePause();
        }
    };

    $scope.previousTrack = player.previousTrack;
    $scope.nextTrack = player.nextTrack;
}]);
