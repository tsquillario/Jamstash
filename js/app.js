/* Declare app level module */
var JamStash = angular.module('JamStash', ['ngCookies', 'ngRoute', 'ngSanitize']);
//var JamStash = angular.module('JamStash', ['ngCookies', 'ngRoute']);
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
.run(['$rootScope', '$location', 'globals', function ($rootScope, $location, globals) {
    $rootScope.$on("$locationChangeStart", function (event, next, current) {
        $rootScope.loggedIn = false;
        var path = $location.path().replace(/^\/([^\/]*).*$/, '$1');
        if (globals.settings.Username != "" && globals.settings.Password != "" && globals.settings.Server != "" && path != 'archive') {
            $rootScope.loggedIn = true;
        }
        if (!$rootScope.loggedIn && (path != 'settings' && path != 'archive')) {
            $location.path('/settings');
        }
    });
}]);
/*
JamStash.config(function ($httpProvider, globals) {
    $httpProvider.defaults.timeout = globals.settings.Timeout;
})
*/
