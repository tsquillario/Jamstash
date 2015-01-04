/**
* jamstash.subsonicService Module
*
* Provides access through $http to the Subsonic server's API.
* Also offers more fine-grained functionality that is not part of Subsonic's API.
*/
angular.module('jamstash.subsonic.service', ['jamstash.settings', 'jamstash.utils', 'jamstash.model',
    'jamstash.notifications', 'jamstash.player.service', 'angular-underscore/utils'])

.factory('subsonic', ['$rootScope', '$http', '$q', 'globals', 'utils', 'map', 'notifications', 'player',
    function ($rootScope, $http, $q, globals, utils, map, notifications, player) {
    'use strict';

    var index = { shortcuts: [], artists: [] };
    var content = {
        album: [],
        song: [],
        playlists: [],
        breadcrumb: [],
        playlistsPublic: [],
        playlistsGenre: globals.SavedGenres,
        selectedAutoAlbum: null,
        selectedArtist: null,
        selectedAlbum: null,
        selectedPlaylist: null,
        selectedAutoPlaylist: null,
        selectedGenre: null,
        selectedPodcast: null
    };
    var genres = [];
    var podcasts = [];
    var offset = 0;
    var showPlaylist = false;
    var showPodcast = false;

    var sortSubsonicAlbums = function (newValue) {
        if (typeof newValue != 'undefined') {
            //alert(newValue);
            switch (newValue) {
                case 'createdate desc':
                    content.album.sort(utils.sortDateFunction);
                    break;
                case 'artist':
                    content.album.sort(utils.sortArtistFunction);
                    break;
                case 'album':
                    content.album.sort(utils.sortAlbumFunction);
                    break;
            }
        }
    };
    var sortSubsonicSongs = function (newValue) {
        if (typeof newValue != 'undefined') {
            //alert(newValue);
            switch (newValue) {
                case 'createdate desc':
                    content.song.sort(utils.sortDateFunction);
                    break;
                case 'artist':
                    content.song.sort(utils.sortArtistFunction);
                    break;
                case 'album':
                    content.song.sort(utils.sortAlbumFunction);
                    break;
                case 'track':
                    content.song.sort(utils.sortTrackFunction);
                    break;
            }
        }
    };

    return {
        showIndex: $rootScope.showIndex,
        showPlaylist: showPlaylist,
        getSongTemplate: function (callback) {
            var id = '16608';
            var url = globals.BaseURL() + '/getMusicDirectory.view?' + globals.BaseParams() + '&id=' + id;
            /*
            $.ajax({
                url: url,
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: globals.settings.Timeout,
                success: function (data) {

                }
            });
            */
            $http.get(url).success(function (data) {
                var items = [];
                var song = [];
                if (typeof data["subsonic-response"].directory.child != 'undefined') {
                    if (data["subsonic-response"].directory.child.length > 0) {
                        items = data["subsonic-response"].directory.child;
                    } else {
                        items[0] = data["subsonic-response"].directory.child;
                    }
                    angular.forEach(items, function (item, key) {
                        if (!item.isDir) {
                            song.push(map.mapSong(item));
                        }
                    });
                    callback(song);
                }
            });
        },

        /**
         * Handles building the URL with the correct parameters and error-handling while communicating with
         * a Subsonic server
         * @param  {String} partialUrl the last part of the Subsonic URL you want, e.g. 'getStarred.view'. If it does not start with a '/', it will be prefixed
         * @param  {Object} config     optional $http config object. The base settings expected by Subsonic (username, password, etc.) will be overwritten.
         * @return {Promise}           a Promise that will be resolved if we receive the 'ok' status from Subsonic. Will be rejected otherwise with an object : {'reason': a message that can be displayed to a user, 'httpError': the HTTP error code, 'subsonicError': the error Object sent by Subsonic}
         */
        subsonicRequest: function (partialUrl, config) {
            var exception = { reason: 'Error when contacting the Subsonic server.' };
            var deferred = $q.defer();
            var actualUrl = (partialUrl.charAt(0) === '/') ? partialUrl : '/' + partialUrl;
            var url = globals.BaseURL() + actualUrl;

            // Extend the provided config (if it exists) with our params
            // Otherwise we create a config object
            var actualConfig = config || {};
            var params = actualConfig.params || {};
            params.u = globals.settings.Username;
            params.p = globals.settings.Password;
            params.f = globals.settings.Protocol;
            params.v = globals.settings.ApiVersion;
            params.c = globals.settings.ApplicationName;
            actualConfig.params = params;
            actualConfig.timeout = globals.settings.Timeout;

            var httpPromise;
            if(globals.settings.Protocol === 'jsonp') {
                actualConfig.params.callback = 'JSON_CALLBACK';
                httpPromise = $http.jsonp(url, actualConfig);
            } else {
                httpPromise = $http.get(url, actualConfig);
            }
            httpPromise.success(function(data) {
                var subsonicResponse = (data['subsonic-response'] !== undefined) ? data['subsonic-response'] : {status: 'failed'};
                if (subsonicResponse.status === 'ok') {
                    deferred.resolve(subsonicResponse);
                } else {
                    if(subsonicResponse.status === 'failed' && subsonicResponse.error !== undefined) {
                        exception.subsonicError = subsonicResponse.error;
                    }
                    deferred.reject(exception);
                }
            }).error(function(data, status) {
                exception.httpError = status;
                deferred.reject(exception);
            });
            return deferred.promise;
        },

        getArtists: function (id, refresh) {
            var deferred = $q.defer();
            if (refresh || index.artists.length == 0) {
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

                /*
                $http.get(url).success(function (data) {
                });
                */
                $.ajax({
                    url: url,
                    method: 'GET',
                    dataType: globals.settings.Protocol,
                    timeout: globals.settings.Timeout,
                    success: function (data) {
                        var indexes = [];
                        if (typeof data["subsonic-response"].indexes.index != 'undefined') {
                            if (data["subsonic-response"].indexes.index.length > 0) {
                                indexes = data["subsonic-response"].indexes.index;
                            } else {
                                indexes[0] = data["subsonic-response"].indexes.index;
                            }
                        }
                        index.artists = [];
                        index.shortcuts = [];
                        var items = [];
                        if (typeof data["subsonic-response"].indexes.shortcut != 'undefined') {
                            if (data["subsonic-response"].indexes.shortcut.length > 0) {
                                items = data["subsonic-response"].indexes.shortcut;
                            } else {
                                items[0] = data["subsonic-response"].indexes.shortcut;
                            }
                            angular.forEach(items, function (item, key) {
                                index.shortcuts.push(map.mapIndex(item));
                            });
                        }
                        angular.forEach(indexes, function (item, key) {
                            index.artists.push(map.mapArtist(item));
                        });
                        deferred.resolve(index);
                    }
                });
            } else {
                deferred.resolve(index);
            }
            return deferred.promise;
        },
        getAlbums: function (id, name) {
            var deferred = $q.defer();
            if (id) {
                content.selectedAutoAlbum = null;
                content.selectedPlaylist = null;
                content.selectedArtist = id;
                content.breadcrumb = [];
                content.breadcrumb.push({ 'type': 'artist', 'id': id, 'name': name });
                var url = globals.BaseURL() + '/getMusicDirectory.view?' + globals.BaseParams() + '&id=' + id;
                /*
                $http.get(url).success(function (data) {
                });
                */
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
                            content.album = [];
                            content.song = [];

                            angular.forEach(items, function (item, key) {
                                if (item.isDir) {
                                    content.album.push(map.mapAlbum(item));
                                } else {
                                    content.song.push(map.mapSong(item));
                                }
                            });
                            if (SelectedAlbumSort.id != "default") {
                                sortSubsonicAlbums(SelectedAlbumSort.id);
                            }
                        } else {
                            notifications.updateMessage('No Albums Returned :(', true);
                        }
                        deferred.resolve(content);
                    }
                });
            } else {
                deferred.resolve(content);
            }
            return deferred.promise;
        },
        getAlbumListBy: function (id, off) {
            var deferred = $q.defer();
            var size, url;
            content.selectedArtist = null;
            content.selectedPlaylist = null;
            content.selectedAutoAlbum = id;
            content.breadcrumb = [];
            if (off == 'next') {
                offset = offset + globals.settings.AutoAlbumSize;
            } else if (offset == 'prev') {
                offset = offset - globals.settings.AutoAlbumSize;
            } else {
                offset = 0;
            }
            if (offset > 0) {
                url = globals.BaseURL() + '/getAlbumList.view?' + globals.BaseParams() + '&size=' + globals.settings.AutoAlbumSize.toString() + '&type=' + id + '&offset=' + offset;
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
                        content.album = [];
                        content.song = [];
                        angular.forEach(items, function (item, key) {
                            if (item.isDir) {
                                content.album.push(map.mapAlbum(item));
                            } else {
                                content.song.push(map.mapSong(item));
                            }
                        });
                        if (SelectedAlbumSort.id != "default") {
                            sortSubsonicAlbums(SelectedAlbumSort.id);
                        }
                    } else {
                        notifications.updateMessage('No Albums Returned :(', true);
                    }
                    deferred.resolve(content);
                }
            });
            return deferred.promise;
        },
        getAlbumByTag: function (id) { // Gets Album by ID3 tag
            var deferred = $q.defer();
            $.ajax({
                url: globals.BaseURL() + '/getAlbum.view?' + globals.BaseParams() + '&id=' + id,
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: globals.settings.Timeout,
                success: function (data) {
                    if (typeof data["subsonic-response"].album != 'undefined') {
                        content.album = [];
                        content.song = [];

                        var items = [];
                        if (data["subsonic-response"].album.song.length > 0) {
                            items = data["subsonic-response"].album.song;
                        } else {
                            items[0] = data["subsonic-response"].album.song;
                        }
                        angular.forEach(items, function (item, key) {
                            content.song.push(map.mapSong(item));
                        });
                    }
                    deferred.resolve(content);
                }
            });
            return deferred.promise;
        },
        getSongs: function (id, action) {
            var deferred = $q.defer();
            if (id) {
                content.selectedAlbum = id;
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
                                    $rootScope.queue.push(map.mapSong(item));
                                });
                                notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                            } else if (action == 'play') {
                                $rootScope.queue = [];
                                angular.forEach(items, function (item, key) {
                                    $rootScope.queue.push(map.mapSong(item));
                                });
                                var next = $rootScope.queue[0];
                                player.play(next);
                                notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                            } else {
                                if (typeof data["subsonic-response"].directory.id != 'undefined') {
                                    var albumId = data["subsonic-response"].directory.id;
                                    var albumName = data["subsonic-response"].directory.name;
                                    if (content.breadcrumb.length > 0) { content.breadcrumb.splice(1, (content.breadcrumb.length - 1)); }
                                    content.breadcrumb.push({ 'type': 'album', 'id': albumId, 'name': albumName });
                                }
                                content.song = [];
                                content.album = [];
                                var albums = [];
                                angular.forEach(items, function (item, key) {
                                    if (item.isDir) {
                                        albums.push(map.mapAlbum(item));
                                    } else {
                                        content.song.push(map.mapSong(item));
                                    }
                                });
                                if (albums.length > 0) {
                                    content.album = albums;
                                    if (SelectedAlbumSort.id != "default") {
                                        sortSubsonicAlbums(SelectedAlbumSort.id);
                                    }
                                }
                            }
                            deferred.resolve(content);
                        } else {
                            notifications.updateMessage('No Songs Returned :(', true);
                        }
                    }
                });
        } else {
            deferred.resolve(content);
        }
        return deferred.promise;
        },
        search: function (query, type) {
            var deferred = $q.defer();
            if (query !== '') {
                $.ajax({
                    url: globals.BaseURL() + '/search2.view?' + globals.BaseParams() + '&query=' + query,
                    method: 'GET',
                    dataType: globals.settings.Protocol,
                    timeout: globals.settings.Timeout,
                    success: function (data) {
                        if (data["subsonic-response"].searchResult2 !== "") {
                            var items = [];
                            if (type === '0') {
                                if (data["subsonic-response"].searchResult2.song !== undefined) {
                                    if (data["subsonic-response"].searchResult2.song.length > 0) {
                                        items = data["subsonic-response"].searchResult2.song;
                                    } else {
                                        items[0] = data["subsonic-response"].searchResult2.song;
                                    }
                                    content.album = [];
                                    content.song = [];
                                    angular.forEach(items, function (item, key) {
                                        content.song.push(map.mapSong(item));
                                    });
                                }
                            }
                            if (type === '1') {
                                if (data["subsonic-response"].searchResult2.album !== undefined) {
                                    if (data["subsonic-response"].searchResult2.album.length > 0) {
                                        items = data["subsonic-response"].searchResult2.album;
                                    } else {
                                        items[0] = data["subsonic-response"].searchResult2.album;
                                    }
                                    content.album = [];
                                    content.song = [];
                                    angular.forEach(items, function (item, key) {
                                        if (item.isDir) {
                                            content.album.push(map.mapAlbum(item));
                                        } else {
                                            content.song.push(map.mapAlbum(item));
                                        }
                                    });
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
                                        index.shortcuts.push(item);
                                    });
                                }
                            }
                            deferred.resolve(content);
                        }
                    }
                });
                //$('#Search').val("");
            }
            return deferred.promise;
        },

        getRandomSongs: function () {
            var exception = {reason: 'No songs found on the Subsonic server.'};
            var deferred = this.subsonicRequest('getRandomSongs.view', {
                params: {
                    size: globals.settings.AutoPlaylistSize
                }
            }).then(function (subsonicResponse) {
                if(subsonicResponse.randomSongs !== undefined && subsonicResponse.randomSongs.song.length > 0) {
                    var songs = [];
                    // TODO: Hyz: Add mapSongs to map service
                    angular.forEach(subsonicResponse.randomSongs.song, function (item) {
                        songs.push(map.mapSong(item));
                    });
                    return songs;
                } else {
                    return $q.reject(exception);
                }
            });
            return deferred;
        },

        getPlaylists: function (refresh) {
            var deferred = $q.defer();
            if (globals.settings.Debug) { console.log("LOAD PLAYLISTS"); }
            if (refresh || content.playlists.length == 0) {
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
                            content.playlists = [];
                            content.playlistsPublic = [];
                            angular.forEach(items, function (item, key) {
                                if (item.owner == globals.settings.Username) {
                                    content.playlists.push(item);
                                } else if (item.public) {
                                    content.playlistsPublic.push(item);
                                }
                            });
                            deferred.resolve(content);
                        }
                    }
                });
            } else {
                deferred.resolve(content);
            }
            return deferred.promise;
        },
        getPlaylist: function (id, action) {
            //TODO: Hyz: Test this
            var deferred = $q.defer();
            content.selectedAutoPlaylist = null;
            content.selectedPlaylist = id;
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
                                player.queue.push(map.mapSong(item));
                            });
                            notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                        } else if (action == 'play') {
                            player.queue = [];
                            angular.forEach(items, function (item, key) {
                                player.queue.push(map.mapSong(item));
                            });
                            var next = player.queue[0];
                            player.play(next);
                            notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                        } else {
                            content.album = [];
                            content.song = [];
                            angular.forEach(items, function (item, key) {
                                content.song.push(map.mapSong(item));
                            });
                            notifications.updateMessage(items.length + ' Song(s) in Playlist', true);
                        }
                    } else {
                        content.song = [];
                    }
                    deferred.resolve(content);
                }
            });
            return deferred.promise;
        },

        getStarred: function () {
            var deferred = this.subsonicRequest('getStarred.view', { cache: true })
                .then(function (subsonicResponse) {
                    if(angular.equals(subsonicResponse.starred, {})) {
                        return $q.reject({reason: 'Nothing is starred on the Subsonic server.'});
                    } else {
                        return subsonicResponse.starred;
                    }
                });
            return deferred;
        },

        getRandomStarredSongs: function() {
            var deferred = this.getStarred()
                .then(function (starred) {
                    if(starred.song !== undefined && starred.song.length > 0) {
                        // Return random subarray of songs
                        return [].concat(_(starred.song).sample(globals.settings.AutoPlaylistSize));
                    } else {
                        return $q.reject({reason: 'No starred songs found on the Subsonic server.'});
                    }
                });
            return deferred;
        },

        newPlaylist: function (data, event) {
            var deferred = $q.defer();
            var reply = prompt("Choose a name for your new playlist.", "");
            if (reply != 'null' && reply !== null && reply !== '') {
                $.ajax({
                    url: globals.BaseURL() + '/createPlaylist.view?' + globals.BaseParams() + '&name=' + reply,
                    method: 'GET',
                    dataType: globals.settings.Protocol,
                    timeout: globals.settings.Timeout,
                    success: function (data) {
                        deferred.resolve();
                    }
                });
            }
            return deferred.promise;
        },
        deletePlaylist: function () {
            var deferred = $q.defer();
            if (content.selectedPlaylist !== null) {
                var id = content.selectedPlaylist;
                if (utils.confirmDelete('Are you sure you want to delete the selected playlist?')) {
                    $.ajax({
                        url: globals.BaseURL() + '/deletePlaylist.view?' + globals.BaseParams() + '&id=' + id,
                        method: 'GET',
                        dataType: globals.settings.Protocol,
                        timeout: globals.settings.Timeout,
                        success: function (data) {
                            deferred.resolve();
                        }
                    });
                }
            }
            return deferred.promise;
        },
        savePlaylist: function () {
            var deferred = $q.defer();
            if (content.selectedPlaylist !== null) {
                var id = content.selectedPlaylist;
                var songs = [];
                angular.forEach(content.song, function (item, key) {
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
                            deferred.resolve();
                        },
                        traditional: true // Fixes POST with an array in JQuery 1.4
                    });
                }
            }
            return deferred.promise;
        },
        songsRemoveSelected: function (songs) {
            var deferred = $q.defer();
            angular.forEach(songs, function (item, key) {
                var index = content.song.indexOf(item)
                content.song.splice(index, 1);
            });
            deferred.resolve(content);
            return deferred.promise;
        },
        getGenres: function () {
            var deferred = $q.defer();
            var genresStr = 'Acid Rock,Acoustic,Alt Country,Alt/Indie,Alternative & Punk,Alternative Metal,Alternative,AlternRock,Awesome,Bluegrass,Blues,Blues-Rock,Classic Hard Rock,Classic Rock,Comedy,Country,Country-Rock,Dance,Dance-Rock,Deep Funk,Easy Listening,Electronic,Electronica,Electronica/Dance,Folk,Folk/Rock,Funk,Grunge,Hard Rock,Heavy Metal,Holiday,House,Improg,Indie Rock,Indie,International,Irish,Jam Band,Jam,Jazz Fusion,Jazz,Latin,Live Albums,Metal,Music,Oldies,Other,Pop,Pop/Rock,Post Rock,Progressive Rock,Psychedelic Rock,Psychedelic,Punk,R&B,Rap & Hip-Hop,Reggae,Rock & Roll,Rock,Rock/Pop,Roots,Ska,Soft Rock,Soul,Southern Rock,Thrash Metal,Unknown,Vocal,World';
            genres = genresStr.split(',');
            /* This is broken in version 4.8, unable to convert XML to JSON
            $.ajax({
            url: globals.BaseURL() + '/getGenres.view?' + globals.BaseParams(),
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
            if (typeof data["subsonic-response"].genres != 'undefined') {
            var items = [];
            if (data["subsonic-response"].genres.length > 0) {
            items = data["subsonic-response"].genres;
            } else {
            items[0] = data["subsonic-response"].genres;
            }

            $rootScope.Genres = items;
            $scope.$apply();
            }
            }
            });
            */
            deferred.resolve(genres);
            return deferred.promise;
        },
        getPodcasts: function (refresh) {
            var deferred = $q.defer();
            if (globals.settings.Debug) { console.log("LOAD PODCASTS"); }
            $.ajax({
                url: globals.BaseURL() + '/getPodcasts.view?' + globals.BaseParams(),
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: globals.settings.Timeout,
                success: function (data) {
                    if (data["subsonic-response"].podcasts.channel !== undefined) {
                        var items = [];
                        if (data["subsonic-response"].podcasts.channel.length > 0) {
                            items = data["subsonic-response"].podcasts.channel;
                        } else {
                            items[0] = data["subsonic-response"].podcasts.channel;
                        }
                        podcasts = items;
                    }
                    deferred.resolve(podcasts);
                }
            });
            return deferred.promise;
        },
        getPodcast: function (id, action) {
            var deferred = $q.defer();
            content.selectedPodcast = id;
            $.ajax({
                url: globals.BaseURL() + '/getPodcasts.view?' + globals.BaseParams(),
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: globals.settings.Timeout,
                success: function (data) {
                    if (data["subsonic-response"].podcasts.channel !== undefined) {
                        var podcasts = [];
                        if (data["subsonic-response"].podcasts.channel.length > 0) {
                            podcasts = data["subsonic-response"].podcasts.channel;
                        } else {
                            podcasts[0] = data["subsonic-response"].podcasts.channel;
                        }
                        var items = [];
                        $.each(podcasts, function (i, item) {
                            if (item.id == id) {
                                items = item.episode;
                            }
                        });

                        if (typeof items != 'undefined') {
                            if (action == 'add') {
                                angular.forEach(items, function (item, key) {
                                    if (item.status != "skipped") {
                                        $rootScope.queue.push(map.mapPodcast(item));
                                    }
                                });
                                notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                            } else if (action == 'play') {
                                $rootScope.queue = [];
                                angular.forEach(items, function (item, key) {
                                    if (item.status != "skipped") {
                                        $rootScope.queue.push(map.mapPodcast(item));
                                    }
                                });
                                var next = $rootScope.queue[0];
                                player.play(next);
                                notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                            } else {
                                content.album = [];
                                content.song = [];
                                angular.forEach(items, function (item, key) {
                                    if (item.status != "skipped") {
                                        content.song.push(map.mapPodcast(item));
                                    }
                                });
                            }
                        }
                    }
                    deferred.resolve(content);
                }
            });
            return deferred.promise;
        },

        scrobble: function (song) {
            var deferred = this.subsonicRequest('scrobble.view', {
                params: {
                    id: song.id,
                    submisssion: true
                }
            }).then(function () {
                if(globals.settings.Debug) { console.log('Successfully scrobbled song: ' + song.id); }
                return true;
            });
            return deferred;
        }
        // End subsonic
    };
}]);
