/**
* jamstash.subsonic.controller Module
*
* Access and use the Subsonic Server. The Controller is in charge of relaying the Service's messages to the user through the
* notifications.
*/
angular.module('jamstash.subsonic.controller', [
    'ngLodash',
    'jamstash.subsonic.service',
    'jamstash.player.service',
    'jamstash.persistence',
    'jamstash.breadcrumbs.directive',
    'jamstash.breadcrumbs.service',
    'jamstash.selectedsongs'
])

.controller('SubsonicController', [
    '$scope',
    '$rootScope',
    '$routeParams',
    '$window',
    'lodash',
    'utils',
    'globals',
    'map',
    'subsonic',
    'notifications',
    'player',
    'persistence',
    'breadcrumbs',
    'SelectedSongs',
    function (
        $scope,
        $rootScope,
        $routeParams,
        $window,
        _,
        utils,
        globals,
        map,
        subsonic,
        notifications,
        player,
        persistence,
        breadcrumbs,
        SelectedSongs
    ) {
    'use strict';

    _.extend($scope, {
        AlbumSort: globals.AlbumSorts,
        autoAlbums: {
            random: {
                name: 'Random',
                offset: 0
            },
            newest: {
                name: 'Recently Added',
                offset: 0
            },
            starred: {
                name: 'Starred',
                offset: 0
            },
            highest: {
                name: 'Top Rated',
                offset: 0
            },
            frequent: {
                name: 'Most Played',
                offset: 0
            },
            recent: {
                name: 'Recently Played',
                offset: 0
            }
        },
        itemType         : 'ss',
        playlistMenu     : [],
        selectedSongs    : SelectedSongs.get(),
        SelectedAlbumSort: globals.settings.DefaultAlbumSort,
        Server           : globals.settings.Server,
        settings         : globals.settings,
        addSelectedSongsToQueue: addSelectedSongsToQueue,
        addSongToQueue         : addSongToQueue,
        playAll                : playAll,
        playFrom               : playFrom,
        playSong               : playSong,
        selectAll              : selectAll,
        selectNone             : SelectedSongs.reset,
        toggleSelection        : SelectedSongs.toggle
    });

    function selectAll() {
        SelectedSongs.addSongs($scope.song);
    }

    function addSelectedSongsToQueue() {
        if (SelectedSongs.get().length === 0) {
            return;
        }
        player.addSongs(SelectedSongs.get());
        notifications.updateMessage(SelectedSongs.get().length + ' Song(s) Added to Queue', true);
        SelectedSongs.reset();
    }

    function playAll() {
        player.emptyQueue()
            .addSongs($scope.song)
            .playFirstSong();
    }

    function playFrom(index) {
        var songsToPlay = $scope.song.slice(index, $scope.song.length);
        player.emptyQueue()
            .addSongs(songsToPlay)
            .playFirstSong();
    }

    function addSongToQueue(song) {
        player.addSong(song);
    }

    function playSong(song) {
        player.emptyQueue()
            .addSong(song)
            .playFirstSong();
    }

    $rootScope.showIndex = false;
    $scope.toggleIndex = function () {
        $rootScope.showIndex = true;
        $scope.showPlaylist = false;
        $scope.showPodcast = false;
        $scope.saveDefaultSection('index');
    };
    $scope.showPlaylist = false;
    $scope.togglePlaylist = function () {
        $rootScope.showIndex = false;
        $scope.showPlaylist = true;
        $scope.showPodcast = false;
        $scope.saveDefaultSection('playlist');
    };
    $scope.showPodcast = false;
    $scope.togglePodcast = function () {
        $rootScope.showIndex = false;
        $scope.showPlaylist = false;
        $scope.showPodcast = true;
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
    $scope.$watch('SelectedAlbumSort.id', function (newValue, oldValue) {
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

    $scope.$watch('SelectedMusicFolder', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            var folderId;
            if (newValue) {
                folderId = newValue.id;
                persistence.saveSelectedMusicFolder(newValue);
            } else {
                persistence.deleteSelectedMusicFolder();
            }
            $scope.getArtists(folderId);
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

    // TODO: Hyz: Replace
    $scope.removeSong = function (item) {
        $rootScope.removeSong(item, $scope.song);
    };

    $scope.songsRemoveSelected = function () {
        $scope.song = _.difference($scope.song, SelectedSongs.get());
    };

    $scope.getArtists = function (folder) {
        var savedFolder = $scope.SelectedMusicFolder;
        if (isNaN(folder) && savedFolder) {
            folder = savedFolder.id;
        }
        var promise = subsonic.getArtists(folder);
        $scope.handleErrors(promise).then(function (data) {
            $scope.index = data.index;
            $scope.shortcut = data.shortcut;
        }, function (error) {
            $scope.index = [];
            $scope.shortcut = [];
            if (error.serviceError === true) {
                notifications.updateMessage(error.reason, true);
            }
        });
    };

    $scope.refreshArtists = function () {
        $scope.SelectedMusicFolder = undefined;
        $scope.getArtists();
        $scope.getPlaylists();
    };

    /**
     * Handles error notifications in case of a subsonic error or an HTTP error. Sets a 'serviceError' flag when
     * it is neither.
     * @param  {Promise} promise a Promise that must be resolved or rejected with an object : {'reason': a message that can be displayed to a user, 'httpError': the HTTP error code, 'subsonicError': the error Object sent by Subsonic}
     * @return {Promise}         the original promise passed as argument. That way we can chain it further !
     */
    // TODO: Hyz: Move this to a response interceptor ?
    $scope.handleErrors = function (promise) {
        promise.then(null, function (error) {
            var errorNotif;
            if (error.subsonicError !== undefined) {
                errorNotif = error.reason + ' ' + error.subsonicError.message;
            } else if (error.httpError !== undefined) {
                errorNotif = error.reason + ' HTTP error ' + error.httpError;
            } else {
                error.serviceError = true;
            }
            if (error.subsonicError !== undefined || error.httpError !== undefined) {
                notifications.updateMessage(errorNotif, true);
            }
        });
       return promise;
    };

    /**
     * Handles common actions with songs such as displaying them on the scope, adding them to the playing queue
     * and playing the first song after adding them to the queue. Displays notifications for songs added to the playing queue
     * Handles error notifications in case of service error.
     * @param  {Promise} promise a Promise that must be resolved with an array of songs or must be rejected with an object : {'reason': a message that can be displayed to a user}
     * @param  {String} action  the action to be taken with the songs. Must be 'add', 'play' or 'display'
     * @return {Promise}         the original promise passed in first param. That way we can chain it further !
     */
    // TODO: Hyz: Maybe we should move this to a service
    $scope.requestSongs = function (promise, action) {
        $scope.handleErrors(promise)
        .then(function (songs) {
            if (action === 'play') {
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
            if (error.serviceError === true) {
                notifications.updateMessage(error.reason, true);
            }
        });
        return promise;
    };

    /**
     * Get songs from the subsonic server. Provide with the id of the directory and its name.
     * If action is 'play' or 'add', the songs will be retrieved recursively until all sub-directories
     * of the provided one have been called.
     * level is the level in the breadcrumbs. Can be 'root' which resets the breadcrumbs to one level
     * or can be 'forward' which adds a level to the breadcrumbs.
     * @param  {String} action 'play', 'add' or 'display'
     * @param  {int} id        the id of the directory to get songs from
     * @param  {String} name   the name of the directory to get songs from
     * @param  {String} level  'root' or 'forward'
     */
    $scope.getDirectory = function (action, id, name, level) {
        var promise;
        if (action === 'play' || action === 'add') {
            promise = subsonic.recursiveGetDirectory(id);
            $scope.requestSongs(promise, action);
        } else if (action === 'display') {
            promise = subsonic.getDirectory(id);
            $scope.handleErrors(promise).then(function (data) {
                $scope.album = data.directories;
                $scope.song = data.songs;
                if (level === 'root') {
                    breadcrumbs.reset().push({
                        id: id,
                        name: name
                    });
                } else if (level === 'forward') {
                    breadcrumbs.push({
                        id: id,
                        name: name
                    });
                }
                $scope.selectedAutoAlbum = null;
                $scope.selectedArtist = null;
                $scope.selectedAlbum = id;
                $scope.selectedAutoPlaylist = null;
                $scope.selectedPlaylist = null;
                $scope.selectedPodcast = null;
                if ($scope.SelectedAlbumSort.id !== 'default') {
                    sortSubsonicAlbums($scope.SelectedAlbumSort.id);
                }
            }, function (error) {
                notifications.updateMessage(error.reason, true);
            });
        }
    };

    $scope.getAlbumListBy = function (type, off) {
        var offset = (type) ? $scope.autoAlbums[type].offset : 0;
        if (off === 'next') {
            offset = offset + Number(globals.settings.AutoAlbumSize);
        } else if (off === 'prev') {
            offset = offset - Number(globals.settings.AutoAlbumSize);
            if (offset < 0) { offset = 0; }
        } else {
            offset = 0;
        }
        $scope.autoAlbums[type].offset = offset;
        var promise = subsonic.getAlbumListBy(type, offset);
        $scope.handleErrors(promise).then(function (data) {
            $scope.album = data;
            if ($scope.SelectedAlbumSort.id !== 'default') {
                sortSubsonicAlbums($scope.SelectedAlbumSort.id);
            }
        }, function (error) {
            $scope.album = [];
            notifications.updateMessage(error.reason, true);
        });
        $scope.song = [];
        breadcrumbs.reset();
        $scope.selectedAutoAlbum = type;
        $scope.selectedArtist = null;
        $scope.selectedAlbum = null;
        $scope.selectedAutoPlaylist = null;
        $scope.selectedPlaylist = null;
        $scope.selectedPodcast = null;
    };

    $scope.getRandomStarredSongs = function (action) {
        var promise = subsonic.getRandomStarredSongs();
        $scope.requestSongs(promise, action);

        $scope.album = [];
        breadcrumbs.reset();
        $scope.selectedAutoAlbum = null;
        $scope.selectedArtist = null;
        $scope.selectedAlbum = null;
        $scope.selectedAutoPlaylist = 'starred';
        $scope.selectedPlaylist = null;
        $scope.selectedPodcast = null;
    };

    $scope.getRandomSongs = function (action, genre, folder) {
        var promise = subsonic.getRandomSongs(genre, folder);
        $scope.requestSongs(promise, action);

        if (! isNaN(folder)) {
            $scope.selectedAutoPlaylist = folder;
        } else if (genre !== undefined && genre !== '' && genre !== 'Random') {
            $scope.selectedAutoPlaylist = genre;
        } else {
            $scope.selectedAutoPlaylist = 'random';
        }
        $scope.album = [];
        breadcrumbs.reset();
        $scope.selectedAutoAlbum = null;
        $scope.selectedArtist = null;
        $scope.selectedAlbum = null;
        $scope.selectedPlaylist = null;
        $scope.selectedPodcast = null;
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

    $scope.search = function (query, type) {
        if (query && query.length > 0) {
            var promise = subsonic.search(query, type);
            $scope.handleErrors(promise).then(function (data) {
                if (type === 0) {
                    $scope.song = data;
                    $scope.album = [];
                } else if (type === 1) {
                    $scope.song = [];
                    $scope.album = data;
                } else if (type === 2) {
                    $scope.song = [];
                    $scope.album = [];
                    $scope.shortcut = data;
                }
                breadcrumbs.reset();
            }, function (error) {
                if (error.serviceError === true) {
                    notifications.updateMessage(error.reason, true);
                }
            });
        }
    };

    $scope.toggleAZ = function () {
        $scope.toggleSubmenu('#submenu_AZIndex', '#AZIndex', 'right', 44);
    };

    $scope.getPlaylists = function () {
        var promise = subsonic.getPlaylists();
        $scope.handleErrors(promise).then(function (data) {
            $scope.playlists = data.playlists;
            $scope.playlistsPublic = data.playlistsPublic;
        }, function () {
            // Do not display a notification, there simply are no playlists.
            // Otherwise, a notification will be displayed at every page reload.
            $scope.playlists = [];
            $scope.playlistsPublic = [];
        });
    };

    $scope.getPlaylist = function (action, id) {
        var promise = subsonic.getPlaylist(id);
        $scope.requestSongs(promise, action).then(function (songs) {
            if (action === 'display') {
                notifications.updateMessage(songs.length + ' Song(s) in Playlist', true);
            }
        });
        $scope.song = [];
        $scope.album = [];
        breadcrumbs.reset();
        $scope.selectedAutoAlbum = null;
        $scope.selectedArtist = null;
        $scope.selectedAlbum = null;
        $scope.selectedAutoPlaylist = null;
        $scope.selectedPlaylist = id;
        $scope.selectedPodcast = null;
    };

    $scope.newPlaylist = function () {
        var name = $window.prompt('Choose a name for your new playlist.', '');
        if (name !== null && name !== '' && name !== 'null') {
            var promise = subsonic.newPlaylist(name);
            $scope.handleErrors(promise).then(function () {
                $scope.getPlaylists();
            });
        }
    };

    $scope.deletePlaylist = function () {
        if (! $scope.selectedPlaylist) {
            notifications.updateMessage('Please select a playlist to delete.');
            return;
        }
        var ok = $window.confirm('Are you sure you want to delete the selected playlist?');
        if (ok) {
            var promise = subsonic.deletePlaylist($scope.selectedPlaylist);
            $scope.handleErrors(promise).then(function () {
                $scope.getPlaylists();
            });
        }
    };

    $scope.addToPlaylist = function (playlistId) {
        if (SelectedSongs.get().length === 0) {
            notifications.updateMessage('Please select a song to add to that playlist.');
            return;
        }
        var promise = subsonic.addToPlaylist(playlistId, SelectedSongs.get());
        $scope.handleErrors(promise).then(function () {
            SelectedSongs.reset();
            notifications.updateMessage('Playlist Updated!', true);
        });
    };

    $scope.savePlaylist = function () {
        if (! $scope.selectedPlaylist) {
            notifications.updateMessage('Please select a playlist to save.');
            return;
        }
        var promise = subsonic.savePlaylist($scope.selectedPlaylist, $scope.song);
        $scope.handleErrors(promise).then(function () {
            $scope.getPlaylist('display', $scope.selectedPlaylist);
            notifications.updateMessage('Playlist Updated!', true);
        });
    };

    $scope.loadPlaylistsForMenu = function () {
        var promise = subsonic.getPlaylists();
        $scope.handleErrors(promise).then(function (data) {
            $scope.playlistMenu = data.playlists.concat(data.playlistsPublic);
            // TODO: Hyz: Refactor using some kind of directive ?
            $scope.toggleSubmenu('#submenu_AddToPlaylist', '#action_AddToPlaylist', 'left', 124);
        }, function (error) {
            notifications.updateMessage(error.reason, true);
        });
    };

    $scope.getGenres = function () {
        var promise = subsonic.getGenres();
        $scope.handleErrors(promise).then(function (genres) {
            $scope.Genres = genres;
        }, function () {
            // Do not display a notification, there simply are no genres.
            // Otherwise, a notification will be displayed at every page reload.
            $scope.Genres = [];
        });
    };

    $scope.$watch('selectedGenre', function (newValue, oldValue) {
        if (newValue && newValue !== oldValue) {
            $scope.genrePlaylists = _($scope.genrePlaylists)
                .push(newValue)
                .uniq()
                .value();
            persistence.saveSelectedGenreNames($scope.genrePlaylists);
        }
    });

    $scope.loadGenrePlaylists = function () {
        $scope.genrePlaylists = persistence.loadSelectedGenreNames();
    };

    $scope.deleteGenrePlaylist = function (genrePlaylist) {
        _.remove($scope.genrePlaylists, function (playlist) {
            return playlist === genrePlaylist;
        });
        persistence.deleteSelectedGenreNames();
        persistence.saveSelectedGenreNames($scope.genrePlaylists);
    };

    $scope.getPodcasts = function () {
        var promise = subsonic.getPodcasts();
        $scope.handleErrors(promise).then(function (podcasts) {
            $scope.podcasts = podcasts;
        }, function () {
            // Do not display a notification, there simply are no podcasts.
            // Otherwise, a notification will be displayed at every page reload.
            $scope.podcasts = [];
        });
    };

    $scope.getPodcast = function (action, id) {
        var promise = subsonic.getPodcast(id);
        $scope.requestSongs(promise, action);

        $scope.song = [];
        $scope.album = [];
        breadcrumbs.reset();
        $scope.selectedAutoAlbum = null;
        $scope.selectedArtist = null;
        $scope.selectedAlbum = null;
        $scope.selectedAutoPlaylist = null;
        $scope.selectedPlaylist = null;
        $scope.selectedPodcast = id;
    };

    $scope.getMusicFolders = function () {
        var promise = subsonic.getMusicFolders();
        $scope.handleErrors(promise).then(function (musicFolders) {
            var folders = musicFolders;
            $scope.MusicFolders = folders;
            var savedFolder = persistence.getSelectedMusicFolder();
            if (savedFolder) {
                if (_.findIndex(folders, { id: savedFolder.id }) !== -1) {
                    $scope.SelectedMusicFolder = savedFolder;
                }
            }
        });
    };

    // TODO: Hyz: Replace with ui-sortable
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

    /* Launch on Startup */
    $scope.searching = {
        query: '',
        typeId: globals.settings.DefaultSearchType,
        types: globals.SearchTypes
    };
    $scope.genrePlaylists = [];
    $scope.MusicFolders = [];
    $scope.getMusicFolders();
    $scope.getArtists();
    $scope.getPlaylists();
    $scope.getGenres();
    $scope.loadGenrePlaylists();
    $scope.getPodcasts();
    $scope.openDefaultSection();
    if ($routeParams.artistId && $routeParams.albumId) {
        $scope.getAlbumByTag($routeParams.albumId);
    } else if ($routeParams.artistId) {
        $scope.getAlbums($routeParams.artistId);
    }
    /* End Startup */
}]);
