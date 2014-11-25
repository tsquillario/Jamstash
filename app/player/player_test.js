describe("Player controller", function() {
	'use strict';

    var player, scope, deferred;

    beforeEach(function() {
        module('jamstash.player.ctrl');

        inject(function ($controller, $rootScope, _player_, $q) {
            scope = $rootScope.$new();
            player = _player_;

            // Mock the functions of the services
            deferred = $q.defer();
            spyOn(player, "nextTrack").and.stub();
            spyOn(player, "previousTrack").and.stub();
            spyOn(player, "defaultPlay").and.stub();

            $controller('PlayerCtrl', {
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

    it("When I call defaultPlay, it calls defaultPlay in the player service", function() {
        scope.defaultPlay();

        expect(player.defaultPlay).toHaveBeenCalled();
    });
});
