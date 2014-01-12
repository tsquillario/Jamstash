JamStash.controller('PartialCtrl',
function PartialCtrl($scope, $rootScope, $location, $window, $routeParams, utils, globals) {
    //$("#SubsonicAlbums").layout($scope.layoutThreeCol);

    $scope.song = [];
    $scope.itemType = 'ss';
    $scope.index = [];
    $scope.shortcut = [];
    $scope.album = [];
    $scope.Server = globals.settings.Server;
    
    $scope.getSongs = function (id) {
        var url = globals.BaseURL() + '/getMusicDirectory.view?' + globals.BaseParams() + '&id=' + id;
        $.ajax({
            url: url,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                var items = [];
                if (typeof data["subsonic-response"].directory.child != 'undefined') {
                    if (data["subsonic-response"].directory.child.length > 0) {
                        items = data["subsonic-response"].directory.child;
                    } else {
                        items[0] = data["subsonic-response"].directory.child;
                    }
                    $scope.song = [];
                    var albums = [];
                    angular.forEach(items, function (item, key) {
                        if (item.isDir) {
                            //albums.push($scope.mapAlbum(item));
                        } else {
                            $rootScope.song.push(utils.mapSong(item));
                        }
                    });
                    //$location.path('/library/0/' + id);
                    $scope.$apply();
                } else {
                    notifications.updateMessage('No Songs Returned :(', true);
                }
            }
        });
    };

    
    
    /* Launch on Startup */
    if ($routeParams.albumId) {
        $scope.getSongs($routeParams.albumId);
    } 
    /* End Startup */
});
