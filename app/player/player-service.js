/**
* jamstash.player.service Module
*
* Enables app-wide control of the behavior of the player directive.
*/
angular.module('jamstash.player.service', ['jamstash.settings', 'angular-underscore/utils'])

.factory('player', ['$rootScope', function ($rootScope) {
    'use strict';

    var player = {
        queue: [],
        playingIndex: -1,
        playingSong: {},

        play: function(song) {
            console.log('player service - play()', song);
            var songIndexInQueue;
            // Find the song's index in the queue, if it's in there
            _.find(player.queue, function(queuedSong, songIdx){
                if(queuedSong.id === song.id){ songIndexInQueue = songIdx; console.log('sond Index in queue found = ', songIndexInQueue); return true; }
            });

            console.log('play() playingIndex', player.playingIndex);
            player.playingIndex = (songIndexInQueue !== undefined) ? songIndexInQueue : -1;
            console.log('play() playingIndex', player.playingIndex);
            console.log('play() playingSong = ', player.playingSong);
            player.playingSong = song;
            console.log('play() playingSong = ', player.playingSong);
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
            console.log('nextTrack() playingIndex = ', player.playingIndex);
            if((player.playingIndex + 1) < player.queue.length) {
                var nextTrack = player.queue[player.playingIndex + 1];
                player.playingIndex++;
                player.play(nextTrack);
            }
            console.log('nextTrack() playingIndex = ', player.playingIndex);
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

        // TODO: Hyz Special nextTrack for jplayer to call at ended event
        playEnded: function () {
            player.nextTrack();
            $rootScope.$apply();
        },

        getPlayingSong: function () {
            return player.playingSong;
        }
    };

    return player;
}]);
