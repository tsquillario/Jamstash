JamStash.controller('QueueCtrl',
function QueueCtrl($scope, $rootScope, $routeParams, $location, utils, globals, json, notifications) {
    $scope.settings = globals.settings;
    $scope.song = $rootScope.queue;
    //angular.copy($rootScope.queue, $scope.song);
    $scope.itemType = 'pl';
});
