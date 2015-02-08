describe("Main controller", function() {
    'use strict';

    var scope, mockGlobals, player, utils;
    beforeEach(function() {
        mockGlobals = {
            settings: {
                ShowQueue: false,
                Debug: true,
                Jukebox: false
            }
        };

        module('JamStash', function($provide) {
            $provide.value('globals', mockGlobals);
        });

        // Mock the player service
        player = jasmine.createSpyObj("player", ["togglePause"]);

        inject(function ($controller, $rootScope, _$document_, _$window_, _$location_, _$cookieStore_, _utils_, globals, _model_, _notifications_, _locker_, _Page_) {
            scope = $rootScope.$new();
            utils = _utils_;

            spyOn(utils, "switchTheme");

            $controller('AppController', {
                $scope: scope,
                $rootScope: $rootScope,
                $document: _$document_,
                $window: _$window_,
                $location: _$location_,
                $cookieStore: _$cookieStore_,
                utils: utils,
                globals: globals,
                model: _model_,
                notifications: _notifications_,
                player: player,
                locker: _locker_,
                Page: _Page_
            });
        });
        player.queue = [];
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

    it("given that the global setting 'ShowQueue' is true, when the playing queue's length changes and is not empty, it shows the queue", function() {
        mockGlobals.settings.ShowQueue = true;
        player.queue = [{
            id: 684
        }];
        spyOn(scope, "showQueue");

        scope.$apply();

        expect(scope.showQueue).toHaveBeenCalled();
    });

    describe("When I toggle pause,", function() {
        it("given that we're using the Jukebox mode, it sends a 'pause' command to the jukebox", function() {
            mockGlobals.settings.Jukebox = true;
            spyOn(scope, "sendToJukebox");

            scope.togglePause();
            expect(scope.sendToJukebox).toHaveBeenCalledWith('pause');
        });

        it("it toggles pause using the player service", function() {
            scope.togglePause();
            expect(player.togglePause).toHaveBeenCalled();
        });
    });
});
