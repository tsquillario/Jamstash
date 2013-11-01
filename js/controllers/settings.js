JamStash.controller('SettingsCtrl',
function SettingsCtrl($scope, $routeParams, $location, utils, globals, json, notifications) {
    $scope.settings = globals.settings;
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
    $scope.$watch('settings.HideAZ', function () {
        if (globals.settings.HideAZ) {
            $('#AZIndex').hide();
        } else {
            $('#AZIndex').show();
        }
    });
    $scope.save = function () {
        if ($scope.settings.Password != '' && globals.settings.Password.substring(0, 4) != 'enc:') { $scope.settings.Password = 'enc:' + utils.HexEncode($scope.settings.Password); }
        if (globals.settings.NotificationSong) {
            notifications.requestPermissionIfRequired();
            if (!notifications.hasNotificationPermission()) {
                alert('HTML5 Notifications are not available for your current browser, Sorry :(');
            }
        }
        if (globals.settings.NotificationNowPlaying) {
            notifications.requestPermissionIfRequired();
            if (!notifications.hasNotificationPermission()) {
                alert('HTML5 Notifications are not available for your current browser, Sorry :(');
            }
        }
        if (globals.settings.SaveTrackPosition) {
            //saveTrackPosition();
        } else {
            //deleteCurrentPlaylist();
        }
        if (globals.settings.Theme) {
            utils.switchTheme(globals.settings.Theme);
        }
        utils.setValue('Settings', $scope.settings, true);
        notifications.updateMessage('Settings Updated!', true);
        $scope.loadSettings();
        if (globals.settings.Server != '' && globals.settings.Username != '' && globals.settings.Password != '') {
            $scope.ping();
        }
    };
    json.getChangeLog(function (data) {
        $scope.changeLog = data.slice(0, 10);
    });
    $scope.changeLogShowMore = function () {
        json.getChangeLog(function (data) {
            $scope.changeLog = data;
        });
    }
    $scope.setupDemo = function () {
        var Username = "android-guest";
        var Password = "guest";
        var Server = "http://subsonic.org/demo";
        var Tab = "tabLibrary";
        if (utils.confirmDelete("Do you want to connect to the Subsonic Demo server?")) {
            globals.settings.Username = Username;
            globals.settings.Password = Password;
            globals.settings.Server = Server;
            //$scope.save();
            $location.url('/library');
        }
    }

    /* Load on Startup */
    /* End Startup */
});