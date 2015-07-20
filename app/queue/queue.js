/**
* jamstash.queue.controller Module
*
* Manages the playing queue. Gives access to the player service's queue-related functions,
* like adding, removing and shuffling the queue.
*/
angular.module('jamstash.queue.controller', [
    'ngLodash',
    'jamstash.player.service',
    'jamstash.subsonic.service',
    'jamstash.selectedsongs',
    'jamstash.notifications',
    'ui.sortable'
])

.controller('QueueController', QueueController);

QueueController.$inject = [
    '$scope',
    'lodash',
    'player',
    'SelectedSongs',
    'subsonic',
    'notifications'
];

function QueueController(
    $scope,
    _,
    player,
    SelectedSongs,
    subsonic,
    notifications
) {
    'use strict';

    var self = this;
    _.extend(self, {
        player: player,
        emptyQueue                  : emptyQueue,
        isPlayingSong               : isPlayingSong,
        playSong                    : player.play,
        removeSelectedSongsFromQueue: removeSelectedSongsFromQueue,
        removeSongFromQueue         : player.removeSong,
        shuffleQueue                : shuffleQueue,
        toggleSelection             : SelectedSongs.toggle,
        toggleStar                  : toggleStar
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

    // TODO: Hyz: Duplicate of main-controller's toggleStar.
    // Refactor in a SubsonicSong service that'll hold all the common operations done on songs.
    function toggleStar(song) {
        var promise = subsonic.toggleStar(song).then(function (newState) {
            song.starred = newState;
            notifications.updateMessage('Favorite Updated!', true);
        });

        return promise;
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
