describe("Queue controller", function() {
    'use strict';

    var player, scope, globals;
    var song = {
        id: 7310
    };

    beforeEach(function() {
        module('jamstash.queue.controller');

        inject(function ($controller, $rootScope, _globals_, _player_) {
            scope = $rootScope.$new();
            globals = _globals_;
            player = _player_;

            $controller('QueueController', {
                $scope: scope,
                globals: globals,
                player: player
            });
        });
    });

    it("When I call playSong, it calls play in the player service", function() {
        spyOn(player, "play");
        var songIndexInQueue = 3;

        scope.playSong(songIndexInQueue);

        expect(player.play).toHaveBeenCalledWith(songIndexInQueue);
    });

    it("When I call queueEmpty, it calls emptyQueue in the player service", function() {
        spyOn(player, "emptyQueue");

        scope.queueEmpty();

        expect(player.emptyQueue).toHaveBeenCalled();
    });

    it("When I call queueShuffle, it calls shuffleQueue in the player service", function() {
        spyOn(player, "shuffleQueue");

        scope.queueShuffle();

        expect(player.shuffleQueue).toHaveBeenCalled();
    });

    it("When I add one song to the queue, it calls addSong in the player service", function() {
        spyOn(player, "addSong");


        scope.addSongToQueue(song);

        expect(player.addSong).toHaveBeenCalledWith(song);
    });

    xit("When I add many songs to the queue, it calls addSong in the player service", function() {
        spyOn(player, "addSong");
    });

    it("When I remove a song from the queue, it calls removeSong in the player service", function() {
        spyOn(player, "removeSong");

        scope.removeSongFromQueue(song);

        expect(player.removeSong).toHaveBeenCalledWith(song);
    });
});
