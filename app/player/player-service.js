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
        currentlyPlayingIndex: -1,

        play: function(song) {
            song.playing = true;
            console.log('play()');
        },

        load: function(song) {

        },

        restart: function() {
            console.log('restart()');
        },

        nextTrack: function() {
            if((player.currentlyPlayingIndex + 1) < player.queue.length) {
                var nextTrack = player.queue[player.currentlyPlayingIndex + 1];
                player.currentlyPlayingIndex++;
                player.play(nextTrack);
            }
        },

        previousTrack: function() {
            if((player.currentlyPlayingIndex - 1) > 0) {
                var previousTrack = player.queue[player.currentlyPlayingIndex - 1];
                player.currentlyPlayingIndex--;
                player.play(previousTrack);
            } else if (player.queue.length > 0) {
                player.currentlyPlayingIndex = 0;
                player.play(player.queue[player.currentlyPlayingIndex]);
            }
        }
    };

    return player;
});
