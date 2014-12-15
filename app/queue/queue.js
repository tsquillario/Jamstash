angular.module('jamstash.queue.controller', ['jamstash.player.service'])

.controller('QueueController', ['$scope', 'globals', 'player',
	function ($scope, globals, player) {
	'use strict';
    $scope.settings = globals.settings;
    $scope.song = player.queue;
    //angular.copy($rootScope.queue, $scope.song);
    $scope.itemType = 'pl';

    $scope.playSong = function (song) {
        player.play(song);
    };
}]);
