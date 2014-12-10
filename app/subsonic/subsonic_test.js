describe("Subsonic controller", function() {
    'use strict';


    var scope, $rootScope, subsonic, notifications, deferred, player;

    beforeEach(function() {
        jasmine.addCustomEqualityTester(angular.equals);

        module('jamstash.subsonic.controller');

        inject(function ($controller, _$rootScope_, utils, globals, map, _subsonic_, _notifications_, $q, _player_) {
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            subsonic = _subsonic_;
            notifications = _notifications_;
            player = _player_;

            // Mock the functions of the services and the rootscope
            deferred = $q.defer();
            spyOn(subsonic, 'getRandomStarredSongs').and.returnValue(deferred.promise);
            spyOn(map, 'mapSong').and.callFake(function (song) {
                return {id: song.id};
            });
            spyOn(notifications, 'updateMessage').and.stub();
            spyOn(player, 'play').and.stub();
            $rootScope.queue = [];

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

    //TODO: JMA: It should be the exact same test when getting songs from an album. We aren't testing that it's randomized, that's the service's job.
    describe("getRandomStarred -", function() {

        describe("given that my library contains 3 starred songs, ", function() {
            var response = [
                {id:"2548"}, {id:"8986"}, {id:"2986"}
            ];

            it("when displaying random starred songs, it sets the scope with the selected songs", function() {
                scope.getRandomStarredSongs('display');
                deferred.resolve(response);
                $rootScope.$apply();

                expect(subsonic.getRandomStarredSongs).toHaveBeenCalled();
                expect(scope.song).toEqual([
                    {id: "2548"}, {id: "8986"}, {id: "2986"}
                ]);
            });

            it("when adding random starred songs, it adds the selected songs to the queue and notifies the user", function() {
                scope.getRandomStarredSongs('add');
                deferred.resolve(response);
                $rootScope.$apply();

                expect(subsonic.getRandomStarredSongs).toHaveBeenCalled();
                expect($rootScope.queue).toEqual([
                    {id: "2548"}, {id: "8986"}, {id: "2986"}
                ]);
                expect(notifications.updateMessage).toHaveBeenCalledWith('3 Song(s) Added to Queue', true);
            });

            it("when playing random starred songs, it plays the first selected song, empties the queue and fills it with the selected songs, and notifies the user", function() {
                $rootScope.queue = [{id: "7666"}];

                scope.getRandomStarredSongs('play');
                deferred.resolve(response);
                $rootScope.$apply();

                expect(subsonic.getRandomStarredSongs).toHaveBeenCalled();
                expect(player.play).toHaveBeenCalledWith({id: "2548"});
                expect($rootScope.queue).toEqual([
                    {id: "2548"}, {id: "8986"}, {id: "2986"}
                ]);
                expect(notifications.updateMessage).toHaveBeenCalledWith('3 Song(s) Added to Queue', true);
            });

        });

        it("given that I don't have any starred song in my library, when getting random starred songs, it notifies the user with an error message, does not play a song and does not touch the queue", function() {
            $rootScope.queue = [{id: "7666"}];

            scope.getRandomStarredSongs('whatever action');
            deferred.reject({reason: 'No starred songs found on the Subsonic server.'});
            $rootScope.$apply();

            expect(subsonic.getRandomStarredSongs).toHaveBeenCalled();
            expect(player.play).not.toHaveBeenCalled();
            expect($rootScope.queue).toEqual([{id: "7666"}]);
            expect(notifications.updateMessage).toHaveBeenCalledWith('No starred songs found on the Subsonic server.', true);
        });

        it("given that the Subsonic server returns an error, when getting random starred songs, it notifies the user with the error message", function() {
            scope.getRandomStarredSongs('whatever action');
            deferred.reject({reason: 'Error when contacting the Subsonic server.',
                subsonicError: {code: 10, message:'Required parameter is missing.'}
            });
            $rootScope.$apply();

            expect(subsonic.getRandomStarredSongs).toHaveBeenCalled();
            expect(notifications.updateMessage).toHaveBeenCalledWith('Error when contacting the Subsonic server. Required parameter is missing.', true);
        });

        it("given that the Subsonic server is unreachable, when getting random starred songs, it notifies the user with the HTTP error code", function() {
            scope.getRandomStarredSongs('whatever action');
            deferred.reject({reason: 'Error when contacting the Subsonic server.',
                httpError: 404
            });
            $rootScope.$apply();

            expect(subsonic.getRandomStarredSongs).toHaveBeenCalled();
            expect(notifications.updateMessage).toHaveBeenCalledWith('Error when contacting the Subsonic server. HTTP error 404', true);
        });
    });

    describe("reorders playlists by drag and drop - ", function() {
        var mockUI;
        beforeEach(function() {
            scope.song = [{id: "1084"}, {id: "6810"}, {id: "214"}];
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
                {id: "6810"}, {id: "1084"}, {id: "214"}
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
