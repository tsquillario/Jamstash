describe("Queue controller", function() {
    'use strict';

    var player, $rootScope, scope, globals;

    beforeEach(function() {
        module('jamstash.queue.ctrl');

        inject(function ($controller, _$rootScope_, _globals_, _player_) {
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            globals = _globals_;
            player = _player_;

            // Mock the functions of the services
            spyOn(player, "playSong").and.stub();

            $controller('QueueCtrl', {
                $rootScope: $rootScope,
                $scope: scope,
                globals: globals,
                player: player
            });
        });
    });
    it("When I call playSong, it calls playSong in the player service", function() {
        var fakeSong = {"id": 3174};

        scope.playSong(true, fakeSong);

        expect(player.playSong).toHaveBeenCalledWith(true, fakeSong);
    });
});
