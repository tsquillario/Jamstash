describe("Queue controller", function() {
    'use strict';

    var player, scope;
    var song;

    beforeEach(function() {
        module('jamstash.queue.controller');

        inject(function ($controller, $rootScope, globals, _player_) {
            scope = $rootScope.$new();
            player = _player_;

            $controller('QueueController', {
                $scope: scope,
                globals: globals,
                player: player
            });
        });
        song = { id: 7310 };
    });

    it("When I play a song, it calls play in the player service", function() {
        spyOn(player, "play");
        scope.playSong(song);
        expect(player.play).toHaveBeenCalledWith(song);
    });

    it("When I empty the queue, it calls emptyQueue in the player service and closes fancybox", function() {
        spyOn(player, "emptyQueue");
        spyOn($.fancybox, "close");

        scope.emptyQueue();
        expect(player.emptyQueue).toHaveBeenCalled();
        expect($.fancybox.close).toHaveBeenCalled();
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

    it("asks the player service if a given song is the currently playing song", function() {
        spyOn(player, "getPlayingSong").and.returnValue(song);
        expect(scope.isPlayingSong(song)).toBeTruthy();
        expect(player.getPlayingSong).toHaveBeenCalled();
    });

    it("when the player service's current song changes, it scrolls the queue to display it", function() {
        spyOn(player, "getPlayingSong").and.callFake(function() {
            return song;
        });
        spyOn($.fn, "scrollTo");

        scope.$apply();

        expect($.fn.scrollTo).toHaveBeenCalled();
    });
});
