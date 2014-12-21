/**
 * jamstash.player.directive module
 *
 * Encapsulates the jPlayer plugin. It watches the player service for the song to play, load or restart.
 * It also enables jPlayer to attach event handlers to our UI through css Selectors.
 */
angular.module('jamstash.player.directive', ['jamstash.player.service', 'jamstash.settings', 'jamstash.subsonic.service'])

.directive('jplayer', ['player', 'globals', 'subsonic', function(playerService, globals, subsonic) {
    'use strict';
    return {
        restrict: 'EA',
        template: '<div></div>',
        link: function(scope, element) {

            var $player = element.children('div');
            var audioSolution = 'html,flash';
            if (globals.settings.ForceFlash) {
                audioSolution = 'flash,html';
            }

            var updatePlayer = function() {
                $player.jPlayer({
                    // Flash fallback for outdated browser not supporting HTML5 audio/video tags
                    // TODO: Hyz: Replace in Grunt !
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
                        scope.revealControls();
                        scope.scrobbled = false;
                    },
                    ended: function() {
                        console.log('jplayer ended');
                        // We do this here and not on the service because we cannot create
                        // a circular dependency between the player and subsonic services
                        if(playerService.isLastSongPlaying() && globals.settings.AutoPlay) {
                            // Load more random tracks
                            subsonic.getRandomSongs('play', '', '');
                        } else {
                            playerService.songEnded();
                        }
                        scope.$apply();
                    },
                    timeupdate: function (event) {
                        // Scrobble song once percentage is reached
                        var p = event.jPlayer.status.currentPercentAbsolute;
                        if (!scope.scrobbled && p > 30) {
                            if (globals.settings.Debug) { console.log('LAST.FM SCROBBLE - Percent Played: ' + p); }
                            subsonic.scrobble(scope.currentSong);
                            scope.scrobbled = true;
                        }
                    }
                });
            };

            updatePlayer();

            scope.currentSong = {};
            scope.scrobbled = false;

            scope.$watch(function () {
                return playerService.getPlayingSong();
            }, function (newVal) {
                console.log('playingSong changed !');
                scope.currentSong = newVal;
                $player.jPlayer('setMedia', {'mp3': newVal.url});
                if(playerService.loadSong === true) {
                    // Do not play, only load
                    playerService.loadSong = false;
                    scope.revealControls();
                } else {
                    $player.jPlayer('play');
                }
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

            scope.revealControls = function () {
                $('#playermiddle').css('visibility', 'visible');
                $('#songdetails').css('visibility', 'visible');
            };

        } //end link
    };
}]);
