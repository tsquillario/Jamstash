describe("Player controller", function() {
	'use strict';

    var player, scope;

    beforeEach(function() {
        module('jamstash.player.controller');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();

            player = jasmine.createSpyObj("player", ["getPlayingSong", "previousTrack", "nextTrack"]);

            $controller('PlayerController', {
                $scope: scope,
                player: player
            });
        });
    });

    it("When I get the currently playing song, it asks the player service", function() {
        scope.getPlayingSong();

        expect(player.getPlayingSong).toHaveBeenCalled();
    });

    it("When I get the previous track, it uses the player service", function() {
        scope.previousTrack();

        expect(player.previousTrack).toHaveBeenCalled();
    });

    it("When I get the next track, it uses the player service", function() {
        scope.nextTrack();

        expect(player.nextTrack).toHaveBeenCalled();
    });

    // TODO: updateFavorite
});
