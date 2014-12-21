describe("jplayer directive", function() {
    'use strict';

    var element, scope, playerService, globals, subsonic, $player, playingSong;

    beforeEach(function() {
        playingSong = {};
        module('jamstash.player.directive', function($provide) {
            // Mock the player service
            $provide.decorator('player', function($delegate) {
                $delegate.getPlayingSong = jasmine.createSpy('getPlayingSong').and.callFake(function() {
                    return playingSong;
                });
                $delegate.nextTrack = jasmine.createSpy('nextTrack');

                return $delegate;
            });
        });

        inject(function($rootScope, $compile, _player_, _globals_, _subsonic_) {
            playerService = _player_;
            globals = _globals_;
            subsonic = _subsonic_;
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

        it("if the player service's loadSong flag is true, it does not play the song and it displays the player controls", function() {
            spyOn(scope, "revealControls");

            playerService.loadSong = true;
            scope.$apply();

            expect($player.jPlayer).not.toHaveBeenCalledWith('play');
            expect(playerService.loadSong).toBeFalsy();
            expect(scope.revealControls).toHaveBeenCalled();
        });

        it("otherwise, it plays it", function() {
            playerService.loadSong = false;
            scope.$apply();

            expect($player.jPlayer).toHaveBeenCalledWith('play');
            expect(playerService.loadSong).toBeFalsy();
        });
    });

    it("When the player service's restartSong flag is true, it restarts the current song and resets the flag to false", function() {
        spyOn($.fn, "jPlayer").and.returnValue($.fn);

        playerService.restartSong = true;
        scope.$apply();

        expect($player.jPlayer).toHaveBeenCalledWith('play', 0);
        expect(playerService.restartSong).toBeFalsy();
    });

    it("When jplayer has finished the current song, it asks the player service for the next track", function() {
        var e = $.jPlayer.event.ended;
        $player.trigger(e);

        expect(playerService.nextTrack).toHaveBeenCalled();
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
});
