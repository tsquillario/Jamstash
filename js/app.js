/* Declare app level module */
var JamStash = angular.module('JamStash', ['ngCookies']);
JamStash.config(function ($routeProvider) {
    $routeProvider
        .when('/index', { redirectTo: '/library' })
        .when('/settings', { templateUrl: 'js/partials/settings.html', controller: 'SettingsCtrl' })
        .when('/library', { templateUrl: 'js/partials/library.html', controller: 'SubsonicCtrl' })
        .when('/library/:albumId', { templateUrl: 'js/partials/library.html', controller: 'SubsonicCtrl' })
        .when('/playlists', { templateUrl: 'js/partials/playlists.html', controller: 'PlaylistCtrl' })
        .when('/podcasts', { templateUrl: 'js/partials/podcasts.html', controller: 'PodcastCtrl' })
        .when('/archive', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
        .when('/archive/:artist', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
        .when('/archive/:artist/:album', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
        .otherwise({ redirectTo: '/index' });
})
.run(['$rootScope', '$location', 'globals', function ($rootScope, $location, globals) {
    $rootScope.$on("$locationChangeStart", function (event, next, current) {
        $rootScope.loggedIn = false;
        var path = $location.path().replace(/^\/([^\/]*).*$/, '$1');
        if (globals.settings.Username != "" && globals.settings.Password != "" && globals.settings.Server != "") {
            $rootScope.loggedIn = true;
        }
        if (!$rootScope.loggedIn && (path != 'settings' && path != 'archive')) {
            $location.path('/settings');
        }
    });
} ]);

/*
JamStash.config(function ($httpProvider) {
    $httpProvider.interceptors.push(function ($rootScope, $location, $q, globals) {
        return {
            'request': function (request) {
                // if we're not logged-in to the AngularJS app, redirect to login page
                //$rootScope.loggedIn = $rootScope.loggedIn || globals.settings.Username;
                $rootScope.loggedIn = false;
                if (globals.settings.Username != "" && globals.settings.Password != "" && globals.settings.Server != "") {
                    $rootScope.loggedIn = true;
                }
                if (!$rootScope.loggedIn && $location.path() != '/settings' && $location.path() != '/archive') {
                    $location.path('/settings');
                }
                return request;
            },
            'responseError': function (rejection) {
                // if we're not logged-in to the web service, redirect to login page
                if (rejection.status === 401 && $location.path() != '/settings') {
                    $rootScope.loggedIn = false;
                    $location.path('/settings');
                }
                return $q.reject(rejection);
            }
        };
    });
});
*/


JamStash.service('model', function (utils) {
    this.Index = function (name, artist) {
        this.name = name;
        this.artist = artist;
    }
    this.Artist = function (id, name) {
        this.id = id;
        this.name = name;
    }
    this.Album = function (id, parentid, name, artist, coverartthumb, coverartfull, date, starred, description, url) {
        this.id = id;
        this.parentid = parentid;
        this.name = name;
        this.artist = artist;
        this.coverartthumb = coverartthumb;
        this.coverartfull = coverartfull;
        this.date = date;
        this.starred = starred;
        this.description = description;
        this.url = url;
    }
    this.Song = function (id, parentid, track, name, artist, artistId, album, albumId, coverartthumb, coverartfull, duration, rating, starred, suffix, specs, url, position, description) {
        this.id = id;
        this.parentid = parentid;
        this.track = track;
        this.name = name;
        this.artist = artist;
        this.artistId = artistId;
        this.album = album;
        this.albumId = albumId;
        this.coverartthumb = coverartthumb;
        this.coverartfull = coverartfull;
        this.duration = duration;
        this.time = duration == '' ? '00:00' : utils.secondsToTime(duration);
        this.rating = rating;
        this.starred = starred;
        this.suffix = suffix;
        this.specs = specs;
        this.url = url;
        this.position = position;
        this.selected = false;
        this.playing = false;
        this.description = description;
        this.displayName = this.name + " - " + this.album + " - " + this.artist;
    }
});

JamStash.service('globals', function (utils) {
    this.settings = {
        // Subsonic
        /* Demo Server
        Username: "android-guest"),
        Password: "guest"),
        Server: "http://subsonic.org/demo"),
        */
        Url: "http://Jamstash.com/beta/#/archive/",
        Username: "",
        Password: "",
        Server: "",
        Timeout: 10000,
        NotificationTimeout: 20000,
        Protocol: "jsonp",
        ApplicationName: "Jamstash",
        ApiVersion: "1.6.0",
        AutoPlaylists: "",
        AutoPlaylistSize: 25,
        AutoAlbumSize: 15,
        // General
        HideAZ: false,
        ScrollTitle: true,
        NotificationSong: true,
        NotificationNowPlaying: false,
        SaveTrackPosition: false,
        ForceFlash: false,
        Theme: "Default",
        AutoPlay: false,
        LoopQueue: false,
        Repeat: false,
        Debug: false
    };
    this.SavedCollections = [];
    this.SavedGenres = [];
    this.BaseURL = function () { return this.settings.Server + '/rest'; };
    this.BaseParams = function () { return 'u=' + this.settings.Username + '&p=' + this.settings.Password + '&f=' + this.settings.Protocol + '&v=' + this.settings.ApiVersion + '&c=' + this.settings.ApplicationName; };
});

// Directives
JamStash.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
});
JamStash.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});

