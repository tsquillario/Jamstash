describe("jplayer directive", function() {
    'use strict';

    var element, scope, playerService, globalsService, $player, playingSong;

    function mockGetPlayingSong() {
        return playingSong;
    }

    beforeEach(function() {
        playingSong = {};
        module('jamstash.player.directive', function($provide) {
            // Mock the player service
            $provide.decorator('player', function($delegate) {
                $delegate.getPlayingSong = jasmine.createSpy('getPlayingSong').and.callFake(mockGetPlayingSong);
                $delegate.nextTrack = jasmine.createSpy('nextTrack');

                return $delegate;
            });
        });

        inject(function($rootScope, $compile, _player_, _globals_) {
            playerService = _player_;
            globalsService = _globals_;
            // Compile the directive
            scope = $rootScope.$new();
            element = '<div id="playdeck_1" jplayer></div>';
            element = $compile(element)(scope);
            scope.$digest();
        });
        $player = element.children('div');
    });

    it("When the player service's current playing song changes, it sets jplayer's media and plays the song", function() {
        spyOn($.fn, "jPlayer").and.returnValue($.fn);

        playingSong = {url: 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate'};
        scope.$apply();

        expect($player.jPlayer).toHaveBeenCalledWith('setMedia', {'mp3': 'https://gantry.com/antemarital/vigorless?a=oropharyngeal&b=killcrop#eviscerate'});
        expect($player.jPlayer).toHaveBeenCalledWith('play');
    });

    it("When the player service's restartSong flag is true, it restarts the current song and resets the flag to false", function() {
        spyOn($.fn, "jPlayer").and.returnValue($.fn);

        playerService.restartSong = true;
        scope.$apply();

        expect($player.jPlayer).toHaveBeenCalledWith('play', 0);
        expect(playerService.restartSong).toBeFalsy();
    });

    it("When jplayer has finished the current song, it plays the next track using the", function() {
        var e = $.jPlayer.event.ended;
        $player.trigger(e);

        expect(playerService.nextTrack).toHaveBeenCalled();
    });

    it("When jPlayer starts to play the current song, it displays the player controls", function() {
        affix('#playermiddle').css('visibility', 'hidden');
        affix('#songdetails').css('visibility', 'hidden');
        var e = $.jPlayer.event.play;
        $player.trigger(e);

        expect($('#playermiddle').css('visibility')).toEqual('visible');
        expect($('#songdetails').css('visibility')).toEqual('visible');
    });
});
