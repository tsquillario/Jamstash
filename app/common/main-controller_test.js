describe("Main controller", function() {
    'use strict';

    var scope, $rootScope, utils, globals, model, notifications, player;
    beforeEach(function() {
        module('JamStash');

        inject(function ($controller, _$rootScope_, _$document_, _$window_, _$location_, _$cookieStore_, _utils_, _globals_, _model_, _notifications_, _player_) {
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            utils = _utils_;
            globals = _globals_;
            model = _model_;
            notifications = _notifications_;
            player = _player_;

            $controller('AppController', {
                $scope: scope,
                $rootScope: $rootScope,
                $document: _$document_,
                $window: _$window_,
                $location: _$location_,
                $cookieStore: _$cookieStore_,
                utils: utils,
                globals: globals,
                model: model,
                notifications: notifications,
                player: player
            });
        });
    });

    xdescribe("updateFavorite -", function() {

        xit("when starring a song, it notifies the user that the star was saved", function() {

        });

        xit("when starring an album, it notifies the user that the star was saved", function() {

        });

        xit("when starring an artist, it notifies the user that the star was saved", function() {

        });

        xit("given that the Subsonic server returns an error, when starring something, it notifies the user with the error message", function() {
            //TODO: move to higher level
        });

        xit("given that the Subsonic server is unreachable, when starring something, it notifies the user with the HTTP error code", function() {
            //TODO: move to higher level
        });
    });

    xdescribe("toggleSetting -", function() {

    });

    describe("load from localStorage -", function() {
        var fakeStorage;
        beforeEach(function() {
            fakeStorage = {};

            spyOn(localStorage, "getItem").and.callFake(function(key) {
                return fakeStorage[key];
            });
            spyOn(utils, "browserStorageCheck").and.returnValue(true);
        });

        describe("loadTrackPosition -", function() {
            beforeEach(function() {
                spyOn(player, "load");
            });

            it("Given that we previously saved the current track's position in local Storage, it loads the song we saved into the player", function() {
                var song = {
                    id: 8626,
                    name: 'Pectinatodenticulate',
                    artist: 'Isiah Hosfield',
                    album: 'Tammanyize'
                };
                fakeStorage = {
                    'CurrentSong': song
                };

                scope.loadTrackPosition();

                expect(localStorage.getItem).toHaveBeenCalledWith('CurrentSong');
                expect(player.load).toHaveBeenCalledWith(song);
            });

            it("Given that we didn't save anything in local Storage, it doesn't load anything", function() {
                scope.loadTrackPosition();
                expect(localStorage.getItem).toHaveBeenCalledWith('CurrentSong');
                expect(player.load).not.toHaveBeenCalled();
            });
        });

        describe("loadQueue -", function() {
            beforeEach(function() {
                spyOn(notifications, "updateMessage");
                player.queue = [];
            });

            it("Given that we previously saved the playing queue in local Storage, it fills the player's queue with what we saved and notifies the user", function() {
                var queue = [
                    { id: 8705 },
                    { id: 1617 },
                    { id: 9812 }
                ];
                fakeStorage = {
                    'CurrentQueue': queue
                };

                scope.loadQueue();

                expect(localStorage.getItem).toHaveBeenCalledWith('CurrentQueue');
                expect(player.queue).toEqual(queue);
                expect(notifications.updateMessage).toHaveBeenCalledWith('3 Saved Song(s)', true);
            });

            it("Given that we didn't save anything in local Storage, it doesn't load anything", function() {
                scope.loadQueue();

                expect(localStorage.getItem).toHaveBeenCalledWith('CurrentQueue');
                expect(player.queue).toEqual([]);
                expect(notifications.updateMessage).not.toHaveBeenCalled();
            });
        });
    });
});
