/**
 * jamstash.player.directive module
 *
 * Encapsulates the jPlayer plugin. It watches the player service for the song to play, load or restart.
 * It also enables jPlayer to attach event handlers to our UI through css Selectors.
 */
angular.module('jamstash.player.directive', ['jamstash.player.service', 'jamstash.settings', 'jamstash.subsonic.service', 'jamstash.notifications', 'jamstash.utils', 'jamstash.persistence'])

.directive('jplayer', ['player', 'globals', 'subsonic', 'notifications', 'utils', '$window', 'persistence',
    function(playerService, globals, subsonic, notifications, utils, $window, persistence) {
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
                    errorAlerts: false,
                    warningAlerts: false,
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
                    setmedia: function() {
                        scope.scrobbled = false;
                    },
                    play: function() {
                        scope.revealControls();
                    },
                    ended: function() {
                        // We do this here and not on the service because we cannot create
                        // a circular dependency between the player and subsonic services
                        if(playerService.isLastSongPlaying() && globals.settings.AutoPlay) {
                            // Load more random tracks
                            subsonic.getRandomSongs().then(function (songs) {
                                playerService.addSongs(songs).songEnded();
                            });
                        } else {
                            playerService.songEnded();
                        }
                        scope.$apply();
                    },
                    timeupdate: function (event) {
                        // Scrobble song once percentage is reached
                        var p = event.jPlayer.status.currentPercentAbsolute;
                        var isPlaying = !event.jPlayer.status.paused;
                        if (!scope.scrobbled && p > 30 && isPlaying) {
                            if (globals.settings.Debug) { console.log('LAST.FM SCROBBLE - Percent Played: ' + p); }
                            subsonic.scrobble(scope.currentSong);
                            scope.scrobbled = true;
                        }
                    },
                    error: function (event) {
                        var position = event.jPlayer.status.currentTime;
                        if(position) {
                           $player.jPlayer('play', position);
                        }
                        if (globals.settings.Debug) {
                            console.log("jPlayer error: ", event.jPlayer.error);
                            console.log("Stream interrupted, retrying from position: ", position);
                        }
                    }
                });
            };

            scope.$watch(function () {
                return playerService.getPlayingSong();
            }, function (newSong) {
                if(newSong !== undefined) {
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

            scope.$watch(function () {
                return globals.settings.SaveTrackPosition;
            }, function (newVal) {
                if (newVal === true) {
                    scope.startSavePosition();
                }
            });

            scope.revealControls = function () {
                $('#playermiddle').css('visibility', 'visible');
                $('#songdetails').css('visibility', 'visible');
            };

            scope.startSavePosition = function () {
                if (globals.settings.SaveTrackPosition) {
                    if (timerid !== 0) {
                        $window.clearInterval(timerid);
                    }
                    timerid = $window.setInterval(function () {
                        var audio = $player.data('jPlayer');
                        if (globals.settings.SaveTrackPosition && scope.currentSong !== undefined &&
                            audio !== undefined && audio.status.currentTime > 0 && audio.status.paused === false) {
                            $('#action_SaveProgress')
                                .fadeTo("slow", 0).delay(500)
                                .fadeTo("slow", 1).delay(500)
                                .fadeTo("slow", 0).delay(500)
                                .fadeTo("slow", 1);
                            scope.currentSong.position = audio.status.currentTime;
                            persistence.saveTrackPosition(scope.currentSong);
                            persistence.saveQueue();
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
