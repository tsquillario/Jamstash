JamStash.controller('PlaylistCtrl',
function PlaylistCtrl($scope, $rootScope, $location, utils, globals, model, notifications) {
    $rootScope.song = [];
    $scope.itemType = 'pl';
    $scope.playlists = [];
    $scope.playlistsPublic = [];
    $scope.playlistsGenre = globals.SavedGenres;
    $scope.selectedGenre = null;
    $scope.$watch("selectedGenre", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            globals.SavedGenres.push(newValue);
            //$scope.playlistsGenre.push();
            utils.setValue('SavedGenres', globals.SavedGenres.join(), false);
        }
    });
    
    

    /* Launch on Startup */
    $scope.getPlaylists();
    //$scope.getMusicFolders();
    $scope.getGenres();
    /* End Startup */
});