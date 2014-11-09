JamStash.controller('SubsonicCtrl',
function SubsonicCtrl($scope, $rootScope, $location, $window, $routeParams, $http, utils, globals, model, map, subsonic, notifications) {
    'use strict';

    $scope.settings = globals.settings;
    $scope.itemType = 'ss';
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
    $scope.SelectedAlbumSort = globals.settings.DefaultAlbumSort;
    $scope.AlbumSort = globals.AlbumSorts;
    $scope.showIndex = subsonic.showIndex;
    $scope.$watch("showIndex", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            subsonic.showIndex = $scope.showIndex;
        }
    });
    $scope.toggleIndex = function () {
        if ($scope.showIndex) {
            $scope.showIndex = false;
        } else {
            $scope.showIndex = true;
            $scope.showPlaylist = false;
            $scope.showPodcast = false;
        }
        $scope.saveDefaultSection('index');
    };
    $scope.showPlaylist = subsonic.showPlaylist;
    $scope.$watch("showPlaylist", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            subsonic.showPlaylist = $scope.showPlaylist;
        }
    });
    $scope.togglePlaylist = function () {
        if ($scope.showPlaylist) {
            $scope.showPlaylist = false;
        } else {
            $scope.showPlaylist = true;
            $scope.showIndex = false;
            $scope.showPodcast = false;
        }
        $scope.saveDefaultSection('playlist');
    };
    $scope.showPodcast = subsonic.showPodcast;
    $scope.$watch("showPodcast", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            subsonic.showPodcast = $scope.showPodcast;
        }
    });
    $scope.togglePodcast = function () {
        if ($scope.showPodcast) {
            $scope.showPodcast = false;
        } else {
            $scope.showPodcast = true;
            $scope.showPlaylist = false;
            $scope.showIndex = false;
        }
        $scope.saveDefaultSection('podcast');
    };
    $scope.saveDefaultSection = function (val) {
        utils.setValue('DefaultSection', val, false);
    };
    $scope.openDefaultSection = function () {
        var section = utils.getValue('DefaultSection');
        switch (section) {
            case 'index':
                $scope.showIndex = true;
                break;
            case 'playlist':
                $scope.showPlaylist = true;
                break;
            case 'podcast':
                $scope.showPodcast = true;
                break;
            default:
                break;
        }
    };
    $scope.$watch("SelectedAlbumSort.id", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            if (subsonic.song.length > 0) {
                subsonic.sortSubsonicSongs(newValue);
            } else if (subsonic.content.album.length > 0) {
                subsonic.sortSubsonicAlbums(newValue);
                var indexes = $.map(globals.AlbumSorts, function (obj, index) {
                    if (obj.id === newValue) {
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
            $scope.getArtists(newValue.id, true);
        }
    });
    $scope.SearchType = globals.settings.DefaultSearchType;
    $scope.SearchTypes = globals.SearchTypes;
    $scope.playlistsGenre = globals.SavedGenres;
    $scope.$watch("selectedGenre", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            globals.SavedGenres.push(newValue);
            utils.setValue('SavedGenres', globals.SavedGenres.join(), false);
        }
    });
    $scope.rescanLibrary = function (data, event) {
        $.ajax({
            url: globals.BaseURL() + '/getUser.view?' + globals.BaseParams() + '&username=' + globals.settings.Username,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (data["subsonic-response"].user.adminRole === true) {
                    $.post(globals.settings.Server + '/musicFolderSettings.view?scanNow');
                } else {
                    alert('You are not logged in as an admin user!');
                }
            }
        });
    };
    $scope.selectAll = function () {
        $rootScope.selectAll($scope.song);
    };
    $scope.selectNone = function () {
        $rootScope.selectNone($scope.song);
    };
    $scope.playAll = function () {
        $rootScope.playAll($scope.song);
    };
    $scope.playFrom = function (index) {
        $rootScope.playFrom(index, $scope.song);
    };
    $scope.removeSong = function (item) {
        $rootScope.removeSong(item, $scope.song);
    };
    $scope.songsRemoveSelected = function () {
        subsonic.songsRemoveSelected($scope.selectedSongs).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
        });
    };
    $scope.getArtists = function (id, refresh) {
        subsonic.getArtists(id, refresh).then(function (data) {
            $scope.index = data.artists;
            $scope.shortcut = data.shortcuts;
        });
    };
    $scope.refreshArtists = function () {
        utils.setValue('MusicFolders', null, true);
        $scope.getArtists(0, true);
        $scope.getPlaylists(true);
    };
    $scope.getAlbums = function (id, name) {
        subsonic.getAlbums(id, name).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
            $scope.BreadCrumbs = data.breadcrumb;
            $scope.selectedAutoAlbum = data.selectedAutoAlbum;
            $scope.selectedArtist = data.selectedArtist;
            $scope.selectedAlbum = data.selectedAlbum;
            $scope.selectedPlaylist = data.selectedPlaylist;
        });
    };
    $scope.getAlbumListBy = function (id, off) {
        subsonic.getAlbumListBy(id, off).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
            $scope.BreadCrumbs = data.breadcrumb;
            $scope.selectedAutoAlbum = data.selectedAutoAlbum;
            $scope.selectedArtist = data.selectedArtist;
            $scope.selectedPlaylist = data.selectedPlaylist;
        });
    };
    $scope.getSongs = function (id, action) {
        subsonic.getSongs(id, action).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
        });
    };
    $scope.getArtistByTag = function (id) { // Gets Artist by ID3 tag
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
                if (typeof data["subsonic-response"].artist !== 'undefined') {
                    if (data["subsonic-response"].artist.album.length > 0) {
                        items = data["subsonic-response"].artist.album;
                    } else {
                        items[0] = data["subsonic-response"].artist.album;
                    }
                    subsonic.content.album = [];
                    subsonic.song = [];

                    angular.forEach(items, function (item) {
                        subsonic.content.album.push(map.mapAlbum(item));
                    });
                    $scope.$apply();
                } else {
                    notifications.updateMessage('No Albums Returned :(', true);
                }
            }
        });
    };
    $scope.getAlbumByTag = function (id) { // Gets Album by ID3 tag
        subsonic.getAlbumByTag(id).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
            $scope.BreadCrumbs = data.breadcrumb;
            $scope.selectedAutoAlbum = data.selectedAutoAlbum;
            $scope.selectedArtist = data.selectedArtist;
            $scope.selectedPlaylist = data.selectedPlaylist;
        });
    };
    $scope.search = function () {
        var query = $('#Search').val();
        var type = $('#SearchType').val();
        subsonic.search(query, type).then(function (data) {
            //$scope.shortcut = data.shortcuts;
            $scope.album = data.album;
            $scope.song = data.song;
        });
    };
    $scope.toggleAZ = function () {
        $scope.toggleSubmenu('#submenu_AZIndex', '#AZIndex', 'right', 44);
    };
    $scope.getPlaylists = function (refresh) {
        subsonic.getPlaylists(refresh).then(function (data) {
            $scope.playlists = data.playlists;
            $scope.playlistsPublic = data.playlistsPublic;
            $scope.selectedAutoPlaylist = data.selectedAutoPlaylist;
            $scope.selectedPlaylist = data.selectedPlaylist;
        });
    };
    $scope.getPlaylist = function (id, action) {
        subsonic.getPlaylist(id, action).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
            $scope.selectedAutoPlaylist = data.selectedAutoPlaylist;
            $scope.selectedPlaylist = data.selectedPlaylist;
        });
    };
    $scope.getStarred = function (action, type) {
        subsonic.getStarred(action, type).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
            $scope.selectedAutoPlaylist = data.selectedAutoPlaylist;
            $scope.selectedPlaylist = data.selectedPlaylist;
        });
    };
    $scope.getRandomSongs = function (action, genre, folder) {
        subsonic.getRandomSongs(action, genre, folder).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
            $scope.selectedAutoPlaylist = data.selectedAutoPlaylist;
            $scope.selectedPlaylist = data.selectedPlaylist;
        });
    };
    $scope.newPlaylist = function (data, event) {
        subsonic.newPlaylist(data, event).then(function (data) {
            $scope.getPlaylists(true);
        });
    };
    $scope.deletePlaylist = function () {
        subsonic.deletePlaylist().then(function (data) {
            $scope.getPlaylists(true);
        });
    };
    $scope.savePlaylist = function () {
        var id = $scope.selectedPlaylist;
        subsonic.savePlaylist().then(function (data) {
            $scope.getPlaylist(id, '');
            notifications.updateMessage('Playlist Updated!', true);
        });
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
                            $scope.playlistMenu.push(map.mapPlaylist(item));
                        }
                    });
                    if ($scope.playlistMenu.length > 0) {
                        $scope.$apply();
                        $scope.toggleSubmenu('#submenu_AddToPlaylist', '#action_AddToPlaylist', 'left', 124);
                    } else {
                        notifications.updateMessage('No Playlists :(', true);
                    }
                }
            }
        });
    };
    $scope.addToPlaylist = function (id) {
        var songs = [];
        if ($scope.selectedSongs.length !== 0) {
            angular.forEach($scope.selectedSongs, function (item) {
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
    $scope.getGenres = function () {
        subsonic.getGenres().then(function (data) {
            $scope.Genres = data;
        });
    };
    $scope.getPodcasts = function (refresh) {
        subsonic.getPodcasts(refresh).then(function (data) {
            $scope.podcasts = data;
        });
    };
    $scope.getPodcast = function (id, action) {
        subsonic.getPodcast(id, action).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
            $scope.selectedPodcast = data.selectedPodcast;
        });
    };

    /* Launch on Startup */
    $scope.getArtists();
    $scope.getAlbums();
    $scope.getPlaylists();
    $scope.getGenres();
    $scope.getPodcasts();
    $scope.openDefaultSection();
    $scope.getMusicFolders();
    if ($routeParams.artistId && $routeParams.albumId) {
        $scope.getAlbumByTag($routeParams.albumId);
    } else if ($routeParams.artistId) {
        $scope.getAlbums($routeParams.artistId);
    }
    /* End Startup */
});
