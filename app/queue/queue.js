/**
* jamstash.queue.controller Module
*
* Manages the playing queue. Gives access to the player service's queue-related functions,
* like adding, removing and shuffling the queue.
*/
angular.module('jamstash.queue.controller', ['jamstash.player.service'])

.controller('QueueController', ['$scope', 'globals', 'player',
	function ($scope, globals, player) {
	'use strict';
    $scope.settings = globals.settings;
    $scope.player = player;

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

    $scope.isPlayingSong = function (song) {
        return angular.equals(song, player.getPlayingSong());
    };

    $scope.$watch(function () {
        return player.getPlayingSong();
    }, function (newSong) {
        if(newSong !== undefined) {
            //TODO: Hyz: Shouldn't it be in a directive ?
            $('#SideBar').stop().scrollTo('.song.id' + newSong.id, 400);
        }
    });

    /**
     * Change the queue's order through jQuery UI's sortable
     */
    $scope.dragStart = function (e, ui) {
        ui.item.data('start', ui.item.index());
    };

    $scope.dragEnd = function (e, ui) {
        var start = ui.item.data('start'),
            end = ui.item.index();
        player.queue.splice(end, 0, player.queue.splice(start, 1)[0]);
    };

    //TODO: Hyz: updateFavorite - leave in rootScope ?
}]);