/* Factory */
JamStash.factory('json', function ($http) { // Deferred loading
    return {
        getCollections: function (callback) {
            $http.get('js/json_collections.js').success(callback);
        },
        getChangeLog: function (callback) {
            $http.get('js/json_changelog.js').success(callback);
        }
    }
});

/* Filters */
JamStash.filter('capitalize', function () {
    return function (input, scope) {
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    }
});

JamStash.service('notifications', function ($rootScope, globals) {
    var msgIndex = 1;
    this.updateMessage = function (msg, autohide) {
        if (msg != '') {
            var id = msgIndex;
            $('#messages').append('<span id=\"msg_' + id + '\" class="message">' + msg + '</span>');
            $('#messages').fadeIn();
            $("#messages").scrollTo('100%');
            var el = '#msg_' + id;
            if (autohide) {
                setTimeout(function () {
                    $(el).fadeOut(function () { $(this).remove(); });
                }, globals.settings.NotificationTimeout);
            } else {
                $(el).click(function () {
                    $(el).fadeOut(function () { $(this).remove(); });
                    return false;
                });
            }
            msgIndex++;
        }
    }
    this.requestPermissionIfRequired = function () {
        if (!this.hasNotificationPermission() && (window.webkitNotifications)) {
            window.webkitNotifications.requestPermission();
        }
    }
    this.hasNotificationPermission = function () {
        return !!(window.webkitNotifications) && (window.webkitNotifications.checkPermission() == 0);
    }
    var notifications = new Array();
    this.showNotification = function (pic, title, text, type, bind) {
        if (this.hasNotificationPermission()) {
            //closeAllNotifications()
            var popup;
            if (type == 'text') {
                popup = window.webkitNotifications.createNotification(pic, title, text);
            } else if (type == 'html') {
                popup = window.webkitNotifications.createHTMLNotification(text);
            }
            if (bind = '#NextTrack') {
                popup.addEventListener('click', function (bind) {
                    //$(bind).click();
                    $rootScope.nextTrack();
                    this.cancel();
                })
            }
            notifications.push(popup);
            setTimeout(function (notWin) {
                notWin.cancel();
            }, globals.settings.NotificationTimeout, popup);
            popup.show();
        } else {
            console.log("showNotification: No Permission");
        }
    }
    this.closeAllNotifications = function () {
        for (notification in notifications) {
            notifications[notification].cancel();
        }
    }
});