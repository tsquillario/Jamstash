// jscs:disable validateQuoteMarks
describe("jplayer directive", function () {
    'use strict';

    var element, scope, $player, playingSong, deferred,
        playerService, mockGlobals, subsonic, notifications, persistence, Page, $interval;

    beforeEach(function () {
        // We redefine globals because in some tests we need to alter the settings
        mockGlobals = {
            settings: {
                AutoPlay: false,
                Jukebox: false,
                NotificationSong: false,
                SaveTrackPosition: false
            }
        };
        // Redefined to avoid firing 'play' with a previous test song
        playingSong = undefined;
        module('jamstash.player.directive', function ($provide) {
            // Mock the player service
            $provide.decorator('player', function ($delegate) {
                $delegate.pauseSong = false;
                $delegate.restartSong = false;
                $delegate.loadSong = false;
                $delegate.getPlayingSong = jasmine.createSpy('getPlayingSong').and.callFake(function () {
                    return playingSong;
                });
                $delegate.getVolume = jasmine.createSpy('getVolume').and.returnValue(1.0);
                $delegate.nextTrack = jasmine.createSpy('nextTrack');
                $delegate.songEnded = jasmine.createSpy('songEnded');
                $delegate.isLastSongPlaying = jasmine.createSpy('isLastSongPlaying');
                return $delegate;
            });
            $provide.value('globals', mockGlobals);
        });

        spyOn($.fn, "jPlayer").and.callThrough();
        inject(function ($rootScope, $compile, _$interval_, $q, _player_, _subsonic_, _notifications_, _persistence_, _Page_) {
            playerService = _player_;
            subsonic = _subsonic_;
            notifications = _notifications_;
            persistence = _persistence_;
            $interval = _$interval_;
            Page = _Page_;
            // Compile the directive
            scope = $rootScope.$new();
            element = '<div id="playdeck_1" jplayer></div>';
            element = $compile(element)(scope);
            scope.$digest();
            deferred = $q.defer();
        });
        spyOn(Page, "setTitleSong");
        $.fancybox.isOpen = false;
        $player = element.children('div');
    });

    describe("When the player service's current song changes,", function () {
        beforeEach(function () {
            // To avoid errors breaking the test, we stub jPlayer
            $.fn.jPlayer.and.stub();
            playingSong = {
                id: 659,
                url: 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate',
                suffix: 'mp3'
            };
        });

        it("it sets jPlayer's media, stores the song for future scrobbling and sets the page title with the song", function () {
            scope.$apply();

            expect($.fn.jPlayer).toHaveBeenCalledWith('setMedia', { mp3: 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate' });
            expect(scope.currentSong).toEqual(playingSong);
            expect(Page.setTitleSong).toHaveBeenCalledWith(playingSong);
        });

        it("if the global setting Jukebox is true, it mutes jPlayer and adds the song to subsonic's Jukebox", function () {
            mockGlobals.settings.Jukebox = true;
            spyOn(subsonic, "addToJukebox")

            scope.$apply();
            expect($player.jPlayer).toHaveBeenCalledWith('mute', true);
            expect(subsonic.addToJukebox).toHaveBeenCalledWith(
                jasmine.objectContaining({ id: playingSong.id}))
        });

        it("if the player service's loadSong flag is true, it does not play the song, it displays the player controls and sets the player to the song's supplied position", function () {
            // Reset the calls because the watcher on player.pauseSong calls jPlayer('play')
            $player.jPlayer.calls.reset();
            spyOn(scope, "revealControls");
            playerService.loadSong = true;
            playingSong.position = 42.2784;

            scope.$apply();

            expect($player.jPlayer).not.toHaveBeenCalledWith('play');
            expect($player.jPlayer).toHaveBeenCalledWith('pause', 42.2784);
            expect(playerService.loadSong).toBeFalsy();
            expect(scope.revealControls).toHaveBeenCalled();
        });

        describe("if the player service's loadSong flag is false,", function () {
            it("it plays the song", function () {
                playerService.loadSong = false;
                scope.$apply();

                expect($player.jPlayer).toHaveBeenCalledWith('play');
                expect(playerService.loadSong).toBeFalsy();
            });

            it("if the global setting NotificationSong is true, it displays a notification", function () {
                spyOn(notifications, "showNotification");
                mockGlobals.settings.NotificationSong = true;

                scope.$apply();

                expect(notifications.showNotification).toHaveBeenCalledWith(playingSong);
            });
        });

        it("if fancybox is open, it sets it up with the new song's cover art", function () {
            $.fancybox.isOpen = true;
            scope.fancyboxOpenImage = jasmine.createSpy("fancyboxOpenImage");

            scope.$apply();

            expect(scope.fancyboxOpenImage).toHaveBeenCalledWith(playingSong.coverartfull);
        });

        it("if the song's suffix is 'm4a', it sets jPlayer up with this format", function () {
            playingSong.suffix = 'm4a';
            scope.$apply();
            expect($.fn.jPlayer).toHaveBeenCalledWith('setMedia', { m4a: 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate' });
        });

        it("if the song's suffix is 'oga', it sets jPlayer up with this format", function () {
            playingSong.suffix = 'oga';
            scope.$apply();
            expect($.fn.jPlayer).toHaveBeenCalledWith('setMedia', { oga: 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate' });
        });
    });

    describe("", function () {
        beforeEach(function () {
            $.fn.jPlayer.and.stub();
            spyOn(subsonic, "sendToJukebox")
        });

        it("When the player service's restartSong flag is true, it restarts the current song, resets the restart flag to false and resets the scrobbled flag to false", function () {
            playerService.restartSong = true;
            scope.scrobbled = true;
            scope.$apply();

            expect($player.jPlayer).toHaveBeenCalledWith('play', 0);
            expect(playerService.restartSong).toBeFalsy();
            expect(scope.scrobbled).toBeFalsy();
        });

        it("When the player service's pauseSong is true, it pauses the current song", function () {
            playerService.pauseSong = true;
            scope.$apply();

            expect($player.jPlayer).toHaveBeenCalledWith('pause');
        });

        it("Given that the current song is paused, when the player service's pauseSong becomes false, it plays the song ", function () {
            playerService.pauseSong = true;
            scope.$apply();

            playerService.pauseSong = false;
            scope.$apply();
            expect($player.jPlayer).toHaveBeenCalledWith('play');
        });

        it("When the player service's pauseSong is true and jukebox is enabled, 'stop' is sent to the jukebox", function () {
            mockGlobals.settings.Jukebox = true;
            playerService.pauseSong = true;
            scope.$apply();

            expect(subsonic.sendToJukebox).toHaveBeenCalledWith('stop');
        });

        it("Given that the current song is paused and jukebox is enabled, 'start' is sent to the jukebox when it's unpaused", function () {
            mockGlobals.settings.Jukebox = true;

            playerService.pauseSong = true;
            scope.$apply();
            playerService.pauseSong = false;
            scope.$apply();

            expect(subsonic.sendToJukebox).toHaveBeenCalledWith('start');
        });

        it("When the player service's volume changes, it sets jPlayer's volume", function () {
            playerService.getVolume.and.returnValue(0.2034);
            scope.$apply();
            expect($player.jPlayer).toHaveBeenCalledWith('volume', 0.2034);
        });
    });

    describe("When jplayer has finished the current song,", function () {
        var ended;
        beforeEach(function () {
            ended = $.jPlayer.event.ended;
        });
        it("it notifies the player service that the song has ended", function () {
            $player.trigger(ended);
            expect(playerService.songEnded).toHaveBeenCalled();
        });

        it("given that the last song of the queue is playing and that the global setting AutoPlay is true, it asks subsonic for random tracks, notifies the player service that the song has ended and notifies the user", function () {
            mockGlobals.settings.AutoPlay = true;
            spyOn(subsonic, "getRandomSongs").and.returnValue(deferred.promise);
            spyOn(notifications, "updateMessage");
            playerService.isLastSongPlaying.and.returnValue(true);

            $player.trigger(ended);
            deferred.resolve();
            scope.$apply();

            expect(playerService.isLastSongPlaying).toHaveBeenCalled();
            expect(subsonic.getRandomSongs).toHaveBeenCalled();
            expect(notifications.updateMessage).toHaveBeenCalledWith('Auto Play Activated...', true);
        });
    });

    it("When jPlayer gets new media, it resets the scrobbled flag to false", function () {
        scope.scrobbled = true;

        var e = $.jPlayer.event.setmedia;
        $player.trigger(e);

        expect(scope.scrobbled).toBeFalsy();
    });

    it("When jPlayer throws an error, it tries to restart playback at the last position", function () {
        // Fake jPlayer's internal _trigger event because I can't trigger a manual error
        var fakejPlayer = {
            element: $player,
            status: { currentTime: 10.4228 }
        };
        var error = $.jPlayer.event.error;

        $.jPlayer.prototype._trigger.call(fakejPlayer, error);

        expect($player.jPlayer).toHaveBeenCalledWith('play', 10.4228);
    });

    it("When jPlayer starts to play the current song, it displays the player controls", function () {
        spyOn(scope, "revealControls");

        var e = $.jPlayer.event.play;
        $player.trigger(e);

        expect(scope.revealControls).toHaveBeenCalled();
    });

    it("revealControls - it displays the song details and the player controls", function () {
        $.fn.jPlayer.and.stub();
        affix('#playermiddle').css('visibility', 'hidden');
        affix('#songdetails').css('visibility', 'hidden');

        scope.revealControls();

        expect($('#playermiddle').css('visibility')).toEqual('visible');
        expect($('#songdetails').css('visibility')).toEqual('visible');
    });

    describe("Scrobbling -", function () {
        var fakejPlayer, timeUpdate;
        beforeEach(function () {
            spyOn(subsonic, "scrobble");
            scope.currentSong = {
                id: 5375
            };

            // Fake jPlayer's internal _trigger event because I can't trigger a manual timeupdate
            fakejPlayer = {
                element: $player,
                status: { currentPercentAbsolute: 31 }
            };
            timeUpdate = $.jPlayer.event.timeupdate;
        });

        it("Given a song that hasn't been scrobbled yet, When jPlayer reaches 30 percent of it, it scrobbles to last.fm using the subsonic service and sets the flag to true", function () {
            scope.scrobbled = false;

            // Trigger our fake timeupdate
            $.jPlayer.prototype._trigger.call(fakejPlayer, timeUpdate);

            expect(subsonic.scrobble).toHaveBeenCalledWith(scope.currentSong);
            expect(scope.scrobbled).toBeTruthy();
        });

        it("Given a song that has already been scrobbled, when jPlayer reaches 30 percent of it, it does not scrobble again and leaves the flag to true", function () {
            scope.scrobbled = true;

            // Trigger our fake timeupdate
            $.jPlayer.prototype._trigger.call(fakejPlayer, timeUpdate);

            expect(subsonic.scrobble).not.toHaveBeenCalled();
            expect(scope.scrobbled).toBeTruthy();
        });
    });

    it("When the global setting SaveTrackPosition becomes true, it starts saving the current song's position", function () {
        spyOn(scope, "startSavePosition");
        mockGlobals.settings.SaveTrackPosition = true;

        scope.$apply();

        expect(scope.startSavePosition).toHaveBeenCalled();
    });

    describe("Given that the global setting SaveTrackPosition is true,", function () {
        beforeEach(function () {
            mockGlobals.settings.SaveTrackPosition = true;
            spyOn(persistence, "saveTrackPosition");
            spyOn(persistence, "saveQueue");
        });

        it("every 30 seconds, it saves the current song's position and the playing queue", function () {
            scope.currentSong = { id: 419 };
            $player.data('jPlayer').status.currentTime = 35.3877;
            $player.data('jPlayer').status.paused = false;

            scope.startSavePosition();
            $interval.flush(30001);

            expect(scope.currentSong.position).toBe(35.3877);
            expect(persistence.saveTrackPosition).toHaveBeenCalledWith(scope.currentSong);
            expect(persistence.saveQueue).toHaveBeenCalled();
        });

        it("if the song is not playing, it does not save anything", function () {
            $player.data('jPlayer').status.currentTime = 0.0;
            $player.data('jPlayer').status.paused = true;

            scope.startSavePosition();
            $interval.flush(30001);

            expect(persistence.saveTrackPosition).not.toHaveBeenCalled();
            expect(persistence.saveQueue).not.toHaveBeenCalled();
        });

        it("if there was already a watcher, it clears it before adding a new one", function () {
            spyOn($interval, "cancel");

            scope.startSavePosition();
            scope.startSavePosition();
            expect($interval.cancel).toHaveBeenCalled();
        });
    });
});
