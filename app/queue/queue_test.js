describe("Queue controller", function() {
    'use strict';

    var player, scope;

    beforeEach(function() {
        module('jamstash.queue.ctrl');

        inject(function ($controller, $rootScope, _player_) {
            scope = $rootScope.$new();
            player = _player_;

            // Mock the functions of the services
            spyOn(player, "playSong").and.stub();

            $controller('PlayerCtrl', {
                $scope: scope,
                player: player
            });
        });

        it("When I call playSong, it calls playSong in the player service", function() {
            var fakeSong = {"id": 3174};

            scope.playSong(true, fakeSong);

            expect(player.playSong).toHaveBeenCalledWith(true, fakeSong);
        });
    });
});
