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
        player.queue = [];
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

    describe("reorders the queue by drag and drop - ", function() {
        var mockUI;
        beforeEach(function() {
            player.queue = [
                {id: 2246},
                {id: 8869},
                {id: 285}
            ];
            mockUI = {
                item: {}
            };
        });

        it("given a song in the queue, when I start dragging it, it records what its starting position in the queue was", function() {
            mockUI.item.index = jasmine.createSpy("index").and.returnValue('1');
            mockUI.item.data = jasmine.createSpy("data");

            scope.dragStart({}, mockUI);

            expect(mockUI.item.index).toHaveBeenCalled();
            expect(mockUI.item.data).toHaveBeenCalledWith('start', '1');
        });

        it("given a song in the queue that I started dragging, when I drop it, its position in the queue has changed", function() {
            mockUI.item.index = jasmine.createSpy("index").and.returnValue('0');
            mockUI.item.data = jasmine.createSpy("data").and.returnValue('1');

            scope.dragEnd({}, mockUI);

            expect(mockUI.item.index).toHaveBeenCalled();
            expect(mockUI.item.data).toHaveBeenCalledWith('start');
            // The second song should now be first
            expect(player.queue).toEqual([
                {id: 8869},
                {id: 2246},
                {id: 285}
            ]);
        });

        // TODO: Hyz: Maybe it should be an end-to-end test
        it("given that the player is playing the second song (B), when I swap the first (A) and the second song (B), the player's next song should be A", function() {
            player.play({id: 8869});
            mockUI.item.index = jasmine.createSpy("index").and.returnValue('0');
            mockUI.item.data = jasmine.createSpy("data").and.returnValue('1');

            scope.dragEnd({}, mockUI);

            player.nextTrack();
            expect(player._playingIndex).toBe(1);
            expect(player._playingSong).toEqual({id: 2246});
        });
    });
});
