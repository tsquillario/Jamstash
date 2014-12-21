/**
* jamstash.player.service Module
*
* Enables app-wide control of the behavior of the player directive.
*/
angular.module('jamstash.player.service', ['jamstash.settings', 'angular-underscore/utils'])

.factory('player', function () {
    'use strict';

    var player = {
        queue: [],
        playingIndex: -1,
        playingSong: {},
        restartSong: false,

        play: function(song) {
            console.log('player service - play()', song);
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
            console.log('player service - playFirstSong()');
            player.playingIndex = 0;
            player.play(player.queue[0]);
        },

        load: function(song) {
            console.log('player service - load()');
        },

        restart: function() {
            console.log('player service - restart()');
            player.restartSong = true;
        },

        nextTrack: function() {
            console.log('player service - nextTrack()');
            if((player.playingIndex + 1) < player.queue.length) {
                var nextTrack = player.queue[player.playingIndex + 1];
                player.playingIndex++;
                player.play(nextTrack);
            }
        },

        previousTrack: function() {
            console.log(('player service - previousTrack()'));
            if((player.playingIndex - 1) > 0) {
                var previousTrack = player.queue[player.playingIndex - 1];
                player.playingIndex--;
                player.play(previousTrack);
            } else if (player.queue.length > 0) {
                player.playFirstSong();
            }
        },

        emptyQueue: function() {
            console.log('player service - emptyQueue()');
            player.queue = [];
        },

        shuffleQueue: function() {
            console.log('player service - shuffleQueue()');
            player.queue = _.shuffle(player.queue);
        },

        addSong: function(song) {
            console.log('player service - addSong()');
            player.queue.push(song);
        },

        removeSong: function(song) {
            console.log('player service - removeSong()');
            var index = player.queue.indexOf(song);
            player.queue.splice(index, 1);
        },

        getPlayingSong: function() {
            return player.playingSong;
        }
    };

    return player;
});
