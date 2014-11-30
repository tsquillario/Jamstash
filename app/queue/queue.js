angular.module('jamstash.queue.ctrl', ['jamstash.player.service'])

.controller('QueueCtrl', ['$scope', '$rootScope', 'globals', 'player',
	function QueueCtrl($scope, $rootScope, globals, player) {
	'use strict';
    $scope.settings = globals.settings;
    $scope.song = $rootScope.queue;
    //angular.copy($rootScope.queue, $scope.song);
    $scope.itemType = 'pl';

    $scope.playSong = function (loadonly, song) {
        player.playSong(loadonly, song);
    };
}]);
