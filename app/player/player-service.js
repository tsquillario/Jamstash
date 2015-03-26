/**
* jamstash.player.service Module
*
* Manages the player and playing queue. Use it to play a song, go to next track or add songs to the queue.
*/
angular.module('jamstash.player.service', ['jamstash.settings.service', 'angular-underscore/utils'])

.factory('player', ['globals', function (globals) {
    'use strict';

    var playerVolume = 1.0;

    var player = {
        // playingIndex and playingSong aren't meant to be used, they only are public for unit-testing purposes
        _playingIndex: -1,
        _playingSong: undefined,
        queue: [],
        pauseSong: false,
        restartSong: false,
        loadSong: false,

        play: function (song) {
            // Find the song's index in the queue, if it's in there
            var index = player.indexOfSong(song);
            player._playingIndex = (index !== undefined) ? index : -1;
            if(player._playingSong === song) {
                // We call restart because the _playingSong hasn't changed and the directive won't
                // play the song again
                player.restart();
            } else {
                player._playingSong = song;
            }
        },

        togglePause: function () {
            if (player.pauseSong) {
                player.pauseSong = false;
            } else {
                player.pauseSong = true;
            }
        },

        playFirstSong: function () {
            player._playingIndex = 0;
            player.play(player.queue[0]);
        },

        load: function (song) {
            player.loadSong = true;
            player.play(song);
        },

        restart: function () {
            player.restartSong = true;
        },

        // Called from the player directive at the end of the current song
        songEnded: function () {
            if (globals.settings.Repeat) {
                // repeat current track
                player.restart();
            } else if (player.isLastSongPlaying() === true) {
                if (globals.settings.LoopQueue) {
                    // Loop to first track in queue
                    player.playFirstSong();
                }
            } else {
                player.nextTrack();
            }
        },

        nextTrack: function () {
            // Find the song's index in the queue, in case it changed (with a drag & drop)
            var index = player.indexOfSong(player._playingSong);
            player._playingIndex = (index !== undefined) ? index : -1;

            if((player._playingIndex + 1) < player.queue.length) {
                var nextTrack = player.queue[player._playingIndex + 1];
                player._playingIndex++;
                player.play(nextTrack);
            }
        },

        previousTrack: function () {
            // Find the song's index in the queue, in case it changed (with a drag & drop)
            var index = player.indexOfSong(player._playingSong);
            player._playingIndex = (index !== undefined) ? index : -1;

            if((player._playingIndex - 1) > 0) {
                var previousTrack = player.queue[player._playingIndex - 1];
                player._playingIndex--;
                player.play(previousTrack);
            } else if (player.queue.length > 0) {
                player.playFirstSong();
            }
        },

        emptyQueue: function () {
            player.queue = [];
            return player;
        },

        shuffleQueue: function () {
            player.queue = _(player.queue).shuffle();
            return player;
        },

        addSong: function (song) {
            player.queue.push(song);
            return player;
        },

        addSongs: function (songs) {
            player.queue = player.queue.concat(songs);
            return player;
        },

        removeSong: function (song) {
            var index = player.queue.indexOf(song);
            player.queue.splice(index, 1);
            return player;
        },

        removeSongs: function (songs) {
            player.queue = _(player.queue).difference(songs);
            return player;
        },

        getPlayingSong: function () {
            return player._playingSong;
        },

        isLastSongPlaying: function () {
            return ((player._playingIndex +1) === player.queue.length);
        },

        indexOfSong: function (song) {
            for (var i = player.queue.length - 1; i >= 0; i--) {
                if (angular.equals(song, player.queue[i])) {
                    return i;
                }
            }
            return undefined;
        },

        turnVolumeUp: function () {
            var volume = playerVolume;
            if ((volume + 0.1) > 1 || volume < 0) {
                volume = 0.9;
            }
            volume += 0.1;
            playerVolume = Math.round(volume * 100) / 100;
            return volume;
        },

        turnVolumeDown: function () {
            var volume = playerVolume;
            if (volume > 1 || (volume - 0.1) < 0) {
                volume = 0.1;
            }
            volume -= 0.1;
            playerVolume = Math.round(volume * 100) / 100;
            return volume;
        },

        getVolume: function () {
            return playerVolume;
        },

        setVolume: function (volume) {
            if (volume > 1) { volume = 1; }
            else if(volume < 0) { volume = 0; }
            playerVolume = Math.round(volume * 100) / 100;
            return player;
        }
    };

    return player;
}]);
