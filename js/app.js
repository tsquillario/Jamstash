/* Declare app level module */
var JamStash = angular.module('JamStash', ['ngCookies', 'ngRoute', 'ngSanitize']);
//var JamStash = angular.module('JamStash', ['ngCookies', 'ngRoute']);

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
        DefaultLibraryLayout: "grid",
        AutoPlay: false,
        LoopQueue: false,
        Repeat: false,
        Debug: false
    };
    this.DefaultCollection = [];
    this.SavedGenres = [];
    this.BaseURL = function () { return this.settings.Server + '/rest'; };
    this.BaseParams = function () { return 'u=' + this.settings.Username + '&p=' + this.settings.Password + '&f=' + this.settings.Protocol + '&v=' + this.settings.ApiVersion + '&c=' + this.settings.ApplicationName; };
});
/*
JamStash.config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['/^\s*(https?|file|ms-appx):/', 'self']);
});

// Given:
// URL: http://server.com/index.html#/Chapter/1/Section/2?search=moby
// Route: /Chapter/:chapterId/Section/:sectionId
//
// Then
$routeParams ==> {chapterId:1, sectionId:2, search:'moby'}
*/
/*
JamStash.config(function ($stateProvider) {
    $stateProvider
    .state('root', {
        url: '',
        views: {
            'settings': {
                url: '/settings',
                templateUrl: 'js/partials/settings.html',
                controller: 'SettingsCtrl'
            },
            'library': {
                url: '/library',
                templateUrl: 'js/partials/library.html',
                controller: 'SubsonicCtrl'
            }
        }
    })
});

JamStash.config(function ($stateProvider) {
    $stateProvider
        .state('root', {
            url: '/',
            templateUrl: 'js/partials/library.html',
            controller: 'SubsonicCtrl'
        })
        .state('settings', {
            url: '/settings',
            templateUrl: 'js/partials/settings.html',
            controller: 'SettingsCtrl'
        })
        .state('library', {
            url: '/library',
            templateUrl: 'js/partials/library.html',
            controller: 'SubsonicCtrl'
        });
})

*/

JamStash.config(function ($routeProvider) {
    $routeProvider
        .when('/index', { redirectTo: '/library' })
        .when('/settings', { templateUrl: 'js/partials/settings.html', controller: 'SettingsCtrl' })
        .when('/queue', { templateUrl: 'js/partials/queue.html', controller: 'QueueCtrl' })
        .when('/library', { templateUrl: 'js/partials/library.html', controller: 'SubsonicCtrl' })
        .when('/library/:artistId', { templateUrl: 'js/partials/library.html', controller: 'SubsonicCtrl', reloadOnSearch: false })
        .when('/library/:artistId/:albumId', { templateUrl: 'js/partials/library.html', controller: 'SubsonicCtrl', reloadOnSearch: false })
        .when('/playlists', { templateUrl: 'js/partials/playlists.html', controller: 'PlaylistCtrl' })
        .when('/podcasts', { templateUrl: 'js/partials/podcasts.html', controller: 'PodcastCtrl' })
        .when('/archive', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
        .when('/archive/:artist', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
        .when('/archive/:artist/:album', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
        .otherwise({ redirectTo: '/index' });
})

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

