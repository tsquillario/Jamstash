angular.module('JamStash')

.controller('QueueCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'utils', 'globals',
	function QueueCtrl($scope, $rootScope, $routeParams, $location, utils, globals) {
	'use strict';
    $scope.settings = globals.settings;
    $scope.song = $rootScope.queue;
    //angular.copy($rootScope.queue, $scope.song);
    $scope.itemType = 'pl';
}]);
