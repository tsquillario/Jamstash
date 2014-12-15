describe("Player controller", function() {
	'use strict';

    var player, scope;

    beforeEach(function() {
        module('jamstash.player.controller');

        inject(function ($controller, $rootScope, _player_) {
            scope = $rootScope.$new();
            player = _player_;

            $controller('PlayerController', {
                $scope: scope,
                player: player
            });
        });
    });

    it("When I create the player controller, the player service should be on the scope", function() {
        expect(scope.player).toBeDefined();
    });

    // TODO: updateFavorite
});
