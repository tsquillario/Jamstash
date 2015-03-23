angular.module('jamstash.settings.controller', ['jamstash.settings.service', 'jamstash.persistence'])

.controller('SettingsController', ['$rootScope', '$scope', '$location', 'utils', 'globals', 'json', 'notifications', 'persistence', 'subsonic',
    function ($rootScope, $scope, $location, utils, globals, json, notifications, persistence, subsonic) {
    'use strict';
    $rootScope.hideQueue();
    $scope.settings = globals.settings; /* See service.js */
    $scope.Timeouts = [
        { id: 10000, name: 10 },
        { id: 20000, name: 20 },
        { id: 30000, name: 30 },
        { id: 40000, name: 40 },
        { id: 50000, name: 50 },
        { id: 60000, name: 60 },
        { id: 90000, name: 90 },
        { id: 120000, name: 120 }
    ];
    $scope.Protocols = ["json", "jsonp"];
    $scope.Themes = ["Default", "Dark"];
    $scope.SearchTypes = globals.SearchTypes;
    $scope.Layouts = globals.Layouts;

    $scope.$watch('settings.HideAZ', function () {
        if (globals.settings.HideAZ) {
            $('#AZIndex').hide();
        } else {
            $('#AZIndex').show();
        }
    });
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
    $scope.setupDemo = function () {
        var Username = "android-guest";
        var Password = "guest";
        var Server = "http://demo.subsonic.org";
        var Tab = "tabLibrary";
        if (utils.confirmDelete("Do you want to connect to the Subsonic Demo server?")) {
            globals.settings.Username = Username;
            globals.settings.Password = Password;
            globals.settings.Server = Server;
            $location.path('/library').replace();
            $rootScope.showIndex = true;
        }
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
