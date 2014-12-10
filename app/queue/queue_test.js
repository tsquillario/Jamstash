describe("Queue controller", function() {
    'use strict';

    var player, $rootScope, scope, globals;

    beforeEach(function() {
        module('jamstash.queue.controller');

        inject(function ($controller, _$rootScope_, _globals_, _player_) {
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            globals = _globals_;
            player = _player_;

            // Mock the functions of the services
            spyOn(player, "play").and.stub();

            $controller('QueueController', {
                $rootScope: $rootScope,
                $scope: scope,
                globals: globals,
                player: player
            });
        });
    });
    it("When I call playSong, it calls play in the player service", function() {
        var fakeSong = {"id": 3174};

        scope.playSong(fakeSong);

        expect(player.play).toHaveBeenCalledWith(fakeSong);
    });
});
