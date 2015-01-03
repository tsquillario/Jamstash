describe("jplayer directive", function() {
    'use strict';

    var element, scope, $player, playingSong,
        playerService, mockGlobals, subsonic, notifications, locker, $window;

    beforeEach(function() {
        playingSong = {};
        // We redefine globals because in some tests we need to alter the settings
        mockGlobals = {
            settings: {
                AutoPlay: false
            }
        };
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

        inject(function($rootScope, $compile, _player_, _subsonic_, _notifications_, _locker_, _$window_) {
            playerService = _player_;
            subsonic = _subsonic_;
            notifications = _notifications_;
            locker = _locker_;
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
            spyOn($.fn, "jPlayer").and.returnValue($.fn);
            playingSong = {url: 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate'};
        });

        it("it sets jPlayer's media and stores the song for future scrobbling", function() {
            scope.$apply();

            expect($player.jPlayer).toHaveBeenCalledWith('setMedia', {'mp3': 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate'});
            expect(scope.currentSong).toEqual(playingSong);
        });

        it("if the player service's loadSong flag is true, it does not play the song, it displays the player controls and sets the player to the song's supplied position", function() {
            spyOn(scope, "revealControls");
            playingSong.position = 42.2784;

            playerService.loadSong = true;
            scope.$apply();

            expect($player.jPlayer).not.toHaveBeenCalledWith('play');
            expect($player.jPlayer).toHaveBeenCalledWith('pause', playingSong.position);
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
        spyOn($.fn, "jPlayer").and.returnValue($.fn);

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

    it("When jPlayer starts to play the current song, it displays the player controls", function() {
        spyOn(scope, "revealControls");

        var e = $.jPlayer.event.play;
        $player.trigger(e);

        expect(scope.revealControls).toHaveBeenCalled();
    });

    it("When jPlayer starts to play the current song, it resets the scrobbled flag to false", function() {
        scope.scrobbled = true;

        var e = $.jPlayer.event.play;
        $player.trigger(e);

        expect(scope.scrobbled).toBeFalsy();
    });

    it("revealControls - it displays the song details and the player controls", function() {
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

    describe("save to localStorage -", function() {
        beforeEach(function() {
            spyOn(locker, "put");
        });

        it("it saves the current song and its position to localStorage", function() {
            var position = 48.0773;
            $player.data('jPlayer').status.currentTime = position;
            scope.currentSong = {
                id: 419
            };

            scope.saveTrackPosition();

            expect(scope.currentSong.position).toBe(position);
            expect(locker.put).toHaveBeenCalledWith('CurrentSong', scope.currentSong);
        });

        it("it saves the player queue to localStorage", function() {
            var queue = [
                {id: 2313},
                {id: 4268},
                {id: 5470}
            ];
            playerService.queue = queue;

            scope.saveQueue();

            expect(locker.put).toHaveBeenCalledWith('CurrentQueue', queue);
        });

        describe("Given that the global setting SaveTrackPosition is true,", function() {
            beforeEach(function() {
                jasmine.clock().install();
                mockGlobals.settings.SaveTrackPosition = true;
                spyOn(scope, "saveTrackPosition");
                spyOn(scope, "saveQueue");
            });

            afterEach(function() {
                jasmine.clock().uninstall();
            });

            it("every 30 seconds, it saves the current song and queue", function() {
                $player.data('jPlayer').status.currentTime = 35.3877;
                $player.data('jPlayer').status.paused = false;

                scope.startSavePosition();
                jasmine.clock().tick(30001);

                expect(scope.saveTrackPosition).toHaveBeenCalled();
                expect(scope.saveQueue).toHaveBeenCalled();
            });

            it("if the song is not playing, it does not save anything", function() {
                $player.data('jPlayer').status.currentTime = 0.0;
                $player.data('jPlayer').status.paused = true;

                scope.startSavePosition();
                jasmine.clock().tick(30001);

                expect(scope.saveTrackPosition).not.toHaveBeenCalled();
                expect(scope.saveQueue).not.toHaveBeenCalled();
            });

            it("if there was already a watcher, it clears it before watching", function() {
                spyOn($window, "clearInterval");

                scope.startSavePosition();
                scope.startSavePosition();
                expect($window.clearInterval).toHaveBeenCalled();
            });
        });
    });
});
