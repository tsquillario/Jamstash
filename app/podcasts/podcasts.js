
angular.module('JamStash')

.controller('PodcastController', ['$scope', '$rootScope', function ($scope, $rootScope) {
	'use strict';
    $rootScope.song = [];

    /* Launch on Startup */
    $scope.getPodcasts();
    /* End Startup */
}]);
