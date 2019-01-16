'use strict';

/* Declare app level module */
angular.module('JamStash', [
    'ngCookies',
    'ngRoute',
    'ngSanitize',
    'ngLodash',
    'jamstash.subsonic.controller',
    'jamstash.archive.controller',
    'jamstash.player.controller',
    'jamstash.queue.controller',
    'jamstash.settings.controller',
    'jamstash.persistence',
    'jamstash.loading'
])

.config(['$routeProvider',function ($routeProvider) {
    $routeProvider
        .when('/index', { redirectTo: '/library' })
        .when('/settings', { templateUrl: 'settings/settings.html', controller: 'SettingsController' })
        .when('/library', { templateUrl: 'subsonic/subsonic.html', controller: 'SubsonicController' })
        .when('/library/:artistId', { templateUrl: 'subsonic/subsonic.html', controller: 'SubsonicController', reloadOnSearch: false })
        .when('/library/:artistId/:albumId', { templateUrl: 'subsonic/subsonic.html', controller: 'SubsonicController', reloadOnSearch: false })
        .when('/podcasts', { templateUrl: 'podcasts/podcasts.html', controller: 'PodcastController' })
        .when('/archive', { templateUrl: 'archive/archive.html', controller: 'ArchiveController' })
        .when('/archive/:artist', { templateUrl: 'archive/archive.html', controller: 'ArchiveController' })
        .when('/archive/:artist/:album', { templateUrl: 'archive/archive.html', controller: 'ArchiveController' })
        .otherwise({ redirectTo: '/index' });
}])

.config(['$httpProvider', function httpConfig ($httpProvider) {
    $httpProvider.interceptors.push(authenticationInterceptor);
    $httpProvider.interceptors.push(loadingInterceptor);
}]);

authenticationInterceptor.$inject = ['$rootScope', '$location', '$q', 'globals'];
function authenticationInterceptor($rootScope, $location, $q, globals) {
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
}

loadingInterceptor.$inject = ['Loading'];
function loadingInterceptor(Loading) {
    return {
        request: function (request) {
            Loading.isLoading = true;
            return request;
        },
        response: function (response) {
            Loading.isLoading = false;
            return response;
        },
        responseError: function (error) {
            Loading.isLoading = false;
            return error;
        }
    };
}
