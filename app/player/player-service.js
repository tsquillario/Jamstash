/**
* jamstash.player.service Module
*
* Enables app-wide control of the behavior of the player directive.
*/
angular.module('jamstash.player.service', ['jamstash.settings'])

.factory('player', function () {
    'use strict';

    var player = {
        queue: [],
        playingIndex: -1,
        playingSong: {},

        play: function(song) {
            //song.playing = true;
            player.playingSong = song;
            console.log('player service - play()', song);
        },

        playFirstSong: function () {
            player.playingIndex = 0;
            player.play(player.queue[0]);
        },

        load: function(song) {
            console.log('player service - load()');
        },

        restart: function() {
            console.log('player service - restart()');
        },

        nextTrack: function() {
            console.log('player service - nextTrack()');
            console.log(player.playingIndex, player.queue);
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
        }
    };

    return player;
});
