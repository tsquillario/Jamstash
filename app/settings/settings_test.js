// jscs:disable validateQuoteMarks
describe("Settings controller", function () {
    'use strict';

    var scope, $rootScope, $controller, $location, $q,
        controllerParams, utils, persistence, mockGlobals, json, notifications, subsonic, deferred;

    beforeEach(function () {
        jasmine.addCustomEqualityTester(angular.equals);

        module('jamstash.settings.controller');

        mockGlobals = {
            settings: {
                Password: '',
                Server: ''
            }
        };
        // Mock all the services
        utils = jasmine.createSpyObj("utils", ["HexEncode"]);
        persistence = jasmine.createSpyObj("persistence", [
            "saveQueue",
            "deleteQueue",
            "deleteTrackPosition",
            "saveSettings",
            "deleteSettings"
        ]);
        json = jasmine.createSpyObj("json", ["getChangeLog"]);
        notifications = jasmine.createSpyObj("notifications", ["requestPermissionIfRequired", "isSupported", "updateMessage"]);


        inject(function (_$controller_, _$rootScope_, _$location_, _$q_) {
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            $location = _$location_;
            $q = _$q_;
            deferred = $q.defer();

            $rootScope.hideQueue = jasmine.createSpy("hideQueue");
            $rootScope.loadSettings = jasmine.createSpy("loadSettings");

            // Mock subsonic-service using $q
            subsonic = jasmine.createSpyObj("subsonic", ["ping"]);

            $controller = _$controller_;
            controllerParams = {
                $rootScope: $rootScope,
                $scope: scope,
                $location: $location,
                utils: utils,
                globals: mockGlobals,
                json: json,
                notifications: notifications,
                persistence: persistence,
                subsonic: subsonic
            };
        });
    });

    describe("", function () {
        beforeEach(function () {
            $controller('SettingsController', controllerParams);
        });

        describe("save() -", function () {
            it("Given the settings have been set, when I save them, then the settings will be saved using the persistence service and the user will be notified", function () {
                scope.save();

                expect(persistence.saveSettings).toHaveBeenCalledWith(scope.settings);
                expect(notifications.updateMessage).toHaveBeenCalledWith('Settings Updated!', true);
            });

            it("Given that the SaveTrackPosition setting was true, when I save the settings, then the current queue will be saved using the persistence service", function () {
                scope.settings.SaveTrackPosition = true;

                scope.save();

                expect(persistence.saveQueue).toHaveBeenCalled();
            });

            it("Given that the SaveTrackPosition setting was false, when I save the settings, then the saved queue and track will be deleted from the persistence service", function () {
                scope.settings.SaveTrackPosition = false;

                scope.save();

                expect(persistence.deleteTrackPosition).toHaveBeenCalled();
                expect(persistence.deleteQueue).toHaveBeenCalled();
            });

            it("Given that the Server, Username and Password settings weren't empty, when I save the settings, then subsonic service will be pinged", function () {
                scope.settings.Server = 'http://hexagram.com/malacobdella/liposis?a=platybasic&b=enantiopathia#stratoplane';
                scope.settings.Username = 'Mollura';
                scope.settings.Password = 'FPTVjZtBwEyq';
                subsonic.ping.and.returnValue(deferred.promise);

                scope.save();

                expect(subsonic.ping).toHaveBeenCalled();
            });

            it("Given the server and Jamstash had different api versions, when I save the settings and the server responds an error, then the ApiVersion setting will be updated with the one sent from the server", function () {
                scope.settings.Server = 'http://gallotannate.com/tetranychus/puzzlement?a=stoically&b=mantuamaker#marianolatrist';
                scope.settings.Username = 'Vandervelden';
                scope.settings.Password = 'PA3DhdfAu0dy';
                scope.ApiVersion = '1.10.2';
                subsonic.ping.and.returnValue(deferred.promise);

                scope.save();
                deferred.reject({
                    reason: 'Error when contacting the Subsonic server.',
                    subsonicError: { code: 30, message: 'Incompatible Subsonic REST protocol version. Server must upgrade.' },
                    version: '1.8.0'
                });
                scope.$apply();

                expect(mockGlobals.settings.ApiVersion).toEqual('1.8.0');
            });
        });

        it("reset() - When I reset the settings, they will be deleted from the persistence service and will be reloaded with default values", function () {
            scope.reset();

            expect(persistence.deleteSettings).toHaveBeenCalled();
            expect(scope.loadSettings).toHaveBeenCalled();
        });
    });

    describe("On startup", function () {

    });
});
