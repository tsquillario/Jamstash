angular.module('jamstash.settings.controller', ['jamstash.settings.service', 'jamstash.persistence'])

.controller('SettingsController', ['$rootScope', '$scope', '$location', 'utils', 'globals', 'json', 'notifications', 'persistence', 'subsonic',
    function ($rootScope, $scope, $location, utils, globals, json, notifications, persistence, subsonic) {
    'use strict';
    $rootScope.hideQueue();
    $scope.settings = globals.settings; /* See service.js */
    $scope.Timeouts = [
        { id: 1000, name: 1 },
        { id: 2000, name: 2 },
        { id: 3000, name: 3 },
        { id: 4000, name: 4 },
        { id: 5000, name: 5 },
        { id: 6000, name: 6 },
        { id: 9000, name: 9 },
        { id: 10000, name: 10 }
    ];
    $scope.Protocols = ["json", "jsonp"];
    $scope.Themes = ["Default", "Dark"];
    $scope.SearchTypes = globals.SearchTypes;
    $scope.Layouts = globals.Layouts;

    $scope.reset = function () {
        persistence.deleteSettings();
        $scope.loadSettings();
        // TODO: Hyz: reload the page
    };
    $scope.save = function () {
        if ($scope.settings.Password !== '' && globals.settings.Password.substring(0, 4) != 'enc:') { $scope.settings.Password = 'enc:' + utils.HexEncode($scope.settings.Password); }
        if ($scope.settings.Server.indexOf('http://') != 0 && $scope.settings.Server.indexOf('https://') != 0) { $scope.settings.Server = 'http://' + $scope.settings.Server; }
        if ($scope.settings.NotificationSong) {
            notifications.requestPermissionIfRequired();
            if (!notifications.isSupported()) {
                alert('HTML5 Notifications are not available for your current browser, Sorry :(');
            }
        }
        if ($scope.settings.NotificationNowPlaying) {
            notifications.requestPermissionIfRequired();
            if (!notifications.isSupported()) {
                alert('HTML5 Notifications are not available for your current browser, Sorry :(');
            }
        }
        if ($scope.settings.SaveTrackPosition) {
            persistence.saveQueue();
        } else {
            persistence.deleteTrackPosition();
            persistence.deleteQueue();
        }
        if ($scope.settings.Theme) {
            utils.switchTheme(globals.settings.Theme);
        }
        if($scope.settings.ShowQueue) {
            $rootScope.showQueue();
        } else {
            $rootScope.hideQueue();
        }
        persistence.saveSettings($scope.settings);
        notifications.updateMessage('Settings Updated!', true);
        $scope.loadSettings();
        if (globals.settings.Server !== '' && globals.settings.Username !== '' && globals.settings.Password !== '') {
            subsonic.ping().then(function (subsonicResponse) {
                globals.settings.ApiVersion = subsonicResponse.version;
                $location.path('/library').replace();
                $rootScope.showIndex = true;
            }, function (error) {
                //TODO: Hyz: Duplicate from subsonic.js - requestSongs. Find a way to handle this only once.
                globals.settings.ApiVersion = error.version;
                var errorNotif;
                if (error.subsonicError !== undefined) {
                    errorNotif = error.reason + ' ' + error.subsonicError.message;
                } else if (error.httpError !== undefined) {
                    errorNotif = error.reason + ' HTTP error ' + error.httpError;
                } else {
                    errorNotif = error.reason;
                }
                notifications.updateMessage(errorNotif, true);
            });
        }
    };
    json.getChangeLog(function (data) {
        $scope.changeLog = data.slice(0, 10);
        globals.ChangeLog = data;
    });
    $scope.changeLogShowMore = function () {
        json.getChangeLog(function (data) {
            $scope.changeLog = data;
        });
    };

    /* Load on Startup */
    if (typeof $location.search()['url'] != 'undefined' && $scope.settings.Server === '') {
        if (globals.settings.Debug) { console.log("Setting Provided: " + $location.search()['url']); }
        $scope.settings.Server = $location.search()['url'];
    }
    if (typeof $location.search()['u'] != 'undefined' && $scope.settings.Username === '') {
        if (globals.settings.Debug) { console.log("Setting Provided: " + $location.search()['u']); }
        $scope.settings.Username = $location.search()['u'];
    }
    /* End Startup */
}]);
