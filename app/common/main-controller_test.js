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
        player = jasmine.createSpyObj("player", ["togglePause", "turnVolumeUp", "turnVolumeDown", "nextTrack", "previousTrack", "setVolume"]);
        player.queue = [];

        // Mock the persistence service
        persistence = jasmine.createSpyObj("persistence", [
            "loadQueue",
            "loadTrackPosition",
            "getVolume",
            "saveVolume",
            "getSettings",
            "saveSettings"
        ]);

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

        it("When I turn the volume up, it sets the player's volume up and saves it using the persistence service", function() {
            player.turnVolumeUp.and.returnValue(0.6);
            scope.turnVolumeUp();

            expect(player.turnVolumeUp).toHaveBeenCalled();
            expect(persistence.saveVolume).toHaveBeenCalledWith(0.6);
        });

        it("When I turn the volume down, it sets the player's volume down and saves it using the persistence service", function() {
            player.turnVolumeDown.and.returnValue(0.4);
            scope.turnVolumeDown();

            expect(player.turnVolumeDown).toHaveBeenCalled();
            expect(persistence.saveVolume).toHaveBeenCalledWith(0.4);
        });

        it("When I go to the next track, it calls next track on the player", function() {
            scope.nextTrack();
            expect(player.nextTrack).toHaveBeenCalled();
        });

        it("When I go to the previous track, it calls previous track on the player", function() {
            scope.previousTrack();
            expect(player.previousTrack).toHaveBeenCalled();
        });

        describe("Given that I am targeting an input,", function() {
            var event;
            beforeEach(function() {
                event = { target: { tagName: "INPUT" } };
            });

            it("when I use a shortcut to toggle pause, it doesn't do anything", function() {
                scope.togglePause(event);
                expect(player.togglePause).not.toHaveBeenCalled();
            });

            it("when I use a shortcut to turn the volume up, it doesn't do anything", function() {
                scope.turnVolumeUp(event);
                expect(player.turnVolumeUp).not.toHaveBeenCalled();
                expect(persistence.saveVolume).not.toHaveBeenCalled();
            });

            it("when I use a shortcut to turn the volume down, it doesn't do anything", function() {
                scope.turnVolumeDown(event);
                expect(player.turnVolumeDown).not.toHaveBeenCalled();
                expect(persistence.saveVolume).not.toHaveBeenCalled();
            });

            it("when I use a shortcut to go to the next track, it doesn't do anything", function() {
                scope.nextTrack(event);
                expect(player.nextTrack).not.toHaveBeenCalled();
            });

            it("when I use a shortcut to go to the previous track, it doesn't do anything", function() {
                scope.previousTrack(event);
                expect(player.previousTrack).not.toHaveBeenCalled();
            });
        });

        describe("loadSettings() -", function() {
            it("Given user settings were saved using persistence, when I load the settings, the globals object will be completed with them, excluding the Url setting", function() {
                persistence.getSettings.and.returnValue({
                    "Url": "http://gmelinite.com/contrastive/hypercyanotic?a=overdrive&b=chirpling#postjugular",
                    "Username": "Hollingshead",
                    "AutoPlaylistSize": 25,
                    "AutoPlay": true
                });

                scope.loadSettings();
                expect(mockGlobals.settings.Username).toEqual("Hollingshead");
                expect(mockGlobals.settings.AutoPlaylistSize).toBe(25);
                expect(mockGlobals.settings.AutoPlay).toBe(true);
                expect(mockGlobals.settings.Url).toBeUndefined();
            });

        });
    });

    describe("When starting up,", function() {
        it("it loads the volume from the persistence service and sets the player service's volume with it", function() {
            persistence.getVolume.and.returnValue(0.551835);

            $controller('AppController', controllerParams);

            expect(persistence.getVolume).toHaveBeenCalled();
            expect(player.setVolume).toHaveBeenCalledWith(0.551835);
        });
    });
});
