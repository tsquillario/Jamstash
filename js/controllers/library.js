JamStash.controller('SubsonicCtrl',
function SubsonicCtrl($scope, $rootScope, $location, $window, $routeParams, utils, globals, model, notifications, player) {
    $("#SubsonicAlbums").layout($scope.layoutThreeCol);

    $rootScope.song = [];
    $scope.settings = globals.settings;
    $scope.index = [];
    $scope.shortcut = [];
    $scope.album = [];
    $scope.Server = globals.settings.Server;
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
    $scope.selectedMusicFolder;
    $scope.$watch("selectedMusicFolder", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            if (utils.getValue('MusicFolders') != newValue) {
                if (typeof newValue != 'undefined') {
                    utils.setValue('MusicFolders', newValue, true);
                } else {
                    utils.setValue('MusicFolders', null, true);
                }
                //alert(newValue);
                $scope.getArtists(newValue);
            }
        }
    });
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
    $scope.getArtists = function (id) {
        var url, id;
        if (utils.getValue('MusicFolders')) {
            id = utils.getValue('MusicFolders');
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
                // TODO: AZContainer, build letters here. Make it a click button somewhere then a larger popup with letters finger friendly size
                var shortcuts = [];
                if (typeof data["subsonic-response"].indexes.shortcut != 'undefined') {
                    if (data["subsonic-response"].indexes.shortcut.length > 0) {
                        shortcuts = data["subsonic-response"].indexes.shortcut;
                    } else {
                        shortcuts[0] = data["subsonic-response"].indexes.shortcut;
                    }
                }
                $scope.shortcut = shortcuts;
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
        var coverart, starred;
        if (typeof album.coverArt != 'undefined') {
            coverart = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=50&id=' + album.coverArt;
        }
        if (typeof album.starred !== 'undefined') { starred = true; } else { starred = false; }
        return new model.Album(album.id, album.parent, album.album, album.artist, coverart, $.format.date(new Date(album.created), "yyyy-MM-dd h:mm a"), starred, '', '');
    }
    $scope.getAlbums = function (id) {
        $scope.selectedAutoAlbum = null;
        $scope.selectedArtist = id;
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
                            $rootScope.song.push($scope.mapAlbum(item));
                        }
                    });
                    if ($scope.selectedSubsonicAlbumSort != "default") {
                        $scope.sortSubsonicAlbums($scope.selectedSubsonicAlbumSort);
                    }
                    $scope.$apply();
                } else {
                    notifications.updateMessage('No Albums Returned :(', true);
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
                        angular.forEach(items, function (item, key) {
                            $rootScope.song.push($scope.mapSong(item));
                        });
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
            $('#Search').val("");
        }
    }
    $scope.toggleAZ = function (event) {
        var submenu = $('div#submenu_AZIndex');
        if (submenu.css('display') !== 'none') {
            submenu.fadeOut();
        } else {
            //submenu.fadeIn();
            var el = $('#AZContainer');
            pos = el.offset();
            width = el.width();
            height = el.height();
            //show the menu directly over the placeholder
            submenu.css({ "left": (pos.left + 44) + "px", "top": (pos.top) + "px" }).fadeIn(400);
        }
    }
    $scope.addSongsToQueue = function () {
        angular.forEach($scope.selectedSongs, function (item, key) {
            $scope.queue.push(item);
            item.selected = false;
        });
        $('body').layout().open('south');
        notifications.updateMessage($scope.selectedSongs.length + ' Song(s) Added to Queue', true);
    }
    $scope.scrollToTop = function () {
        $('#Artists').stop().scrollTo('#auto', 400);
    }
    $scope.selectAll = function () {
        angular.forEach($rootScope.song, function (item, key) {
            $scope.selectedSongs.push(item);
            item.selected = true;
        });
    }
    $scope.selectNone = function () {
        angular.forEach($rootScope.song, function (item, key) {
            $scope.selectedSongs = [];
            item.selected = false;
        });
    }
    $scope.updateFavorite = function (item) {
        var id = item.id;
        var starred = item.starred;
        var url;
        if (typeof starred !== 'undefined') {
            url = globals.BaseURL() + '/unstar.view?' + globals.BaseParams() + '&id=' + id;
            item.starred = undefined;
        } else {
            url = globals.BaseURL() + '/star.view?' + globals.BaseParams() + '&id=' + id;
            item.starred = true;
        }
        $.ajax({
            url: url,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function () {
                notifications.updateMessage('Favorite Updated!', true);
            }
        });
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
    $scope.selectedSubsonicAlbumSort = 'default';
    $scope.SubsonicAlbumSort = [
        "default",
        "artist",
        "album",
        "createdate desc"
    ];
    $scope.$watch("selectedSubsonicAlbumSort", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.sortSubsonicAlbums(newValue);
        }
    });
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
    $scope.getMusicFolders();
    if ($routeParams.albumId) {
        $scope.getSongs($routeParams.albumId, '');
    }
    /* End Startup */
});
