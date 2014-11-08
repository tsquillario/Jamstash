
angular.module('JamStash')

.controller('PodcastCtrl', ['$scope', '$rootScope', function PodcastCtrl($scope, $rootScope) {
	'use strict';
    $rootScope.song = [];

    /* Launch on Startup */
    $scope.getPodcasts();
    /* End Startup */
}]);