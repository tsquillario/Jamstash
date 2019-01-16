// jscs:disable validateQuoteMarks
describe("Main controller", function () {
    'use strict';

    var controllerParams, $controller, $q, scope, mockGlobals, player, utils, persistence, subsonic, notifications,
        deferred, mockKeypress;
    beforeEach(function () {
        mockGlobals = {
            settings: {
                SaveTrackPosition: false,
                ShowQueue: false,
                Debug: false,
                Jukebox: false
            }
        };

        module('JamStash', function ($provide) {
            $provide.value('globals', mockGlobals);
        });

        // Mock a keypress to the application
        mockKeypress = function(scope, key, target){
            scope.processKeyEvent({
                key: key,
                target: target,
                isDefaultPrevented: function(){},
                preventDefault: function(){}
            });
        }

        // Mock the player service
        player = jasmine.createSpyObj("player", [
            "togglePause",
            "turnVolumeUp",
            "turnVolumeDown",
            "nextTrack",
            "previousTrack",
            "setVolume"
        ]);
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

        // Mock the subsonic service
        subsonic = jasmine.createSpyObj("subsonic", [
            "toggleStar"
        ]);

        // Mock the notifications service
        notifications = jasmine.createSpyObj("notifications", [
            "updateMessage"
        ]);

        inject(function (_$controller_, $rootScope, _$q_, _$document_, _$window_, _$location_, _$cookieStore_, lodash, _utils_, globals, _model_, _Page_) {
            scope = $rootScope.$new();
            utils = _utils_;
            $q = _$q_;
            deferred = $q.defer();

            spyOn(utils, "switchTheme");

            $controller = _$controller_;
            controllerParams = {
                $scope: scope,
                $rootScope: $rootScope,
                $document: _$document_,
                $window: _$window_,
                $location: _$location_,
                $cookieStore: _$cookieStore_,
                lodash: lodash,
                utils: utils,
                globals: globals,
                model: _model_,
                notifications: notifications,
                player: player,
                persistence: persistence,
                Page: _Page_,
                subsonic: subsonic
            };
        });
    });

    describe("", function () {
        beforeEach(function () {
            $controller('AppController', controllerParams);
        });

        it("given that the global setting 'ShowQueue' is true, when the playing queue's length changes and is not empty, it shows the queue", function () {
            mockGlobals.settings.ShowQueue = true;
            player.queue = [{
                id: 684
            }];
            spyOn(scope, "showQueue");

            scope.$apply();

            expect(scope.showQueue).toHaveBeenCalled();
        });

        describe("When I toggle pause using the keyboard shortcut,", function () {
            it("it toggles pause on the player service", function () {
                mockKeypress(scope, ' ');
                expect(player.togglePause).toHaveBeenCalled();
            });
        });

        it("When I turn the volume up, it sets the player's volume up and saves it using the persistence service", function () {
            player.turnVolumeUp.and.returnValue(0.6);
            mockKeypress(scope, '+');

            expect(player.turnVolumeUp).toHaveBeenCalled();
            expect(persistence.saveVolume).toHaveBeenCalledWith(0.6);
        });

        it("When I turn the volume down, it sets the player's volume down and saves it using the persistence service", function () {
            player.turnVolumeDown.and.returnValue(0.4);
            mockKeypress(scope, '-');

            expect(player.turnVolumeDown).toHaveBeenCalled();
            expect(persistence.saveVolume).toHaveBeenCalledWith(0.4);
        });

        it("When I go to the next track, it calls next track on the player", function () {
            mockKeypress(scope, 'ArrowRight');
            expect(player.nextTrack).toHaveBeenCalled();
        });

        it("When I go to the previous track, it calls previous track on the player", function () {
            mockKeypress(scope, 'ArrowLeft');
            expect(player.previousTrack).toHaveBeenCalled();
        });

        describe("Given that I am targeting an input,", function () {
            var target = { 'tagName': "iNPUt" } ;

            it("when I use a shortcut to toggle pause, it doesn't do anything", function () {
                mockKeypress(scope, ' ', target);
                expect(player.togglePause).not.toHaveBeenCalled();
            });

            it("when I use a shortcut to turn the volume up, it doesn't do anything", function () {
                mockKeypress(scope, '+', target);
                expect(player.turnVolumeUp).not.toHaveBeenCalled();
                expect(persistence.saveVolume).not.toHaveBeenCalled();
            });

            it("when I use a shortcut to turn the volume down, it doesn't do anything", function () {
                mockKeypress(scope, '-', target);
                expect(player.turnVolumeDown).not.toHaveBeenCalled();
                expect(persistence.saveVolume).not.toHaveBeenCalled();
            });

            it("when I use a shortcut to go to the next track, it doesn't do anything", function () {
                mockKeypress(scope, 'RightArrow', target);
                expect(player.nextTrack).not.toHaveBeenCalled();
            });

            it("when I use a shortcut to go to the previous track, it doesn't do anything", function () {
                mockKeypress(scope, 'LeftArrow', target);
                expect(player.previousTrack).not.toHaveBeenCalled();
            });
        });

        describe("loadSettings() -", function () {
            it("Given user settings were saved using persistence, when I load the settings, the globals object will be completed with them, excluding the Url setting", function () {
                persistence.getSettings.and.returnValue({
                    Url: "http://gmelinite.com/contrastive/hypercyanotic?a=overdrive&b=chirpling#postjugular",
                    Username: "Hollingshead",
                    AutoPlaylistSize: 25,
                    AutoPlay: true
                });

                scope.loadSettings();
                expect(mockGlobals.settings.Username).toEqual("Hollingshead");
                expect(mockGlobals.settings.AutoPlaylistSize).toBe(25);
                expect(mockGlobals.settings.AutoPlay).toBe(true);
                expect(mockGlobals.settings.Url).toBeUndefined();
            });

        });

        describe("toggleStar() -", function () {
            beforeEach(function () {
                subsonic.toggleStar.and.returnValue(deferred.promise);
            });

            it("Given an artist that was not starred, when I toggle its star, then subsonic service will be called, the artist will be starred and a notification will be displayed", function () {
                var artist = { id: 4218, starred: false };
                scope.toggleStar(artist);
                deferred.resolve(true);
                scope.$apply();

                expect(subsonic.toggleStar).toHaveBeenCalledWith(artist);
                expect(artist.starred).toBeTruthy();
                expect(notifications.updateMessage).toHaveBeenCalledWith('Favorite Updated!', true);
            });

            it("Given a song that was starred, when I toggle its star, then subsonic service will be called, the song will no longer be starred and a notification will be displayed", function () {
                var song = { id: 784, starred: true };
                scope.toggleStar(song);
                deferred.resolve(false);
                scope.$apply();

                expect(subsonic.toggleStar).toHaveBeenCalledWith(song);
                expect(song.starred).toBeFalsy();
                expect(notifications.updateMessage).toHaveBeenCalledWith('Favorite Updated!', true);
            });
        });
    });

    describe("When starting up,", function () {
        it("it loads the volume from the persistence service and sets the player service's volume with it", function () {
            persistence.getVolume.and.returnValue(0.551835);

            $controller('AppController', controllerParams);

            expect(persistence.getVolume).toHaveBeenCalled();
            expect(player.setVolume).toHaveBeenCalledWith(0.551835);
        });
    });
});
