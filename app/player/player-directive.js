angular.module('jamstash.player.directive', ['jamstash.settings'])

.directive('jplayer', ['player', 'globals', function(playerService, globals) {
    'use strict';
    return {
        restrict: 'EA',
        template: '<div></div>',
        link: function(scope, element, attrs) {

            var $player = element.children('div'),
                cls = 'pause';
            console.log($player);
            var audioSolution = 'html,flash';
            if (globals.settings.ForceFlash) {
                audioSolution = 'flash,html';
            }

            var updatePlayer = function() {
                $player.jPlayer({
                    // Flash fallback for outdated browser not supporting HTML5 audio/video tags
                    // http://jplayer.org/download/
                    swfPath: 'bower_components/jplayer/jquery.jplayer/Jplayer.swf',
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
                    ready: function() {
                        //Do nothing
                    },
                    play: function() {
                        console.log('jplayer play');
                        element.addClass(cls);
                    },
                    pause: function() {
                        console.log('jplayer pause');
                        element.removeClass(cls);
                    },
                    stop: function() {
                        console.log('jplayer stop');
                        element.removeClass(cls);
                    },
                    ended: function() {
                        console.log('jplayer ended');
                        playerService.nextTrack();
                        element.removeClass(cls);
                    }
                });
            };

            updatePlayer();

            scope.$watch(function () {
                return playerService.playingSong;
            }, function (newVal) {
                console.log('playingSong changed !');
                $player.jPlayer('setMedia', {'mp3': newVal.url})
                    .jPlayer('play');
            });
        } //end link
    };
}]);
