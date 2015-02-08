describe("Main controller", function() {
    'use strict';

    var controllerParams, $controller, scope, mockGlobals, player, utils, persistence;
    beforeEach(function() {
        mockGlobals = {
            settings: {
                SaveTrackPosition: false,
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
        player.queue = [];
        player.volume = 1.0;

        // Mock the persistence service
        persistence = jasmine.createSpyObj("persistence", ["loadQueue", "loadTrackPosition", "getVolume", "saveVolume"]);

        inject(function (_$controller_, $rootScope, _$document_, _$window_, _$location_, _$cookieStore_, _utils_, globals, _model_, _notifications_, _Page_) {
            scope = $rootScope.$new();
            utils = _utils_;

            spyOn(utils, "switchTheme");

            $controller = _$controller_;
            controllerParams = {
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
                persistence: persistence,
                Page: _Page_
            };
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

    describe("", function () {
        beforeEach(function() {
            $controller('AppController', controllerParams);
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
            it("given that we're using the Jukebox mode, it sends a 'stop' command to the jukebox", function() {
                mockGlobals.settings.Jukebox = true;
                spyOn(scope, "sendToJukebox");

                scope.togglePause();
                expect(scope.sendToJukebox).toHaveBeenCalledWith('stop');
            });

            it("it toggles pause using the player service", function() {
                scope.togglePause();
                expect(player.togglePause).toHaveBeenCalled();
            });
        });

        describe("When I turn the volume up,", function() {
            it("it sets the player's volume up by 10% and saves it using the persistence service", function() {
                player.volume = 0.5;

                scope.turnVolumeUp();

                expect(player.volume).toBe(0.6);
                expect(persistence.saveVolume).toHaveBeenCalledWith(0.6);
            });

            it("if the player's resulting volume won't be between 0 and 1, it sets it to 1", function() {
                player.volume = 5.91488;

                scope.turnVolumeUp();

                expect(player.volume).toBe(1.0);
            });
        });

        describe("When I turn the volume down,", function() {
            it("it sets the player's volume down by 10% and saves it using the persistence service", function() {
                player.volume = 0.5;

                scope.turnVolumeDown();

                expect(player.volume).toBe(0.4);
                expect(persistence.saveVolume).toHaveBeenCalledWith(0.4);
            });

            it("if the player's resulting volume won't be between 0 and 1, it sets it to 0", function() {
                player.volume = 5.91488;

                scope.turnVolumeDown();

                expect(player.volume).toBe(0);
            });
        });
    });

    describe("When starting up,", function() {
        it("it loads the volume from the persistence service and sets the player service's volume with it", function() {
            persistence.getVolume.and.returnValue(0.551835);

            $controller('AppController', controllerParams);

            expect(persistence.getVolume).toHaveBeenCalled();
            expect(player.volume).toBe(0.551835);
        });
    });
});
