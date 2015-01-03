describe("jplayer directive", function() {
    'use strict';

    var element, scope, $player, playingSong,
        playerService, mockGlobals, subsonic, notifications, persistence, $window;

    beforeEach(function() {
        // We redefine globals because in some tests we need to alter the settings
        mockGlobals = {
            settings: {
                AutoPlay: false
            }
        };
        // Redefined to avoid firing 'play' with a previous test song
        playingSong = undefined;
        module('jamstash.player.directive', function($provide) {
            // Mock the player service
            $provide.decorator('player', function($delegate) {
                $delegate.getPlayingSong = jasmine.createSpy('getPlayingSong').and.callFake(function() {
                    return playingSong;
                });
                $delegate.nextTrack = jasmine.createSpy('nextTrack');
                $delegate.songEnded = jasmine.createSpy('songEnded');
                $delegate.isLastSongPlaying = jasmine.createSpy('isLastSongPlaying');
                return $delegate;
            });
            //TODO: Hyz: We shouldn't have to know the utils service just for that. Remove these calls and deal with this in the Notifications service.
            // Mock the utils service
            $provide.decorator('utils', function ($delegate) {
                $delegate.toHTML.un = jasmine.createSpy('un');
                return $delegate;
            });
            $provide.value('globals', mockGlobals);
        });

        spyOn($.fn, "jPlayer").and.callThrough();
        inject(function($rootScope, $compile, _player_, _subsonic_, _notifications_, _persistence_, _$window_) {
            playerService = _player_;
            subsonic = _subsonic_;
            notifications = _notifications_;
            persistence = _persistence_;
            $window = _$window_;
            // Compile the directive
            scope = $rootScope.$new();
            element = '<div id="playdeck_1" jplayer></div>';
            element = $compile(element)(scope);
            scope.$digest();
        });
        $player = element.children('div');
    });

    describe("When the player service's current song changes,", function() {
        beforeEach(function() {
            // To avoid errors breaking the test, we stub jPlayer
            $.fn.jPlayer.and.stub();
            playingSong = {url: 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate'};
        });

        it("it sets jPlayer's media and stores the song for future scrobbling", function() {
            scope.$apply();

            expect($.fn.jPlayer).toHaveBeenCalledWith('setMedia', {'mp3': 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate'});
            expect(scope.currentSong).toEqual(playingSong);
        });

        it("if the player service's loadSong flag is true, it does not play the song, it displays the player controls and sets the player to the song's supplied position", function() {
            spyOn(scope, "revealControls");
            playerService.loadSong = true;
            playingSong.position = 42.2784;

            scope.$apply();

            expect($player.jPlayer).not.toHaveBeenCalledWith('play');
            expect($player.jPlayer).toHaveBeenCalledWith('pause', 42.2784);
            expect(playerService.loadSong).toBeFalsy();
            expect(scope.revealControls).toHaveBeenCalled();
        });

        describe("if the player service's loadSong flag is false,", function() {
            it("it plays the song", function() {
                playerService.loadSong = false;
                scope.$apply();

                expect($player.jPlayer).toHaveBeenCalledWith('play');
                expect(playerService.loadSong).toBeFalsy();
            });

            it("if the global setting NotificationSong is true, it displays a notification", function() {
                spyOn(notifications, "showNotification");
                mockGlobals.settings.NotificationSong = true;

                scope.$apply();

                expect(notifications.showNotification).toHaveBeenCalled();
            });
        });
    });

    it("When the player service's restartSong flag is true, it restarts the current song and resets the flag to false", function() {
        $.fn.jPlayer.and.stub();
        playerService.restartSong = true;
        scope.$apply();

        expect($player.jPlayer).toHaveBeenCalledWith('play', 0);
        expect(playerService.restartSong).toBeFalsy();
    });

    describe("When jplayer has finished the current song,", function() {
        var ended;
        beforeEach(function() {
            ended = $.jPlayer.event.ended;
        });
        it("it notifies the player service that the song has ended", function() {
            $player.trigger(ended);
            expect(playerService.songEnded).toHaveBeenCalled();
        });

        it("given that the last song of the queue is playing and that the global setting AutoPlay is true, it asks subsonic for random tracks and notifies the player service that the song has ended", function() {
            mockGlobals.settings.AutoPlay = true;
            spyOn(subsonic, "getRandomSongs");
            playerService.isLastSongPlaying.and.returnValue(true);

            $player.trigger(ended);

            expect(playerService.isLastSongPlaying).toHaveBeenCalled();
            expect(subsonic.getRandomSongs).toHaveBeenCalledWith('play', '', '');
        });
    });

    it("When jPlayer gets new media, it resets the scrobbled flag to false", function() {
        scope.scrobbled = true;

        var e = $.jPlayer.event.setmedia;
        $player.trigger(e);

        expect(scope.scrobbled).toBeFalsy();
    });

    it("When jPlayer throws an error, it tries to restart playback at the last position", function() {
        // Fake jPlayer's internal _trigger event because I can't trigger a manual error
        var fakejPlayer = {
            element: $player,
            status: { currentTime: 10.4228 }
        };
        var error = $.jPlayer.event.error;

        $.jPlayer.prototype._trigger.call(fakejPlayer, error);

        expect($player.jPlayer).toHaveBeenCalledWith('play', 10.4228);
    });

    it("When jPlayer starts to play the current song, it displays the player controls", function() {
        spyOn(scope, "revealControls");

        var e = $.jPlayer.event.play;
        $player.trigger(e);

        expect(scope.revealControls).toHaveBeenCalled();
    });

    it("revealControls - it displays the song details and the player controls", function() {
        $.fn.jPlayer.and.stub();
        affix('#playermiddle').css('visibility', 'hidden');
        affix('#songdetails').css('visibility', 'hidden');

        scope.revealControls();

        expect($('#playermiddle').css('visibility')).toEqual('visible');
        expect($('#songdetails').css('visibility')).toEqual('visible');
    });

    describe("Scrobbling -", function() {
        var fakejPlayer, timeUpdate;
        beforeEach(function() {
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

        it("Given a song that hasn't been scrobbled yet, When jPlayer reaches 30 percent of it, it scrobbles to last.fm using the subsonic service and sets the flag to true", function() {
            scope.scrobbled = false;

            // Trigger our fake timeupdate
            $.jPlayer.prototype._trigger.call(fakejPlayer, timeUpdate);

            expect(subsonic.scrobble).toHaveBeenCalledWith(scope.currentSong);
            expect(scope.scrobbled).toBeTruthy();
        });

        it("Given a song that has already been scrobbled, when jPlayer reaches 30 percent of it, it does not scrobble again and leaves the flag to true", function() {
            scope.scrobbled = true;

            // Trigger our fake timeupdate
            $.jPlayer.prototype._trigger.call(fakejPlayer, timeUpdate);

            expect(subsonic.scrobble).not.toHaveBeenCalled();
            expect(scope.scrobbled).toBeTruthy();
        });
    });

    describe("Given that the global setting SaveTrackPosition is true,", function() {
        beforeEach(function() {
            mockGlobals.settings.SaveTrackPosition = true;
            spyOn(persistence, "saveTrackPosition");
            spyOn(persistence, "saveQueue");
            jasmine.clock().install();
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        it("every 30 seconds, it saves the current song's position and the playing queue", function() {
            scope.currentSong = { id: 419 };
            $player.data('jPlayer').status.currentTime = 35.3877;
            $player.data('jPlayer').status.paused = false;

            scope.startSavePosition();
            jasmine.clock().tick(30001);

            expect(scope.currentSong.position).toBe(35.3877);
            expect(persistence.saveTrackPosition).toHaveBeenCalledWith(scope.currentSong);
            expect(persistence.saveQueue).toHaveBeenCalled();
        });

        it("if the song is not playing, it does not save anything", function() {
            $player.data('jPlayer').status.currentTime = 0.0;
            $player.data('jPlayer').status.paused = true;

            scope.startSavePosition();
            jasmine.clock().tick(30001);

            expect(persistence.saveTrackPosition).not.toHaveBeenCalled();
            expect(persistence.saveQueue).not.toHaveBeenCalled();
        });

        it("if there was already a watcher, it clears it before adding a new one", function() {
            spyOn($window, "clearInterval");

            scope.startSavePosition();
            scope.startSavePosition();
            expect($window.clearInterval).toHaveBeenCalled();
        });
    });
});
