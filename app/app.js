'use strict';

/* Declare app level module */
var jamstash = angular.module('JamStash', ['ngCookies', 'ngRoute', 'ngSanitize',
    'jamstash.subsonic.ctrl']);

jamstash.config(function ($routeProvider) {
    $routeProvider
        .when('/index', { redirectTo: '/library' })
        .when('/settings', { templateUrl: 'settings/settings.html', controller: 'SettingsCtrl' })
        .when('/queue', { templateUrl: 'queue/queue.html', controller: 'QueueCtrl' })
        .when('/library', { templateUrl: 'subsonic/subsonic.html', controller: 'SubsonicCtrl' })
        .when('/library/:artistId', { templateUrl: 'subsonic/subsonic.html', controller: 'SubsonicCtrl', reloadOnSearch: false })
        .when('/library/:artistId/:albumId', { templateUrl: 'subsonic/subsonic.html', controller: 'SubsonicCtrl', reloadOnSearch: false })
        .when('/podcasts', { templateUrl: 'podcasts/podcasts.html', controller: 'PodcastCtrl' })
        .when('/archive', { templateUrl: 'archive/archive.html', controller: 'ArchiveCtrl' })
        .when('/archive/:artist', { templateUrl: 'archive/archive.html', controller: 'ArchiveCtrl' })
        .when('/archive/:artist/:album', { templateUrl: 'archive/archive.html', controller: 'ArchiveCtrl' })
        .otherwise({ redirectTo: '/index' });
});

jamstash.config(function ($httpProvider) {
    $httpProvider.interceptors.push(function ($rootScope, $location, $q, globals) {
        return {
            'request': function (request) {
                // if we're not logged-in to the AngularJS app, redirect to login page
                //$rootScope.loggedIn = $rootScope.loggedIn || globals.settings.Username;
                $rootScope.loggedIn = false;
                if (globals.settings.Username != "" && globals.settings.Password != "" && globals.settings.Server != "") {
                    $rootScope.loggedIn = true;
                }
				var path = '';
				path = $location.path();
				if (globals.settings.Debug) { console.log('Logged In: ' + $rootScope.loggedIn); }
				if (globals.settings.Debug) { console.log('Current Path: ' + path); }
                if (!$rootScope.loggedIn && path != '/settings' && path.search('archive') < 0) {
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
