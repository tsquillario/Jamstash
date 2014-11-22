/**
* jamstash.player Module
*
* Control the HTML5 player through jplayer.js
*/
angular.module('jamstash.player', ['jamstash.player.service', 'jamstash.player.directive'])

.controller('PlayerCtrl', ['$scope', 'player', function($scope, player){
	'use strict';

    $scope.playingSong = {
        id: '',
        album: '',
        name: '',
        specs: '',
        starred: '',
        coverartfull: '',
        coverartthumb: ''
    };

    $scope.previousTrack = function () {

    };

    $scope.defaultPlay = function () {

    };

    $scope.nextTrack = function () {

    };

    $scope.updateFavorite = function (song) {

    };

    $scope.toggleSetting = function (settingName) {

    };

    $scope.settings = {
        SaveTrackPosition: '',
        Jukebox: '',
        Repeat: ''
    };

}]);
