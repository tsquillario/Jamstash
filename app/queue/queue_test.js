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

    it("When I play a song, it calls play in the player service", function() {
        spyOn(player, "play");
        scope.playSong(song);
        expect(player.play).toHaveBeenCalledWith(song);
    });

    it("When I empty the queue, it calls emptyQueue in the player service", function() {
        spyOn(player, "emptyQueue");
        scope.emptyQueue();
        expect(player.emptyQueue).toHaveBeenCalled();
    });

    it("When I shuffle the queue, it calls shuffleQueue in the player service", function() {
        spyOn(player, "shuffleQueue");
        scope.shuffleQueue();
        expect(player.shuffleQueue).toHaveBeenCalled();
    });

    it("When I add one song to the queue, it calls addSong in the player service", function() {
        spyOn(player, "addSong");
        scope.addSongToQueue(song);
        expect(player.addSong).toHaveBeenCalledWith(song);
    });

    it("When I remove a song from the queue, it calls removeSong in the player service", function() {
        spyOn(player, "removeSong");
        scope.removeSongFromQueue(song);
        expect(player.removeSong).toHaveBeenCalledWith(song);
    });

    it("When I remove all the selected songs from the queue, it calls removeSongs in the player service", function() {
        spyOn(player, "removeSongs");
        var secondSong = { id: 6791 };
        scope.selectedSongs = [song, secondSong];
        scope.removeSelectedSongsFromQueue();
        expect(player.removeSongs).toHaveBeenCalledWith([song, secondSong]);
    });
});
