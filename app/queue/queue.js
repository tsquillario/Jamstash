/**
* jamstash.queue.controller Module
*
* Manages the playing queue. Gives access to the player service's queue-related functions,
* like adding, removing and shuffling the queue.
*/
angular.module('jamstash.queue.controller', [
    'ngLodash',
    'jamstash.player.service',
    'jamstash.selectedsongs',
    'ui.sortable'
])

.controller('QueueController', QueueController);

QueueController.$inject = [
    '$scope',
    'lodash',
    'player',
    'SelectedSongs'
];

function QueueController(
    $scope,
    _,
    player,
    SelectedSongs
) {
    'use strict';

    var self = this;
    _.extend(self, {
        player: player,
        addSongToQueue              : player.addSong,
        emptyQueue                  : emptyQueue,
        isPlayingSong               : isPlayingSong,
        playSong                    : player.play,
        removeSelectedSongsFromQueue: removeSelectedSongsFromQueue,
        removeSongFromQueue         : player.removeSong,
        shuffleQueue                : shuffleQueue,
        toggleSelection             : SelectedSongs.toggle
    });

    function emptyQueue() {
        player.emptyQueue();
        // TODO: Hyz: Shouldn't it be in a directive ?
        $.fancybox.close();
    }

    function isPlayingSong(song) {
        return angular.equals(song, player.getPlayingSong());
    }

    function removeSelectedSongsFromQueue() {
        player.removeSongs(SelectedSongs.get());
    }

    function shuffleQueue() {
        player.shuffleQueue();
        // TODO: Hyz: Shouldn't it be in a directive ?
        $('#SideBar').stop().scrollTo('.header', 400);
    }

    $scope.$watch(function () {
        return player.getPlayingSong();
    }, function (newSong) {
        if (newSong !== undefined) {
            // TODO: Hyz: Shouldn't it be in a directive ?
            $('#SideBar').stop().scrollTo('.song.id' + newSong.id, 400);
        }
    });
}
