JamStash.controller('PlaylistCtrl',
function PlaylistCtrl($scope, $rootScope, $location, utils, globals, model, notifications) {
    //$("#left-component").layout($scope.layoutTwoCol);

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
    $scope.getPlaylists = function (refresh) {
        if (globals.settings.Debug) { console.log("LOAD PLAYLISTS"); }
        $.ajax({
            url: globals.BaseURL() + '/getPlaylists.view?' + globals.BaseParams(),
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (data["subsonic-response"].playlists.playlist !== undefined) {
                    var items = [];
                    if (data["subsonic-response"].playlists.playlist.length > 0) {
                        items = data["subsonic-response"].playlists.playlist;
                    } else {
                        items[0] = data["subsonic-response"].playlists.playlist;
                    }
                    angular.forEach(items, function (item, key) {
                        if (item.owner == globals.settings.Username) {
                            $scope.playlists.push(item);
                        } else if (item.public) {
                            $scope.playlistsPublic.push(item);
                        }
                    });
                    $scope.$apply();
                }
            }
        });
    };
    $scope.getPlaylist = function (id, action) {
        $rootScope.selectedAutoPlaylist = null;
        $rootScope.selectedPlaylist = id;
        $.ajax({
            url: globals.BaseURL() + '/getPlaylist.view?' + globals.BaseParams() + '&id=' + id,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (typeof data["subsonic-response"].playlist.entry != 'undefined') {
                    var items = [];
                    var playlist = data["subsonic-response"].playlist;
                    if (playlist.entry.length > 0) {
                        items = playlist.entry;
                    } else {
                        items[0] = playlist.entry;
                    }
                    if (action == 'add') {
                        angular.forEach(items, function (item, key) {
                            $rootScope.queue.push(utils.mapSong(item));
                        });
                        $scope.$apply();
                        //$rootScope.showQueue();
                        notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                    } else if (action == 'play') {
                        $rootScope.queue = [];
                        angular.forEach(items, function (item, key) {
                            $rootScope.queue.push(utils.mapSong(item));
                        });
                        var next = $rootScope.queue[0];
                        $scope.$apply(function () {
                            $rootScope.playSong(false, next);
                        });
                        //$rootScope.showQueue();
                        notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                    } else {
                        $scope.album = [];
                        $rootScope.song = [];
                        angular.forEach(items, function (item, key) {
                            $rootScope.song.push(utils.mapSong(item));
                        });
                        $scope.$apply();
                    }
                } else {
                    $rootScope.song = [];
                }
            }
        });
    };
    $scope.getStarred = function (action, type) {
        var size = globals.settings.AutoPlaylistSize;
        $rootScope.selectedPlaylist = null;
        $rootScope.selectedAutoPlaylist = 'starred';
        $.ajax({
            url: globals.BaseURL() + '/getStarred.view?' + globals.BaseParams() + '&size=' + size,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (typeof data["subsonic-response"].starred !== 'undefined') {
                    var items = [];
                    switch (type) {
                        case 'artist':
                            if (typeof data["subsonic-response"].starred.artist !== 'undefined') {
                                if (data["subsonic-response"].starred.artist.length > 0) {
                                    items = data["subsonic-response"].starred.artist;
                                } else {
                                    items[0] = data["subsonic-response"].starred.artist;
                                }
                            }
                            break;
                        case 'album':
                            if (typeof data["subsonic-response"].starred.album !== 'undefined') {
                                if (data["subsonic-response"].starred.album.length > 0) {
                                    items = data["subsonic-response"].starred.album;
                                } else {
                                    items[0] = data["subsonic-response"].starred.album;
                                }
                            }
                            break;
                        case 'song':
                            if (typeof data["subsonic-response"].starred.song !== 'undefined') {
                                if (data["subsonic-response"].starred.song.length > 0) {
                                    items = data["subsonic-response"].starred.song;
                                } else {
                                    items[0] = data["subsonic-response"].starred.song;
                                }
                                if (action == 'add') {
                                    angular.forEach(items, function (item, key) {
                                        $rootScope.queue.push(utils.mapSong(item));
                                    });
                                    $scope.$apply();
                                    //$rootScope.showQueue();
                                    notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                                } else if (action == 'play') {
                                    $rootScope.queue = [];
                                    angular.forEach(items, function (item, key) {
                                        $rootScope.queue.push(utils.mapSong(item));
                                    });
                                    var next = $rootScope.queue[0];
                                    $scope.$apply(function () {
                                        $rootScope.playSong(false, next);
                                    });
                                    //$rootScope.showQueue();
                                    notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                                } else {
                                    $rootScope.song = [];
                                    angular.forEach(items, function (item, key) {
                                        $rootScope.song.push(utils.mapSong(item));
                                    });
                                    $scope.$apply();
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        });
    };
    $scope.newPlaylist = function (data, event) {
        var reply = prompt("Choose a name for your new playlist.", "");
        if (reply != 'null' && reply !== null && reply !== '') {
            $.ajax({
                url: globals.BaseURL() + '/createPlaylist.view?' + globals.BaseParams() + '&name=' + reply,
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: globals.settings.Timeout,
                success: function (data) {
                    loadPlaylists(true);
                }
            });
        }
    };
    $scope.deletePlaylist = function () {
        if ($rootScope.selectedPlaylist !== null) {
            var id = $rootScope.selectedPlaylist;
            if (utils.confirmDelete('Are you sure you want to delete the selected playlist?')) {
                $.ajax({
                    url: globals.BaseURL() + '/deletePlaylist.view?' + globals.BaseParams() + '&id=' + id,
                    method: 'GET',
                    dataType: globals.settings.Protocol,
                    timeout: globals.settings.Timeout,
                    success: function (data) {
                        $scope.getPlaylists();
                    }
                });
            }
        }
    };
    $scope.savePlaylist = function () {
        if ($rootScope.selectedPlaylist() !== null) {
            var id = $rootScope.selectedPlaylist().id();
            var songs = [];
            ko.utils.arrayForEach($rootScope.song(), function (item) {
                songs.push(item.id);
            });
            if (songs.length > 0) {
                $.ajax({
                    type: 'GET',
                    url: globals.BaseURL() + '/createPlaylist.view?' + globals.BaseParams(),
                    dataType: globals.settings.Protocol,
                    timeout: globals.settings.Timeout,
                    data: { playlistId: id, songId: songs },
                    success: function () {
                        $scope.getPlaylist(id);
                        notifications.updateMessage('Playlist Updated!', true);
                    },
                    traditional: true // Fixes POST with an array in JQuery 1.4
                });
            }
        }
    };
    $scope.removeSelectedSongs = function (data, event) {
        ko.utils.arrayForEach($scope.selectedSongs(), function (item) {
            $rootScope.song.remove(item);
        });
    };
    /* End Playlists */

    /* Launch on Startup */
    $scope.getPlaylists();
    //$scope.getMusicFolders();
    $scope.getGenres();
    /* End Startup */
});