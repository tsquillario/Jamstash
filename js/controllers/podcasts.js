JamStash.controller('PodcastCtrl',
function PodcastCtrl($scope, $rootScope, $location, utils, globals, model, notifications) {
    $rootScope.song = [];
    

    /* Launch on Startup */
    $scope.getPodcasts();
    /* End Startup */
});