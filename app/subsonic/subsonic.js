/**
* jamstash.subsonic.controller Module
*
* Access and use the Subsonic Server. The Controller is in charge of relaying the Service's messages to the user through the
* notifications.
*/
angular.module('jamstash.subsonic.controller', ['jamstash.subsonic.service', 'jamstash.player.service'])

.controller('SubsonicController', ['$scope', '$rootScope', '$routeParams', 'utils', 'globals', 'map', 'subsonic', 'notifications', 'player',
    function ($scope, $rootScope, $routeParams, utils, globals, map, subsonic, notifications, player) {
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
    $rootScope.showIndex = subsonic.showIndex;
    $scope.$watch("showIndex", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            subsonic.showIndex = $rootScope.showIndex;
        }
    });
    $scope.toggleIndex = function () {
        if ($rootScope.showIndex) {
            $rootScope.showIndex = false;
        } else {
            $rootScope.showIndex = true;
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
            $rootScope.showIndex = false;
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
            $rootScope.showIndex = false;
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
                $rootScope.showIndex = true;
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
    var sortSubsonicAlbums = function (newValue) {
        if (typeof newValue != 'undefined') {
            //alert(newValue);
            switch (newValue) {
                case 'createdate desc':
                    $scope.album.sort(utils.sortDateFunction);
                    break;
                case 'artist':
                    $scope.album.sort(utils.sortArtistFunction);
                    break;
                case 'album':
                    $scope.album.sort(utils.sortAlbumFunction);
                    break;
            }
        }
    };
    var sortSubsonicSongs = function (newValue) {
        if (typeof newValue != 'undefined') {
            //alert(content.song.length);
            switch (newValue) {
                case 'createdate desc':
                    $scope.song.sort(utils.sortDateFunction);
                    break;
                case 'artist':
                    $scope.song.sort(utils.sortArtistFunction);
                    break;
                case 'album':
                    $scope.song.sort(utils.sortAlbumFunction);
                    break;
                case 'track':
                    $scope.song.sort(utils.sortTrackFunction);
                    break;
            }
        }
    };
    $scope.$watch("SelectedAlbumSort.id", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            if ($scope.song.length > 0) {
                sortSubsonicSongs(newValue);
            } else if ($scope.album.length > 0) {
                sortSubsonicAlbums(newValue);
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
            // TODO: Hyz: Move loading / saving the music folder to persistence-service
            utils.setValue('MusicFolders', angular.toJson(newValue), true);
            $scope.getArtists(newValue.id);
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
                    //$.get(globals.settings.Server + '/musicFolderSettings.view?scanNow');
                    $.get(globals.settings.Server + '/musicFolderSettings.view?scanNow&' + globals.BaseParams());
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
    // TODO: Hyz: Replace
    $scope.playAll = function () {
        $rootScope.playAll($scope.song);
    };
    // TODO: Hyz: Replace
    $scope.playFrom = function (index) {
        $rootScope.playFrom(index, $scope.song);
    };
    // TODO: Hyz: Replace
    $scope.removeSong = function (item) {
        $rootScope.removeSong(item, $scope.song);
    };
    // TODO: Hyz: Replace
    $scope.songsRemoveSelected = function () {
        subsonic.songsRemoveSelected($scope.selectedSongs).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
        });
    };
    $scope.getArtists = function (folder) {
        subsonic.getArtists(folder).then(function (data) {
            $scope.index = data.index;
            $scope.shortcut = data.shortcut;
        });
    };
    $scope.refreshArtists = function () {
        utils.setValue('MusicFolders', null, true);
        $scope.getArtists();
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
            if ($scope.SelectedAlbumSort.id != "default") {
                sortSubsonicAlbums($scope.SelectedAlbumSort.id);
            }
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
            if ($scope.SelectedAlbumSort.id != "default") {
                sortSubsonicAlbums($scope.SelectedAlbumSort.id);
            }
        });
    };

    /**
     * Handles common actions with songs such as displaying them on the scope, adding them to the playing queue
     * and playing the first song after adding them to the queue. Displays notifications for songs added to the playing queue
     * Also handles error notifications in case of: a service error, a subsonic error or an HTTP error
     * @param  {Promise} promise a Promise that must be resolved with an array of songs or must be rejected with an object : {'reason': a message that can be displayed to a user, 'httpError': the HTTP error code, 'subsonicError': the error Object sent by Subsonic}
     * @param  {String} action  the action to be taken with the songs. Must be 'add', 'play' or 'display'
     * @return {Promise}         the original promise passed in first param. That way we can chain it further !
     */
    $scope.requestSongs = function (promise, action) {
        promise.then(function (songs) {
            if(action === 'play') {
                player.emptyQueue().addSongs(songs).playFirstSong();
                notifications.updateMessage(songs.length + ' Song(s) Added to Queue', true);
            } else if (action === 'add') {
                player.addSongs(songs);
                notifications.updateMessage(songs.length + ' Song(s) Added to Queue', true);
            } else if (action === 'display') {
                $scope.album = [];
                $scope.song = songs;
            }
        }, function (error) {
            var errorNotif;
            if (error.subsonicError !== undefined) {
                errorNotif = error.reason + ' ' + error.subsonicError.message;
            } else if (error.httpError !== undefined) {
                errorNotif = error.reason + ' HTTP error ' + error.httpError;
            } else {
                errorNotif = error.reason;
            }
            notifications.updateMessage(errorNotif, true);
        });
        return promise;
    };

    $scope.getSongs = function (id, action) {
        subsonic.getSongs(id, action).then(function (data) {
            $scope.album = data.album;
            $scope.song = data.song;
            $scope.BreadCrumbs = data.breadcrumb;
            $scope.selectedAutoAlbum = data.selectedAutoAlbum;
            $scope.selectedArtist = data.selectedArtist;
            $scope.selectedPlaylist = data.selectedPlaylist;
            if ($scope.SelectedAlbumSort.id != "default") {
                sortSubsonicAlbums($scope.SelectedAlbumSort.id);
            }
        });
    };

    $scope.getRandomStarredSongs = function (action) {
        var promise = subsonic.getRandomStarredSongs();
        $scope.requestSongs(promise, action);

        $scope.selectedPlaylist = null;
        $scope.selectedAutoPlaylist = 'starred';
    };

    $scope.getRandomSongs = function (action, genre, folder) {
        var promise = subsonic.getRandomSongs(genre, folder);
        $scope.requestSongs(promise, action);

        $scope.selectedPlaylist = null;
        if (!isNaN(folder)) {
            $scope.selectedAutoPlaylist = folder;
        } else if (genre !== undefined && genre !== '' && genre !== 'Random') {
            $scope.selectedAutoPlaylist = genre;
        } else {
            $scope.selectedAutoPlaylist = 'random';
        }
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
    $scope.getMusicFolders = function () {
        $.ajax({
            url: globals.BaseURL() + '/getMusicFolders.view?' + globals.BaseParams(),
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (data["subsonic-response"].musicFolders.musicFolder !== undefined) {
                    var folders = [];
                    if (data["subsonic-response"].musicFolders.musicFolder.length > 0) {
                        folders = data["subsonic-response"].musicFolders.musicFolder;
                    } else {
                        folders[0] = data["subsonic-response"].musicFolders.musicFolder;
                    }

                    folders.unshift({
                        "id": -1,
                        "name": "All Folders"
                    });
                    $rootScope.MusicFolders = folders;
                    if (utils.getValue('MusicFolders')) {
                        var folder = angular.fromJson(utils.getValue('MusicFolders'));
                        var i = 0, index = "";
                        angular.forEach($rootScope.MusicFolders, function (item, key) {
                            if (item.id == folder.id) {
                                index = i;
                            }
                            i++;
                        });
                        $rootScope.SelectedMusicFolder = $rootScope.MusicFolders[index];
                    } else {
                        $rootScope.SelectedMusicFolder = $rootScope.MusicFolders[0];
                    }
                    $scope.$apply();
                }
            }
        });
    };
    /**
     * Change the order of playlists through jQuery UI's sortable
     */
    $scope.dragStart = function (event, ui) {
        ui.item.data('start', ui.item.index());
    };
    $scope.dragEnd = function (event, ui) {
        var start = ui.item.data('start'),
            end = ui.item.index();
        $scope.song.splice(end, 0, $scope.song.splice(start, 1)[0]);
    };
    $scope.playSong = function (song) {
        player.play(song);
    };
    $scope.addSongToQueue = function(song) {
        player.addSong(song);
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
}]);
