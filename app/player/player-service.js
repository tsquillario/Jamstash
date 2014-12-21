/**
* jamstash.player.service Module
*
* Manages the player and playing queue. Use it to play a song, go to next track or add songs to the queue.
*/
angular.module('jamstash.player.service', ['jamstash.settings', 'angular-underscore/utils'])

.factory('player', ['globals', function (globals) {
    'use strict';

    var player = {
        queue: [],
        playingIndex: -1,
        playingSong: {},
        restartSong: false,
        loadSong: false,

        play: function(song) {
            var songIndexInQueue;
            // Find the song's index in the queue, if it's in there
            songIndexInQueue = player.queue.indexOf(song);
            player.playingIndex = (songIndexInQueue !== undefined) ? songIndexInQueue : -1;

            if(player.playingSong === song) {
                // We call restart because the playingSong hasn't changed and the directive won't
                // play the song again
                player.restart();
            } else {
                player.playingSong = song;
            }
        },

        playFirstSong: function() {
            player.playingIndex = 0;
            player.play(player.queue[0]);
        },

        load: function(song) {
            player.loadSong = true;
            player.play(song);
        },

        restart: function() {
            player.restartSong = true;
        },

        // Called from the player directive at the end of the current song
        songEnded: function() {
            if (globals.settings.Repeat) {
                // repeat current track
                player.restart();
            } else if (player.isLastSongPlaying() === true) {
                if (globals.settings.LoopQueue) {
                    // Loop to first track in queue
                    player.playingIndex = -1;
                    player.nextTrack();
                }
            } else {
                player.nextTrack();
            }
        },

        nextTrack: function() {
            if((player.playingIndex + 1) < player.queue.length) {
                var nextTrack = player.queue[player.playingIndex + 1];
                player.playingIndex++;
                player.play(nextTrack);
            }
        },

        previousTrack: function() {
            if((player.playingIndex - 1) > 0) {
                var previousTrack = player.queue[player.playingIndex - 1];
                player.playingIndex--;
                player.play(previousTrack);
            } else if (player.queue.length > 0) {
                player.playFirstSong();
            }
        },

        emptyQueue: function() {
            player.queue = [];
        },

        shuffleQueue: function() {
            player.queue = _.shuffle(player.queue);
        },

        addSong: function(song) {
            player.queue.push(song);
        },

        removeSong: function(song) {
            var index = player.queue.indexOf(song);
            player.queue.splice(index, 1);
        },

        getPlayingSong: function() {
            return player.playingSong;
        },

        isLastSongPlaying: function() {
            return ((player.playingIndex +1) === player.queue.length);
        }
    };

    return player;
}]);
