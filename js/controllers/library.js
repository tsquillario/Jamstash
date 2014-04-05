JamStash.controller('SubsonicCtrl',
function SubsonicCtrl($scope, $rootScope, $location, $window, $routeParams, utils, globals, model, notifications, player) {
    //$("#SubsonicAlbums").layout($scope.layoutThreeCol);

    $rootScope.song = [];
    //$scope.artistId = $routeParams.artistId;
    //$scope.albumId = $routeParams.albumId;
    $scope.settings = globals.settings;
    $scope.itemType = 'ss';
    $scope.index = [];
    $scope.shortcut = [];
    $scope.album = [];
    $scope.Server = globals.settings.Server;
    $scope.playlistMenu = [];
    $scope.AutoAlbums = [
        { id: "random", name: "Random" },
        { id: "newest", name: "Recently Added" },
        { id: "starred", name: "Starred" },
        { id: "highest", name: "Top Rated" },
        { id: "frequent", name: "Most Played" },
        { id: "recent", name: "Recently Played" }
    ];
    $scope.selectedAutoAlbum = null;
    $scope.selectedArtist = null;
    $scope.selectedAlbum = null;
    $scope.SelectedAlbumSort = globals.settings.DefaultAlbumSort;
    $scope.AlbumSort = globals.AlbumSorts;
    $scope.BreadCrumbs = [];
    $scope.$watch("SelectedAlbumSort.id", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            if ($rootScope.song.length > 0) {
                $scope.sortSubsonicSongs(newValue);
            } else if ($scope.album.length > 0) {
                $scope.sortSubsonicAlbums(newValue);
                indexes = $.map(globals.AlbumSorts, function (obj, index) {
                    if (obj.id == newValue) {
                        return index;
                    }
                });
                globals.settings.DefaultAlbumSort = globals.AlbumSorts[indexes];
            }
        }
    });
    $rootScope.$watch("SelectedMusicFolder", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            utils.setValue('MusicFolders', angular.toJson(newValue), true);
            $scope.getArtists(newValue.id);
        }
    });
    $scope.SearchType = globals.settings.DefaultSearchType;
    $scope.SearchTypes = globals.SearchTypes;
    $scope.rescanLibrary = function (data, event) {
        $.ajax({
            url: globals.BaseURL() + '/getUser.view?' + globals.BaseParams() + '&username=' + globals.settings.Username,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (data["subsonic-response"].user.adminRole === true) {
                    $.get(globals.settings.Server + '/musicFolderSettings.view?scanNow');
                } else {
                    alert('You are not logged in as an admin user!');
                }
            }
        });
    };
    $scope.mapArtist = function (data) {
        var name = '';
        var artist = data.artist;
        var artists = [];
        if (artist.length > 0) {
            artists = artist;
        } else {
            artists[0] = artist;
        }
        angular.forEach(artists, function (item, key) {
            if (typeof item.name !== 'undefined') { item.name = item.name.toString(); }
        });
        if (typeof data.name !== 'undefined') { name = data.name.toString(); }
        return new model.Index(name, artists);
    };
    $scope.mapIndex = function (data) {
        var name, id = '';
        if (typeof data.id !== 'undefined') { id = data.id; }
        if (typeof data.name !== 'undefined') { name = data.name.toString(); }
        return new model.Artist(id, name);
    };
    $scope.mapPlaylist = function (data) {
        return new model.Artist(data.id, data.name);
    };
    $scope.getArtists = function (id) {
        var url;
        if (utils.getValue('MusicFolders')) {
            var folder = angular.fromJson(utils.getValue('MusicFolders'));
            id = folder.id;
        }
        if (id) {
            url = globals.BaseURL() + '/getIndexes.view?' + globals.BaseParams() + '&musicFolderId=' + id;
        } else {
            url = globals.BaseURL() + '/getIndexes.view?' + globals.BaseParams();
        }
        $.ajax({
            url: url,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            done: function () { if (globals.settings.Debug) { console.log("DONE!"); } },
            error: function () { if (globals.settings.Debug) { console.log("ERROR!"); } },
            success: function (data) {
                var indexes = [];
                if (typeof data["subsonic-response"].indexes.index != 'undefined') {
                    if (data["subsonic-response"].indexes.index.length > 0) {
                        //angular.forEach(items, function(item, key) {
                        //});
                        //$.makeArray(obj)
                        indexes = data["subsonic-response"].indexes.index;
                    } else {
                        indexes[0] = data["subsonic-response"].indexes.index;
                    }
                }
                // TODO: AZIndex, build letters here. Make it a click button somewhere then a larger popup with letters finger friendly size
                $scope.shortcut = [];
                var items = [];
                if (typeof data["subsonic-response"].indexes.shortcut != 'undefined') {
                    if (data["subsonic-response"].indexes.shortcut.length > 0) {
                        items = data["subsonic-response"].indexes.shortcut;
                    } else {
                        items[0] = data["subsonic-response"].indexes.shortcut;
                    }
                    angular.forEach(items, function (item, key) {
                        $scope.shortcut.push($scope.mapIndex(item));
                    });
                }
                $scope.index = [];
                angular.forEach(indexes, function (item, key) {
                    $scope.index.push($scope.mapArtist(item));
                });
                $scope.$apply();
            }
        });
    };
    $scope.refreshArtists = function (id) {
        utils.setValue('MusicFolders', null, true);
        $scope.getArtists();
    };

    $scope.mapAlbum = function (data) {
        var album = data;
        var title, coverartthumb, coverartfull, starred;
        if (typeof album.coverArt != 'undefined') {
            coverartthumb = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=160&id=' + album.coverArt;
            coverartfull = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&id=' + album.coverArt;
        }
        if (typeof album.starred !== 'undefined') { starred = true; } else { starred = false; }
        if (typeof album.title !== 'undefined') { title = album.title; } else { title = album.name; }
        var type;
        if (album.isDir) {
            type = 'byfolder';
        } else {
            type = 'bytag';
        }
        return new model.Album(album.id, album.parent, title, album.artist.toString(), album.artistId, coverartthumb, coverartfull, $.format.date(new Date(album.created), "yyyy-MM-dd h:mm a"), starred, '', '', type);
    };
    $scope.getAlbums = function (id, name) {
        $scope.selectedAutoAlbum = null;
        $scope.selectedArtist = id;
        $scope.BreadCrumbs = [];
        $scope.BreadCrumbs.push({ 'type': 'artist', 'id': id, 'name': name });
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
                    $scope.album = [];
                    $rootScope.song = [];

                    angular.forEach(items, function (item, key) {
                        if (item.isDir) {
                            $scope.album.push($scope.mapAlbum(item));
                        } else {
                            $rootScope.song.push(utils.mapSong(item));
                        }
                    });
                    if ($scope.SelectedAlbumSort.id != "default") {
                        $scope.sortSubsonicAlbums($scope.SelectedAlbumSort.id);
                    }
                    $scope.$apply();
                } else {
                    notifications.updateMessage('No Albums Returned :(', true);
                }
            }
        });
    };
    $scope.getArtistByTag = function (id) { // Gets Artist by ID3 tag
        /*
        var map = {
        create: function (options) {
        var album = options.data;
        var coverart, starred;
        if (typeof album.coverArt != 'undefined') {
        coverart = self.settings.BaseURL() + '/getCoverArt.view?' + self.settings.BaseParams() + '&size=50&id=' + album.coverArt;
        }
        if (typeof album.starred !== 'undefined') { starred = true; } else { starred = false; }
        return new model.Album(album.id, album.parent, album.name, album.artist, coverart, album.created, starred, '', '');
        }
        }
        */

        $scope.selectedAutoAlbum = null;
        $scope.selectedArtist = id;
        var url = globals.BaseURL() + '/getArtist.view?' + globals.BaseParams() + '&id=' + id;
        $.ajax({
            url: url,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                var items = [];
                if (typeof data["subsonic-response"].artist != 'undefined') {
                    if (data["subsonic-response"].artist.album.length > 0) {
                        items = data["subsonic-response"].artist.album;
                    } else {
                        items[0] = data["subsonic-response"].artist.album;
                    }
                    $scope.album = [];
                    $rootScope.song = [];

                    angular.forEach(items, function (item, key) {
                        $scope.album.push($scope.mapAlbum(item));
                    });
                    $scope.$apply();
                } else {
                    notifications.updateMessage('No Albums Returned :(', true);
                }
            }
        });
    };
    $scope.getAlbumByTag = function (id) { // Gets Album by ID3 tag
        $.ajax({
            url: globals.BaseURL() + '/getAlbum.view?' + globals.BaseParams() + '&id=' + id,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (typeof data["subsonic-response"].album != 'undefined') {
                    $scope.album = [];
                    $rootScope.song = [];

                    //$scope.album.push($scope.mapAlbum(data["subsonic-response"].album));

                    var items = [];
                    if (data["subsonic-response"].album.song.length > 0) {
                        items = data["subsonic-response"].album.song;
                    } else {
                        items[0] = data["subsonic-response"].album.song;
                    }
                    angular.forEach(items, function (item, key) {
                        $rootScope.song.push(utils.mapSong(item));
                    });
                    $scope.$apply();
                }
            }
        });
    };
    $scope.offset = 0;
    $scope.getAlbumListBy = function (id, offset) {
        var size, url;
        $scope.selectedArtist = null;
        $scope.selectedAutoAlbum = id;
        $scope.BreadCrumbs = [];
        if (offset == 'next') {
            $scope.offset = $scope.offset + globals.settings.AutoAlbumSize;
        } else if (offset == 'prev') {
            $scope.offset = $scope.offset - globals.settings.AutoAlbumSize;
        }
        if ($scope.offset > 0) {
            url = globals.BaseURL() + '/getAlbumList.view?' + globals.BaseParams() + '&size=' + globals.settings.AutoAlbumSize.toString() + '&type=' + id + '&offset=' + $scope.offset;
        } else {
            url = globals.BaseURL() + '/getAlbumList.view?' + globals.BaseParams() + '&size=' + globals.settings.AutoAlbumSize.toString() + '&type=' + id;
        }
        $.ajax({
            url: url,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                var items = [];
                if (typeof data["subsonic-response"].albumList.album != 'undefined') {
                    if (data["subsonic-response"].albumList.album.length > 0) {
                        items = data["subsonic-response"].albumList.album;
                    } else {
                        items[0] = data["subsonic-response"].albumList.album;
                    }
                    $scope.album = [];
                    $rootScope.song = [];
                    angular.forEach(items, function (item, key) {
                        if (item.isDir) {
                            $scope.album.push($scope.mapAlbum(item));
                        } else {
                            $rootScope.song.push($scope.mapAlbum(item));
                        }
                    });
                    if ($scope.SelectedAlbumSort.id != "default") {
                        $scope.sortSubsonicAlbums($scope.SelectedAlbumSort.id);
                    }
                    $scope.$apply();
                } else {
                    notifications.updateMessage('No Albums Returned :(', true);
                }
            }
        });
    };
    $scope.getSongs = function (id, action) {
        $scope.selectedAlbum = id;
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
                    } else if (action == 'preview') {
                        $scope.songpreview = [];
                        angular.forEach(items, function (item, key) {
                            if (!item.isDir) {
                                $rootScope.songpreview.push(utils.mapSong(item));
                            }
                        });
                        $scope.$apply();
                    } else {
                        if (typeof data["subsonic-response"].directory.id != 'undefined') {
                            var albumId = data["subsonic-response"].directory.id;
                            var albumName = data["subsonic-response"].directory.name;
                            if ($scope.BreadCrumbs.length > 0) { $scope.BreadCrumbs.splice(1, ($scope.BreadCrumbs.length - 1)); }
                            $scope.BreadCrumbs.push({ 'type': 'album', 'id': albumId, 'name': albumName });
                        }
                        $rootScope.song = [];
                        $scope.album = [];
                        var albums = [];
                        angular.forEach(items, function (item, key) {
                            if (item.isDir) {
                                albums.push($scope.mapAlbum(item));
                            } else {
                                $rootScope.song.push(utils.mapSong(item));
                            }
                        });
                        if (albums.length > 0) {
                            $scope.album = albums;
                            if ($scope.SelectedAlbumSort.id != "default") {
                                $scope.sortSubsonicAlbums($scope.SelectedAlbumSort.id);
                            }
                        }
                        $scope.$apply();
                    }
                } else {
                    notifications.updateMessage('No Songs Returned :(', true);
                }
            }
        });
    };
    $scope.search = function () {
        var query = $('#Search').val();
        if (query !== '') {
            var type = $('#SearchType').val();
            $.ajax({
                url: globals.BaseURL() + '/search2.view?' + globals.BaseParams() + '&query=' + query,
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: globals.settings.Timeout,
                success: function (data) {
                    if (data["subsonic-response"].searchResult2 !== "") {
                        var header;
                        var items = [];
                        if (type === '0') {
                            if (data["subsonic-response"].searchResult2.song !== undefined) {
                                if (data["subsonic-response"].searchResult2.song.length > 0) {
                                    items = data["subsonic-response"].searchResult2.song;
                                } else {
                                    items[0] = data["subsonic-response"].searchResult2.song;
                                }
                                $scope.album = [];
                                $rootScope.song = [];
                                angular.forEach(items, function (item, key) {
                                    $rootScope.song.push(utils.mapSong(item));
                                });
                                $scope.$apply();
                            }
                        }
                        if (type === '1') {
                            if (data["subsonic-response"].searchResult2.album !== undefined) {
                                if (data["subsonic-response"].searchResult2.album.length > 0) {
                                    items = data["subsonic-response"].searchResult2.album;
                                } else {
                                    items[0] = data["subsonic-response"].searchResult2.album;
                                }
                                $scope.album = [];
                                $rootScope.song = [];
                                angular.forEach(items, function (item, key) {
                                    if (item.isDir) {
                                        $scope.album.push($scope.mapAlbum(item));
                                    } else {
                                        $rootScope.song.push($scope.mapAlbum(item));
                                    }
                                });
                                $scope.$apply();
                            }
                        }
                        if (type === '2') {
                            if (data["subsonic-response"].searchResult2.artist !== undefined) {
                                if (data["subsonic-response"].searchResult2.artist.length > 0) {
                                    items = data["subsonic-response"].searchResult2.artist;
                                } else {
                                    items[0] = data["subsonic-response"].searchResult2.artist;
                                }
                                angular.forEach(items, function (item, key) {
                                    $scope.shortcut.push(item);
                                });
                                $scope.$apply();
                            }
                        }
                    }
                }
            });
            //$('#Search').val("");
        }
    };
    $scope.toggleAZ = function (event) {
        $scope.toggleSubmenu('#submenu_AZIndex', '#AZIndex', 'right', 44);
    };
    $scope.loadPlaylistsForMenu = function (data, event) {
        $.ajax({
            url: globals.BaseURL() + '/getPlaylists.view?' + globals.BaseParams(),
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                var playlists = [];
                $scope.playlistMenu = [];
                if (typeof data["subsonic-response"].playlists.playlist != 'undefined') {
                    if (data["subsonic-response"].playlists.playlist.length > 0) {
                        playlists = data["subsonic-response"].playlists.playlist;
                    } else {
                        playlists[0] = data["subsonic-response"].playlists.playlist;
                    }
                    angular.forEach(playlists, function (item, key) {
                        if (item.owner == globals.settings.Username) {
                            $scope.playlistMenu.push($scope.mapPlaylist(item));
                        }
                    });
                    if ($scope.playlistMenu.length > 0) {
                        $scope.$apply();
                        $scope.toggleSubmenu('#submenu_AddToPlaylist', '#action_AddToPlaylist', 'left', 124);
                    } else {
                        notifications.updateMessage('No Playlists :(', true);
                    }
                }
                /*
                $("<a href=\"#\" childid=\"new\">+ New</a><br />").appendTo("#" + menu);
                $.each(playlists, function (i, playlist) {
                $('<a href=\"#\" id=\"' + playlist.id + '\">' + playlist.name + '</a><br />').appendTo("#" + menu);
                });
                */
            }
        });
    };
    $scope.addToPlaylist = function (id) {
        var songs = [];
        if ($scope.selectedSongs.length !== 0) {
            angular.forEach($scope.selectedSongs, function (item, key) {
                songs.push(item.id);
            });
            var runningVersion = utils.parseVersionString(globals.settings.ApiVersion);
            var minimumVersion = utils.parseVersionString('1.8.0');
            if (utils.checkVersion(runningVersion, minimumVersion)) { // is 1.8.0 or newer
                $.ajax({
                    type: 'GET',
                    url: globals.BaseURL() + '/updatePlaylist.view?' + globals.BaseParams(),
                    dataType: globals.settings.Protocol,
                    timeout: globals.settings.Timeout,
                    data: { playlistId: id, songIdToAdd: songs },
                    success: function (data) {
                        $scope.selectedSongs.length = 0;
                        notifications.updateMessage('Playlist Updated!', true);
                    },
                    traditional: true // Fixes POST with an array in JQuery 1.4
                });
            }
        }
    };
    $scope.sortDateFunction = function (a, b) {
        return a.date < b.date ? 1 : -1;
    };
    $scope.sortArtistFunction = function (a, b) {
        return a.artist.toLowerCase() < b.artist.toLowerCase() ? -1 : 1;
    };
    $scope.sortAlbumFunction = function (a, b) {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    };
    $scope.sortTrackFunction = function (a, b) {
        return parseInt(a.track) > parseInt(b.track) ? -1 : 1;
    };
    $scope.sortSubsonicAlbums = function (newValue) {
        if (typeof newValue != 'undefined') {
            //alert(newValue);
            switch (newValue) {
                case 'createdate desc':
                    $scope.album.sort($scope.sortDateFunction);
                    break;
                case 'artist':
                    $scope.album.sort($scope.sortArtistFunction);
                    break;
                case 'album':
                    $scope.album.sort($scope.sortAlbumFunction);
                    break;
            }
        }
    };
    $scope.sortSubsonicSongs = function (newValue) {
        if (typeof newValue != 'undefined') {
            //alert(newValue);
            switch (newValue) {
                case 'createdate desc':
                    $rootScope.song.sort($scope.sortDateFunction);
                    break;
                case 'artist':
                    $rootScope.song.sort($scope.sortArtistFunction);
                    break;
                case 'album':
                    $rootScope.song.sort($scope.sortAlbumFunction);
                    break;
                case 'track':
                    $rootScope.song.sort($scope.sortTrackFunction);
                    break;
            }
        }
    };

    /* Launch on Startup */
    $scope.getArtists();
    if ($routeParams.artistId && $routeParams.albumId) {
        $scope.getAlbumByTag($routeParams.albumId);
    } else if ($routeParams.artistId) {
        $scope.getAlbums($routeParams.artistId);
    }
    /* End Startup */
});
