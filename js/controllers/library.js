JamStash.controller('SubsonicCtrl',
function SubsonicCtrl($scope, $rootScope, $location, $window, $routeParams, utils, globals, model, notifications, player) {
    $("#SubsonicAlbums").layout($scope.layoutThreeCol);

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
    $scope.selectedAutoAlbum;
    $scope.selectedArtist;
    $scope.selectedAlbum;
    $scope.selectedSubsonicAlbumSort = 'default';
    $scope.SubsonicAlbumSort = [
        { id: "default", name: "Default Sort" },
        { id: "artist", name: "Artist" },
        { id: "album", name: "Album" },
        { id: "createdate desc", name: "Created Date - Desc" },
    ];
    $scope.$watch("selectedSubsonicAlbumSort", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.sortSubsonicAlbums(newValue);
        }
    });
    $scope.selectedLayout = globals.settings.DefaultLibraryLayout;
    //not sure how to just grab the layouts hash from the settings controller
    $scope.Layouts = [
        { id: "list", name: "List" },
        { id: "grid", name: "Grid" },
    ];

    $scope.rescanLibrary = function (data, event) {
        $.ajax({
            url: globals.BaseURL() + '/getUser.view?' + globals.BaseParams() + '&username=' + globals.settings.Username,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (data["subsonic-response"].user.adminRole == true) {
                    $.get(globals.settings.Server + '/musicFolderSettings.view?scanNow');
                } else {
                    alert('You are not logged in as an admin user!');
                }
            }
        });
    }
    $scope.mapArtist = function (data) {
        var artist = data.artist;
        var artists = [];
        if (artist.length > 0) {
            artists = artist;
        } else {
            artists[0] = artist;
        }
        return new model.Index(data.name, artists);
    }
    $scope.mapPlaylist = function (data) {
        return new model.Artist(data.id, data.name);
    }
    $scope.getArtists = function (id) {
        var url, id;
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
                if (typeof data["subsonic-response"].indexes.shortcut != 'undefined') {
                    if (data["subsonic-response"].indexes.shortcut.length > 0) {
                        $scope.shortcut = data["subsonic-response"].indexes.shortcut;
                    } else {
                        $scope.shortcut[0] = data["subsonic-response"].indexes.shortcut;
                    }
                }
                $scope.index = [];
                angular.forEach(indexes, function (item, key) {
                    $scope.index.push($scope.mapArtist(item));
                });
                $scope.$apply();
            }
        });
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
        return new model.Album(album.id, album.parent, title, album.artist, album.artistId, coverartthumb, coverartfull, $.format.date(new Date(album.created), "yyyy-MM-dd h:mm a"), starred, '', '', type);
    }
    $scope.getAlbums = function (id) {
        $scope.selectedAutoAlbum = null;
        $scope.selectedArtist = id;
        $scope.artistId = id;
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
                            $rootScope.song.push($scope.mapSong(item));
                        }
                    });
                    if ($scope.selectedSubsonicAlbumSort != "default") {
                        $scope.sortSubsonicAlbums($scope.selectedSubsonicAlbumSort);
                    }
                    //$location.path('/library/' + id);
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

                    $scope.album.push($scope.mapAlbum(data["subsonic-response"].album));

                    var items = [];
                    if (data["subsonic-response"].album.song.length > 0) {
                        items = data["subsonic-response"].album.song;
                    } else {
                        items[0] = data["subsonic-response"].album.song;
                    }
                    angular.forEach(items, function (item, key) {
                        $rootScope.song.push($scope.mapSong(item));
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
                    angular.forEach(items, function (item, key) {
                        if (item.isDir) {
                            $scope.album.push($scope.mapAlbum(item));
                        } else {
                            $rootScope.song.push($scope.mapAlbum(item));
                        }
                    });
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
                    if (typeof data["subsonic-response"].directory.id != 'undefined') {
                        //alert(data["subsonic-response"].directory.id);
                        // Look at bringing back the breadcrumb
                    }
                    //alert(JSON.stringify(getMusicDirectory["subsonic-response"].directory.child));
                    if (action == 'add') {
                        angular.forEach(items, function (item, key) {
                            $rootScope.queue.push($scope.mapSong(item));
                        });
                        $scope.$apply();
                        $('body').layout().open('south');
                        notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                    } else if (action == 'play') {
                        $rootScope.queue = [];
                        angular.forEach(items, function (item, key) {
                            $rootScope.queue.push($scope.mapSong(item));
                        });
                        var next = $rootScope.queue[0];
                        $scope.$apply(function () {
                            $rootScope.playSong(false, next);
                        });
                        $('body').layout().open('south');
                        notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                    } else {
                        $rootScope.song = [];
                        var albums = [];
                        angular.forEach(items, function (item, key) {
                            if (item.isDir) {
                                albums.push($scope.mapAlbum(item));
                            } else {
                                $rootScope.song.push($scope.mapSong(item));
                            }
                        });
                        if (albums.length > 0) {
                            $scope.album = albums;
                        }
                        //$location.path('/library/0/' + id);
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
        if (query != '') {
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
                        if (type === 'song') {
                            if (data["subsonic-response"].searchResult2.song !== undefined) {
                                if (data["subsonic-response"].searchResult2.song.length > 0) {
                                    items = data["subsonic-response"].searchResult2.song;
                                } else {
                                    items[0] = data["subsonic-response"].searchResult2.song;
                                }
                                $rootScope.song = [];
                                angular.forEach(items, function (item, key) {
                                    $rootScope.song.push($scope.mapSong(item));
                                });
                                $scope.$apply();
                            }
                        }
                        if (type === 'album') {
                            if (data["subsonic-response"].searchResult2.album !== undefined) {
                                if (data["subsonic-response"].searchResult2.album.length > 0) {
                                    items = data["subsonic-response"].searchResult2.album;
                                } else {
                                    items[0] = data["subsonic-response"].searchResult2.album;
                                }
                                $scope.album = [];
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
                    }
                }
            });
            //$('#Search').val("");
        }
    }
    $scope.toggleAZ = function (event) {
        $scope.toggleSubmenu('#submenu_AZIndex', '#AZIndex', 'right', 44);
    }
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
    }
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
    }
    $scope.sortDateFunction = function (a, b) {
        return a.date < b.date ? 1 : -1;
    };
    $scope.sortArtistFunction = function (a, b) {
        return a.artist.toLowerCase() > b.artist.toLowerCase() ? -1 : 1;
    };
    $scope.sortAlbumFunction = function (a, b) {
        /*
        if (a.name < b.name) //sort string ascending
        return -1
        if (a.name > b.name)
        return 1
        return 0
        */
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
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

    /* Launch on Startup */
    $scope.getArtists();
    if ($routeParams.artistId && $routeParams.albumId) {
        $scope.getAlbumByTag($routeParams.albumId);
    } else if ($routeParams.artistId) {
        $scope.getAlbums($routeParams.artistId);
    }
    /* End Startup */
});
