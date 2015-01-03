describe("Main controller", function() {
    'use strict';

    var scope, $rootScope, utils, globals, notifications, player, locker;
    beforeEach(function() {
        module('JamStash');

        inject(function ($controller, _$rootScope_, _$document_, _$window_, _$location_, _$cookieStore_, _utils_, _globals_, _model_, _notifications_, _player_, _locker_) {
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            utils = _utils_;
            globals = _globals_;
            notifications = _notifications_;
            player = _player_;
            locker = _locker_;

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
                notifications: notifications,
                player: player,
                locker: locker
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
});
