// jscs:disable validateQuoteMarks
describe("Queue controller", function () {
    'use strict';

    var QueueContoller, $scope, player, subsonic, SelectedSongs, notifications, $q, deferred, song;

    beforeEach(function () {
        module('jamstash.queue.controller');

        SelectedSongs = jasmine.createSpyObj("SelectedSongs", [
            "get"
        ]);

        player = jasmine.createSpyObj("player", [
            "emptyQueue",
            "getPlayingSong",
            "removeSongs",
            "reorderQueue",
            "shuffleQueue"
        ]);

        subsonic = jasmine.createSpyObj("subsonic", [
            "toggleStar"
        ]);

        notifications = jasmine.createSpyObj("notifications", [
            "updateMessage"
        ]);

        inject(function ($controller, $rootScope, _$q_, lodash) {
            $q = _$q_;
            deferred = $q.defer();

            $scope = $rootScope.$new();

            QueueContoller = $controller('QueueController', {
                $scope       : $scope,
                _            : lodash,
                player       : player,
                SelectedSongs: SelectedSongs,
                subsonic     : subsonic,
                notifications: notifications
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

    describe("toggleStar() -", function () {
        beforeEach(function () {
            subsonic.toggleStar.and.returnValue(deferred.promise);
        });

        it("Given a song that was not starred, when I toggle its star, then subsonic service will be called, the song will be starred and a notification will be displayed", function () {
            song = { id: 4218, starred: false };

            QueueContoller.toggleStar(song);
            deferred.resolve(true);
            $scope.$apply();

            expect(subsonic.toggleStar).toHaveBeenCalledWith(song);
            expect(song.starred).toBeTruthy();
            expect(notifications.updateMessage).toHaveBeenCalledWith('Favorite Updated!', true);
        });

        it("Given a song that was starred, when I toggle its star, then subsonic service will be called, the song will be starred and a notification will be displayed", function () {
            song = { id: 784, starred: true };

            QueueContoller.toggleStar(song);
            deferred.resolve(false);
            $scope.$apply();

            expect(subsonic.toggleStar).toHaveBeenCalledWith(song);
            expect(song.starred).toBeFalsy();
            expect(notifications.updateMessage).toHaveBeenCalledWith('Favorite Updated!', true);
        });
        });
});
