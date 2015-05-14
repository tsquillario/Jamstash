describe("Player controller", function() {
	'use strict';

    var player, scope, mockGlobals;

    beforeEach(function() {
        // We redefine globals because in some tests we need to alter the settings
        mockGlobals = {
            settings: {
                Jukebox: false
            }
        };

        module('jamstash.player.controller');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();

            player = jasmine.createSpyObj("player", [
                "getPlayingSong",
                "previousTrack",
                "nextTrack",
                "getRepeatValues",
                "togglePause"
            ]);

            $controller('PlayerController', {
                $scope: scope,
                player: player,
                globals: mockGlobals
            });
        });
    });

    it("When I play a song, the player service will be called", function() {
        scope.play();

        expect(player.togglePause).toHaveBeenCalled();
    });

    it("when I pause a song, the player service will be called", function() {
        scope.pause();

        expect(player.togglePause).toHaveBeenCalled();
    });

    it("When I get the currently playing song, the player service will be called", function() {
        scope.getPlayingSong();

        expect(player.getPlayingSong).toHaveBeenCalled();
    });

    it("When I get the previous track, the player service will be called", function() {
        scope.previousTrack();

        expect(player.previousTrack).toHaveBeenCalled();
    });

    it("When I get the next track, the player service will be called", function() {
        scope.nextTrack();

        expect(player.nextTrack).toHaveBeenCalled();
    });
});
