angular.module('jamstash.player.directive', ['jamstash.player.service', 'jamstash.settings'])

.directive('jplayer', ['player', 'globals', function(playerService, globals) {
    'use strict';
    return {
        restrict: 'EA',
        template: '<div></div>',
        link: function(scope, element, attrs) {

            var $player = element.children('div');
            console.log($player);
            var audioSolution = 'html,flash';
            if (globals.settings.ForceFlash) {
                audioSolution = 'flash,html';
            }

            var updatePlayer = function() {
                $player.jPlayer({
                    // Flash fallback for outdated browser not supporting HTML5 audio/video tags
                    // http://jplayer.org/download/
                    swfPath: 'bower_components/jplayer/dist/jplayer/jquery.jplayer.swf',
                    wmode: 'window',
                    solution: audioSolution,
                    supplied: 'mp3',
                    preload: 'auto',
                    cssSelectorAncestor: '#player',
                    cssSelector: {
                        play: '.PlayTrack',
                        pause: '.PauseTrack',
                        seekBar: '#audiocontainer .scrubber',
                        playBar: '#audiocontainer .progress',
                        mute: '#action_Mute',
                        unmute: '#action_UnMute',
                        volumeMax: '#action_VolumeMax',
                        currentTime: '#played',
                        duration: '#duration'
                    },
                    play: function() {
                        console.log('jplayer play');
                        $('#playermiddle').css('visibility', 'visible');
                        $('#songdetails').css('visibility', 'visible');
                    },
                    pause: function() {
                        console.log('jplayer pause');
                    },
                    ended: function() {
                        console.log('jplayer ended');
                        playerService.nextTrack();
                        scope.$apply();
                    }
                });
            };

            updatePlayer();

            scope.$watch(function () {
                return playerService.getPlayingSong();
            }, function (newVal) {
                console.log('playingSong changed !');
                $player.jPlayer('setMedia', {'mp3': newVal.url})
                    .jPlayer('play');
            });

            scope.$watch(function () {
                return playerService.restartSong;
            }, function (newVal) {
                if(newVal === true) {
                    console.log('restartSong changed !');
                    $player.jPlayer('play', 0);
                    playerService.restartSong = false;
                }
            });
        } //end link
    };
}]);
