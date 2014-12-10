describe("Player controller", function() {
	'use strict';

    var player, scope;

    beforeEach(function() {
        module('jamstash.player.controller');

        inject(function ($controller, $rootScope, _player_) {
            scope = $rootScope.$new();
            player = _player_;

            // Mock the functions of the services
            spyOn(player, "nextTrack").and.stub();
            spyOn(player, "previousTrack").and.stub();
            spyOn(player, "play").and.stub();

            $controller('PlayerController', {
                $scope: scope,
                player: player
            });
        });
    });

    it("When I call previousTrack, it calls previousTrack in the player service", function() {
        scope.previousTrack();

        expect(player.previousTrack).toHaveBeenCalled();
    });

    it("When I call nextTrack, it calls nextTrack in the player service", function() {
        scope.nextTrack();

        expect(player.nextTrack).toHaveBeenCalled();
    });

    it("When I call play, it calls play in the player service", function() {
        scope.play();

        expect(player.play).toHaveBeenCalled();
    });
});
