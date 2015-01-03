angular.module('jamstash.queue.controller', ['jamstash.player.service'])

.controller('QueueController', ['$scope', 'globals', 'player',
	function ($scope, globals, player) {
	'use strict';
    $scope.settings = globals.settings;
    $scope.player = player;
    $scope.itemType = 'pl'; // TODO: Hyz: What is this ?

    $scope.playSong = function (song) {
        player.play(song);
    };

    $scope.emptyQueue = function() {
        player.emptyQueue();
        //TODO: Hyz: Shouldn't it be in a directive ?
        $.fancybox.close();
    };

    $scope.shuffleQueue = function() {
        player.shuffleQueue();
    };

    $scope.addSongToQueue = function(song) {
        player.addSong(song);
    };

    $scope.removeSongFromQueue = function(song) {
        player.removeSong(song);
    };

    $scope.removeSelectedSongsFromQueue = function () {
        player.removeSongs($scope.selectedSongs);
    };
}]);
