describe("Subsonic controller", function() {
    'use strict';


    var scope, $rootScope, subsonic, notifications, player,
        deferred;

    beforeEach(function() {
        jasmine.addCustomEqualityTester(angular.equals);

        module('jamstash.subsonic.controller', function ($provide) {
            // Mock the player service
            $provide.decorator('player', function($delegate) {

                $delegate.queue = [];
                $delegate.play = jasmine.createSpy("play");
                $delegate.playFirstSong = jasmine.createSpy("playFirstSong");
                return $delegate;
            });

            $provide.decorator('subsonic', function($delegate, $q) {
                deferred = $q.defer();
                $delegate.getRandomStarredSongs = jasmine.createSpy("getRandomStarredSongs").and.returnValue(deferred.promise);
                $delegate.getRandomSongs = jasmine.createSpy("getRandomSongs").and.returnValue(deferred.promise);
                return $delegate;
            });

            $provide.decorator('notifications', function ($delegate) {
                $delegate.updateMessage = jasmine.createSpy("updateMessage");
                return $delegate;
            });
        });

        inject(function ($controller, _$rootScope_, utils, globals, map, _subsonic_, _notifications_, $q, _player_) {
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            subsonic = _subsonic_;
            notifications = _notifications_;
            player = _player_;

            $controller('SubsonicController', {
                $scope: scope,
                $rootScope: $rootScope,
                $routeParams: {},
                utils: utils,
                globals: globals,
                map: map,
                subsonic: subsonic,
                notifications: notifications
            });
        });
    });

    describe("given that my library contains 3 songs, ", function() {
        var response;
        beforeEach(function() {
            response = [
                {id:"2548"}, {id:"8986"}, {id:"2986"}
            ];
        });

        describe("get songs -", function() {
            beforeEach(function() {
                spyOn(scope, "requestSongs");
            });

            it("it can get random starred songs from the subsonic service", function() {
                scope.getRandomStarredSongs('whatever action');
                deferred.resolve(response);

                expect(subsonic.getRandomStarredSongs).toHaveBeenCalled();
                expect(scope.requestSongs).toHaveBeenCalledWith(deferred.promise, 'whatever action');
                expect(scope.selectedPlaylist).toBeNull();
                expect(scope.selectedAutoPlaylist).toBe('starred');
            });

            it("it can get random songs from all folders or genres from the subsonic service", function() {
                scope.getRandomSongs('whatever action');
                deferred.resolve(response);

                expect(subsonic.getRandomSongs).toHaveBeenCalled();
                expect(scope.requestSongs).toHaveBeenCalledWith(deferred.promise, 'whatever action');
                expect(scope.selectedPlaylist).toBeNull();
                expect(scope.selectedAutoPlaylist).toBe('random');
            });

            it("it can get random songs from a given genre from the subsonic service", function() {
                scope.getRandomSongs('whatever action', 'Rock');
                deferred.resolve(response);

                expect(subsonic.getRandomSongs).toHaveBeenCalledWith('Rock', undefined);
                expect(scope.requestSongs).toHaveBeenCalledWith(deferred.promise, 'whatever action');
                expect(scope.selectedPlaylist).toBeNull();
                expect(scope.selectedAutoPlaylist).toBe('Rock');
            });

            it("it can get random songs from a given folder id from the subsonic service", function() {
                scope.getRandomSongs('whatever action', '', 1);
                deferred.resolve(response);

                expect(subsonic.getRandomSongs).toHaveBeenCalledWith('', 1);
                expect(scope.requestSongs).toHaveBeenCalledWith(deferred.promise, 'whatever action');
                expect(scope.selectedPlaylist).toBeNull();
                expect(scope.selectedAutoPlaylist).toBe(1);
            });
        });

        describe("requestSongs -", function() {
            it("when I display songs, it sets the scope with the selected songs", function() {
                scope.requestSongs(deferred.promise, 'display');
                deferred.resolve(response);
                scope.$apply();

                expect(scope.song).toEqual([
                    {id: "2548"}, {id: "8986"}, {id: "2986"}
                ]);
            });

            it("when I add songs, it adds the selected songs to the playing queue and notifies the user", function() {
                scope.requestSongs(deferred.promise, 'add');
                deferred.resolve(response);
                scope.$apply();

                expect(player.queue).toEqual([
                    {id: "2548"}, {id: "8986"}, {id: "2986"}
                ]);
                expect(notifications.updateMessage).toHaveBeenCalledWith('3 Song(s) Added to Queue', true);
            });

            it("when I play songs, it plays the first selected song, empties the queue and fills it with the selected songs and it notifies the user", function() {
                player.queue = [{id: "7666"}];

                scope.requestSongs(deferred.promise, 'play');
                deferred.resolve(response);
                scope.$apply();

                expect(player.playFirstSong).toHaveBeenCalled();
                expect(player.queue).toEqual([
                    {id: "2548"}, {id: "8986"}, {id: "2986"}
                ]);
                expect(notifications.updateMessage).toHaveBeenCalledWith('3 Song(s) Added to Queue', true);
            });

            it("when I request songs, it returns a promise so that I can chain it further", function() {
                var success = jasmine.createSpy("success");

                scope.requestSongs(deferred.promise, 'whatever action').then(success);
                deferred.resolve(response);
                scope.$apply();

                expect(success).toHaveBeenCalled();
            });

            it("given that I don't have any song in my library, when I request songs, it notifies the user with an error message, does not play a song and does not change the queue", function() {
                player.queue = [{id: "7666"}];

                scope.requestSongs(deferred.promise, 'whatever action');
                deferred.reject({reason: 'No songs found on the Subsonic server.'});
                scope.$apply();

                expect(player.playFirstSong).not.toHaveBeenCalled();
                expect(player.queue).toEqual([{id: "7666"}]);
                expect(notifications.updateMessage).toHaveBeenCalledWith('No songs found on the Subsonic server.', true);
            });

            it("given that the Subsonic server returns an error, when I request songs, it notifies the user with the error message", function() {
                scope.requestSongs(deferred.promise, 'whatever action');
                deferred.reject({reason: 'Error when contacting the Subsonic server.',
                    subsonicError: {code: 10, message:'Required parameter is missing.'}
                });
                scope.$apply();

                expect(notifications.updateMessage).toHaveBeenCalledWith('Error when contacting the Subsonic server. Required parameter is missing.', true);
            });

            it("given that the Subsonic server is unreachable, when I request songs, it notifies the user with the HTTP error code", function() {
                scope.requestSongs(deferred.promise, 'whatever action');
                deferred.reject({reason: 'Error when contacting the Subsonic server.',
                    httpError: 404
                });
                scope.$apply();

                expect(notifications.updateMessage).toHaveBeenCalledWith('Error when contacting the Subsonic server. HTTP error 404', true);
            });
        });
    });

    describe("reorders playlists by drag and drop - ", function() {
        var mockUI;
        beforeEach(function() {
            scope.song = [
                {id: 1084},
                {id: 6810},
                {id: 214}
            ];
            mockUI = {
                item: {}
            };
        });

        it("given a song in a list of songs, when I start dragging it, it records what its starting position in the list was", function() {
            mockUI.item.index = jasmine.createSpy('index').and.returnValue('1');
            mockUI.item.data = jasmine.createSpy('data');

            scope.dragStart({}, mockUI);

            expect(mockUI.item.index).toHaveBeenCalled();
            expect(mockUI.item.data).toHaveBeenCalledWith('start', '1');
        });

        it("given a song in a list of songs that I started dragging, when I drop it, its position in the list of songs has changed", function() {
            mockUI.item.index = jasmine.createSpy('index').and.returnValue('0');
            mockUI.item.data = jasmine.createSpy('data').and.returnValue('1');

            scope.dragEnd({}, mockUI);

            expect(mockUI.item.index).toHaveBeenCalled();
            expect(mockUI.item.data).toHaveBeenCalledWith('start');
            // The second song should now be first
            expect(scope.song).toEqual([
                {id: 6810},
                {id: 1084},
                {id: 214}
            ]);
        });
    });

    it("When I call playSong, it calls play in the player service", function() {
        var fakeSong = {"id": 3572};

        scope.playSong(fakeSong);

        expect(player.play).toHaveBeenCalledWith(fakeSong);
    });

    //TODO: JMA: all starred
});
