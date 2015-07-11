// jscs:disable validateQuoteMarks
describe("Queue controller", function () {
    'use strict';

    var QueueContoller, $scope, player, SelectedSongs;
    var song;

    beforeEach(function () {
        module('jamstash.queue.controller');

        SelectedSongs = jasmine.createSpyObj("SelectedSongs", ["get"]);

        player = jasmine.createSpyObj("player", [
            "emptyQueue",
            "getPlayingSong",
            "removeSongs",
            "reorderQueue",
            "shuffleQueue"
        ]);

        inject(function ($controller, $rootScope) {
            $scope = $rootScope.$new();

            QueueContoller = $controller('QueueController', {
                $scope       : $scope,
                player       : player,
                SelectedSongs: SelectedSongs
            });
        });
        player.queue = [];
    });

    it("emptyQueue() - When I empty the queue, then the player service's emptyQueuewill be called and fancybox will be closed", function () {
        spyOn($.fancybox, "close");

        QueueContoller.emptyQueue();

        expect(player.emptyQueue).toHaveBeenCalled();
        expect($.fancybox.close).toHaveBeenCalled();
    });

    it("shuffleQueue() - When I shuffle the queue, then the player's shuffleQueue will be called and the queue will be scrolled back to the first element", function () {
        spyOn($.fn, 'scrollTo');

        QueueContoller.shuffleQueue();

        expect(player.shuffleQueue).toHaveBeenCalled();
        expect($.fn.scrollTo).toHaveBeenCalledWith('.header', jasmine.any(Number));
    });

    it("removeSelectedSongsFromQueue() - When I remove all the selected songs from the queue, then the player's removeSongs will be called with the selected songs", function () {
        SelectedSongs.get.and.returnValue([
            { id: 6390 },
            { id: 2973 }
        ]);

        QueueContoller.removeSelectedSongsFromQueue();

        expect(player.removeSongs).toHaveBeenCalledWith([
            { id: 6390 },
            { id: 2973 }
        ]);
    });

    it("isPlayingSong() - Given a song, when I want to know if it's playing, then the player service will be called and its return will be compared with the given song", function () {
        song = { id: 2537 };
        player.getPlayingSong.and.returnValue(song);

        expect(QueueContoller.isPlayingSong(song)).toBeTruthy();

        expect(player.getPlayingSong).toHaveBeenCalled();
    });

    it("When the player service's current song changes, then the queue will be scrolled down to display the new playing song", function () {
        song = { id: 5239 };
        player.getPlayingSong.and.returnValue(song);
        spyOn($.fn, "scrollTo");

        $scope.$apply();

        expect($.fn.scrollTo).toHaveBeenCalled();
    });
});
