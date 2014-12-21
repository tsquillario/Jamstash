angular.module('jamstash.queue.controller', ['jamstash.player.service'])

.controller('QueueController', ['$scope', 'globals', 'player',
	function ($scope, globals, player) {
	'use strict';
    $scope.settings = globals.settings;
    $scope.player = player;
    $scope.itemType = 'pl'; // TODO: Hyz: What is this ?

    $scope.playSong = function (song) {
        console.log('Queue Controller - playSong()', song);
        player.play(song);
    };

    $scope.queueEmpty = function() {
        player.emptyQueue();
    };

    $scope.queueShuffle = function() {
        player.shuffleQueue();
    };

    $scope.addSongToQueue = function(song) {
        player.addSong(song);
    };

    $scope.removeSongFromQueue = function(song) {
        player.removeSong(song);
    };
}]);
