angular.module('JamStash')

.controller('SettingsController', ['$rootScope', '$scope', '$routeParams', '$location', 'utils', 'globals', 'json', 'notifications', 'persistence',
    function ($rootScope, $scope, $routeParams, $location, utils, globals, json, notifications, persistence) {
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
        utils.setValue('Settings', null, true);
        $scope.loadSettings();
    };
    $scope.save = function () {
        if ($scope.settings.Password !== '' && globals.settings.Password.substring(0, 4) != 'enc:') { $scope.settings.Password = 'enc:' + utils.HexEncode($scope.settings.Password); }
        if ($scope.settings.Server.indexOf('http://') != 0 && $scope.settings.Server.indexOf('https://') != 0) { $scope.settings.Server = 'http://' + $scope.settings.Server; }
        if ($scope.settings.NotificationSong) {
            notifications.requestPermissionIfRequired();
            if (!notifications.hasNotificationSupport()) {
                alert('HTML5 Notifications are not available for your current browser, Sorry :(');
            }
        }
        if ($scope.settings.NotificationNowPlaying) {
            notifications.requestPermissionIfRequired();
            if (!notifications.hasNotificationSupport()) {
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
        utils.setValue('Settings', $scope.settings, true);
        notifications.updateMessage('Settings Updated!', true);
        $scope.loadSettings();
        if (globals.settings.Server !== '' && globals.settings.Username !== '' && globals.settings.Password !== '') {
            $scope.ping().then(function(data) {
                if (data["subsonic-response"].status == 'ok') {
                    globals.settings.ApiVersion = data["subsonic-response"].version;
                    $location.path('/library').replace();
                    $rootScope.showIndex = true;
                } else {
                    if (typeof data["subsonic-response"].error != 'undefined') {
                        notifications.updateMessage(data["subsonic-response"].error.message);
                    }
                }
            });
        }
    };
    json.getChangeLog(function (data) {
        $scope.changeLog = data.slice(0, 10);
        globals.ChangeLog = data;
        var newVersion = $scope.changeLog[0].version;
        if (!utils.getValue('JamstashVersion')) {
            utils.setValue('JamstashVersion', newVersion);
        }
        var oldVersion = utils.getValue('JamstashVersion');
        if (utils.checkVersionNewer(oldVersion, newVersion)) {
            utils.setValue('JamstashVersion', newVersion);
            notifications.updateMessage('Version ' + oldVersion + ' to ' + newVersion, true);
        }
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
