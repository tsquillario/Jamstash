describe("Queue controller", function() {
    'use strict';

    var player, scope, globals;

    beforeEach(function() {
        module('jamstash.queue.controller');

        inject(function ($controller, $rootScope, _globals_, _player_) {
            scope = $rootScope.$new();
            globals = _globals_;
            player = _player_;

            // Mock the functions of the services
            spyOn(player, "play");

            $controller('QueueController', {
                $scope: scope,
                globals: globals,
                player: player
            });
        });
    });
    it("When I call playSong, it calls play in the player service", function() {
        var songIndexInQueue = 3;

        scope.playSong(songIndexInQueue);

        expect(player.play).toHaveBeenCalledWith(songIndexInQueue);
    });

    it("When I call queueEmpty, it empties the player's queue", function() {
        player.queue = [{
                id: 4425,
                name: 'Ratiocinator',
                artist: 'Kandice Pince',
                album: 'Additionally'
            }, {
                id: 1831,
                name: 'Nonteetotaler',
                artist: 'Anabel Eady',
                album: 'Lyricalness'
            }
        ];

        scope.queueEmpty();

        expect(player.queue).toEqual([]);
    });
});
