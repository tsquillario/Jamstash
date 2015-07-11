/**
* jamstash.breadcrumbs.directive Module
*
* Displays the breadcrumbs, a list of directory names. Can be a genre name, an artist name, an album name,
* or whatever really, dependending on the user's library layout.
*/
angular.module('jamstash.breadcrumbs.directive', [
    'ngLodash',
    'jamstash.breadcrumbs.service'
])

.directive('jamstashBreadcrumbs', [
    'lodash',
    'breadcrumbs',
    'subsonic',
    'notifications',
    function (
        _,
        breadcrumbs,
        subsonic,
        notifications
    ) {
    'use strict';
    var directive = {
        controller: breadcrumbsController,
        controllerAs: 'vm',
        restrict: 'E',
        templateUrl: 'subsonic/breadcrumbs-directive/breadcrumbs-directive.html',
        replace: true
    };

    breadcrumbsController.$inject = ['$scope', 'lodash'];
    function breadcrumbsController($scope, _) {
        var self = this;

        _.extend(self, {
            getBreadcrumbs: breadcrumbs.get,
            displaySongs: function (item) {
                var promise = subsonic.getDirectory(item.id);
                $scope.handleErrors(promise).then(function (data) {
                    $scope.album = data.directories;
                    $scope.song = data.songs;
                    breadcrumbs.popUntil(item);
                    $scope.selectedAutoAlbum = null;
                    $scope.selectedArtist = null;
                    $scope.selectedAlbum = item.id;
                    $scope.selectedAutoPlaylist = null;
                    $scope.selectedPlaylist = null;
                    $scope.selectedPodcast = null;
                    if ($scope.SelectedAlbumSort.id !== 'default') {
                        $scope.sortSubsonicAlbums($scope.SelectedAlbumSort.id);
                    }
                }, function (error) {
                    notifications.updateMessage(error.reason, true);
                });
            }
        });
    }

    return directive;
}]);
