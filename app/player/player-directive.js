/**
 * jamstash.player.directive module
 *
 * Encapsulates the jPlayer plugin. It watches the player service for the song to play, load or restart.
 * It also enables jPlayer to attach event handlers to our UI through css Selectors.
 */
angular.module('jamstash.player.directive', ['jamstash.player.service', 'jamstash.settings', 'jamstash.subsonic.service', 'jamstash.notifications', 'jamstash.utils', 'angular-locker'])

.directive('jplayer', ['player', 'globals', 'subsonic', 'notifications', 'utils', 'locker', '$window',
    function(playerService, globals, subsonic, notifications, utils, locker, $window) {
    'use strict';
    return {
        restrict: 'EA',
        template: '<div></div>',
        link: function(scope, element) {

            var timerid;
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
                        scope.revealControls();
                        scope.scrobbled = false;
                    },
                    ended: function() {
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

            scope.$watch(function () {
                return playerService.getPlayingSong();
            }, function (newSong) {
                scope.currentSong = newSong;
                $player.jPlayer('setMedia', {'mp3': newSong.url});
                if(playerService.loadSong === true) {
                    // Do not play, only load
                    playerService.loadSong = false;
                    scope.revealControls();
                    $player.jPlayer('pause', newSong.position);
                } else {
                    $player.jPlayer('play');
                    if(globals.settings.NotificationSong) {
                        notifications.showNotification(newSong.coverartthumb, utils.toHTML.un(newSong.name), utils.toHTML.un(newSong.artist + ' - ' + newSong.album), 'text', '#NextTrack');
                    }
                }
            });

            scope.$watch(function () {
                return playerService.restartSong;
            }, function (newVal) {
                if(newVal === true) {
                    $player.jPlayer('play', 0);
                    playerService.restartSong = false;
                }
            });

            scope.revealControls = function () {
                $('#playermiddle').css('visibility', 'visible');
                $('#songdetails').css('visibility', 'visible');
            };

            scope.saveTrackPosition = function () {
                var audio = $player.data('jPlayer');
                if (audio !== undefined && scope.currentSong !== undefined) {
                    var position = audio.status.currentTime;
                    if (position !== null) {
                        scope.currentSong.position = position;
                        locker.put('CurrentSong', scope.currentSong);
                        if (globals.settings.Debug) { console.log('Saving Current Position: ', scope.currentSong); }
                    }
                }
            };

            scope.saveQueue = function () {
                locker.put('CurrentQueue', playerService.queue);
                if (globals.settings.Debug) { console.log('Saving Queue: ' + playerService.queue.length + ' songs'); }
            };

            scope.startSavePosition = function () {
                if (globals.settings.SaveTrackPosition) {
                    if (timerid !== 0) {
                        $window.clearInterval(timerid);
                    }
                    timerid = $window.setInterval(function () {
                        var audio = $player.data('jPlayer');
                        if (globals.settings.SaveTrackPosition && audio.status.currentTime > 0 && audio.status.paused === false) {
                            $('#action_SaveProgress')
                                .fadeTo("slow", 0).delay(500)
                                .fadeTo("slow", 1).delay(500)
                                .fadeTo("slow", 0).delay(500)
                                .fadeTo("slow", 1);
                            scope.saveTrackPosition();
                            scope.saveQueue();
                        }
                    }, 30000);
                }
            };

             // Startup
            timerid = 0;
            scope.currentSong = {};
            scope.scrobbled = false;

            updatePlayer();
            scope.startSavePosition();

        } //end link
    };
}]);
