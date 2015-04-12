/**
* jamstash.subsonicService Module
*
* Provides access through $http to the Subsonic server's API.
* Also offers more fine-grained functionality that is not part of Subsonic's API.
*/
angular.module('jamstash.subsonic.service', ['angular-underscore/utils',
    'jamstash.settings.service', 'jamstash.utils', 'jamstash.model', 'jamstash.notifications', 'jamstash.player.service'])

.factory('subsonic', ['$rootScope', '$http', '$q', 'globals', 'utils', 'map', 'notifications', 'player',
    function ($rootScope, $http, $q, globals, utils, map, notifications, player) {
    'use strict';

    //TODO: Hyz: Remove when refactored
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
    var offset = 0;
    var showPlaylist = false;

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
            httpPromise.success(function (data) {
                var subsonicResponse = (data['subsonic-response'] !== undefined) ? data['subsonic-response'] : {status: 'failed'};
                if (subsonicResponse.status === 'ok') {
                    deferred.resolve(subsonicResponse);
                } else {
                    if(subsonicResponse.status === 'failed' && subsonicResponse.error !== undefined) {
                        exception.subsonicError = subsonicResponse.error;
                    }
                    deferred.reject(exception);
                }
            }).error(function (data, status) {
                exception.httpError = status;
                deferred.reject(exception);
            });
            return deferred.promise;
        },

        ping: function () {
            return this.subsonicRequest('ping.view');
        },

        getArtists: function (folder) {
            var exception = {reason: 'No artist found on the Subsonic server.'};
            // TODO: Hyz: Move loading / saving the music folder to persistence-service
            if (isNaN(folder) && utils.getValue('MusicFolders')) {
                var musicFolder = angular.fromJson(utils.getValue('MusicFolders'));
                folder = musicFolder.id;
            }
            var params;
            if (!isNaN(folder)) {
                params = {
                    musicFolderId: folder
                };
            }
            var promise = this.subsonicRequest('getIndexes.view', {
                params: params
            }).then(function (subsonicResponse) {
                if(subsonicResponse.indexes !== undefined && (subsonicResponse.indexes.index !== undefined || subsonicResponse.indexes.shortcut !== undefined)) {
                    // Make sure shortcut, index and each index's artist are arrays
                    // because Madsonic will return objects and not arrays if there is only 1 artist
                    var formattedResponse = {};
                    formattedResponse.shortcut = [].concat(subsonicResponse.indexes.shortcut);
                    formattedResponse.index = [].concat(subsonicResponse.indexes.index);
                    _(formattedResponse.index).map(function (index) {
                        var formattedIndex = index;
                        formattedIndex.artist = [].concat(index.artist);
                        return formattedIndex;
                    });
                    return formattedResponse;
                } else {
                    return $q.reject(exception);
                }
            });
            return promise;
        },

        getAlbums: function (id, name) {
            var exception = {reason: 'No songs found on the Subsonic server.'};
            var params = {
                id: id
            };
            var promise = this.subsonicRequest('getMusicDirectory.view', {
                params: params
            }).then(function (subsonicResponse) {
                if(subsonicResponse.directory.child !== undefined) {
                    var childArray = [].concat(subsonicResponse.directory.child);
                    if (childArray.length > 0) {
                        content.song = [];
                        content.album = [];
                        content.breadcrumb = [];
                        content.breadcrumb.push({ 'type': 'artist', 'id': id, 'name': name });
                        angular.forEach(childArray, function (item, key) {
                            if (item.isDir) {
                                content.album.push(map.mapAlbum(item));
                            } else {
                                content.song.push(map.mapSong(item));
                            }
                        });
                        return content;
                    }
                }
                // We end up here for every else
                return $q.reject(exception);
            });
            return promise;
        },
        getAlbumListBy: function (id, off) {
            if (off == 'next') {
                offset = offset + globals.settings.AutoAlbumSize;
            } else if (off == 'prev') {
                offset = offset - globals.settings.AutoAlbumSize;
            } else {
                offset = 0;
            }
            var exception = {reason: 'No songs found on the Subsonic server.'};
            var params = {
                size: globals.settings.AutoAlbumSize,
                type: id,
                offset: offset
            };
            var promise = this.subsonicRequest('getAlbumList.view', {
                params: params
            }).then(function (subsonicResponse) {
                if(subsonicResponse.albumList.album !== undefined) {
                    var albumArray = [].concat(subsonicResponse.albumList.album);
                    if (albumArray.length > 0) {
                        content.song = [];
                        content.album = [];
                        content.selectedArtist = null;
                        content.selectedPlaylist = null;
                        content.selectedAutoAlbum = id;
                        content.breadcrumb = [];
                        angular.forEach(albumArray, function (item, key) {
                            if (item.isDir) {
                                content.album.push(map.mapAlbum(item));
                            } else {
                                content.song.push(map.mapSong(item));
                            }
                        });
                        return content;
                    }
                }
                // We end up here for every else
                return $q.reject(exception);
            });
            return promise;
        },
        getAlbumByTag: function (id) { // Gets Album by ID3 tag: NOT Being Used Currently 1/24/2015
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
            var exception = {reason: 'No songs found on the Subsonic server.'};
            var promise = this.subsonicRequest('getMusicDirectory.view', {
                params: {
                    id: id
                }
            }).then(function (subsonicResponse) {
                if(subsonicResponse.directory.child !== undefined) {
                    var items = [].concat(subsonicResponse.directory.child);
                    if (items.length > 0) {
                        content.selectedAlbum = id;
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
                            if (subsonicResponse.directory.id != 'undefined') {
                                var albumId = subsonicResponse.directory.id;
                                var albumName = subsonicResponse.directory.name;
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
                            }
                        }
                        return content;
                    }
                }
                // We end up here for every else
                return $q.reject(exception);
            });
            return promise;
        },

        search: function (query, type) {
            if(_([0, 1, 2]).contains(type)) {
                var promise = this.subsonicRequest('search2.view', {
                    params: {
                        query: query
                    }
                }).then(function (subsonicResponse) {
                    if (!_.isEmpty(subsonicResponse.searchResult2)) {
                        switch (type) {
                            case 0:
                                if (subsonicResponse.searchResult2.song !== undefined) {
                                    return map.mapSongs([].concat(subsonicResponse.searchResult2.song));
                                }
                                break;
                            case 1:
                                if (subsonicResponse.searchResult2.album !== undefined) {
                                    return map.mapAlbums([].concat(subsonicResponse.searchResult2.album));
                                }
                                break;
                            case 2:
                                if (subsonicResponse.searchResult2.artist !== undefined) {
                                    return [].concat(subsonicResponse.searchResult2.artist);
                                }
                                break;
                        }
                    }
                    // We end up here for every else
                    return $q.reject({reason: 'No results.'});
                });
                return promise;
            } else {
                return $q.reject({reason: 'Wrong search type.'});
            }
        },

        getRandomSongs: function (genre, folder) {
            var exception = {reason: 'No songs found on the Subsonic server.'};
            var params = {
                size: globals.settings.AutoPlaylistSize
            };
            if (genre !== undefined && genre !== '' && genre !== 'Random') {
                params.genre = genre;
            }
            if (!isNaN(folder)) {
                params.musicFolderId = folder;
            }
            var promise = this.subsonicRequest('getRandomSongs.view', {
                params: params
            }).then(function (subsonicResponse) {
                if(subsonicResponse.randomSongs !== undefined) {
                    var songArray = [].concat(subsonicResponse.randomSongs.song);
                    if (songArray.length > 0) {
                        return map.mapSongs(songArray);
                    }
                }
                // We end up here for every else
                return $q.reject(exception);
            });
            return promise;
        },

        getStarred: function () {
            var promise = this.subsonicRequest('getStarred.view', { cache: true })
                .then(function (subsonicResponse) {
                    if(angular.equals(subsonicResponse.starred, {})) {
                        return $q.reject({reason: 'Nothing is starred on the Subsonic server.'});
                    } else {
                        return subsonicResponse.starred;
                    }
                });
            return promise;
        },

        getRandomStarredSongs: function () {
            var promise = this.getStarred()
                .then(function (starred) {
                    if(starred.song !== undefined) {
                        var songArray = [].concat(starred.song);
                        if (songArray.length > 0) {
                            // Return random subarray of songs
                            var songs = [].concat(_(songArray).sample(globals.settings.AutoPlaylistSize));
                            return map.mapSongs(songs);
                        }
                    }
                    // We end up here for every else
                    return $q.reject({reason: 'No starred songs found on the Subsonic server.'});
                });
            return promise;
        },

        getPlaylists: function () {
            var exception = {reason: 'No playlist found on the Subsonic server.'};
            var promise = this.subsonicRequest('getPlaylists.view')
            .then(function (subsonicResponse) {
                if(subsonicResponse.playlists.playlist !== undefined) {
                    var playlistArray = [].concat(subsonicResponse.playlists.playlist);
                    if (playlistArray.length > 0) {
                        var allPlaylists = _(playlistArray).partition(function (item) {
                            return item.owner === globals.settings.Username;
                        });
                        return {playlists: allPlaylists[0], playlistsPublic: allPlaylists[1]};
                    }
                }
                // We end up here for every else
                return $q.reject(exception);
            });
            return promise;
        },

        getPlaylist: function (id) {
            var exception = {reason: 'This playlist is empty.'};
            var promise = this.subsonicRequest('getPlaylist.view', {
                params: {
                    id: id
                }
            }).then(function (subsonicResponse) {
                if (subsonicResponse.playlist.entry !== undefined) {
                    var entryArray = [].concat(subsonicResponse.playlist.entry);
                    if (entryArray.length > 0) {
                        return map.mapSongs(entryArray);
                    }
                }
                // We end up here for every else
                return $q.reject(exception);
            });
            return promise;
        },

        newPlaylist: function (name) {
            var promise = this.subsonicRequest('createPlaylist.view', {
                params: {
                    name: name
                }
            });
            return promise;
        },

        deletePlaylist: function (id) {
            var promise = this.subsonicRequest('deletePlaylist.view', {
                params: {
                    id: id
                }
            });
            return promise;
        },

        savePlaylist: function (playlistId, songs) {
            var params = {
                params: {
                    playlistId: playlistId,
                    songId: []
                }
            };
            for (var i = 0; i < songs.length; i++) {
                params.params.songId.push(songs[i].id);
            }
            return this.subsonicRequest('createPlaylist.view', params);
        },

        //TODO: Hyz: move to controller
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

        getPodcasts: function () {
            var exception = {reason: 'No podcast found on the Subsonic server.'};
            var promise = this.subsonicRequest('getPodcasts.view', {
                params: {
                    includeEpisodes: false
                }
            })
            .then(function (subsonicResponse) {
                if (subsonicResponse.podcasts !== undefined && subsonicResponse.podcasts.channel !== undefined) {
                    var channelArray = [].concat(subsonicResponse.podcasts.channel);
                    if (channelArray.length > 0) {
                        return channelArray;
                    }
                }
                // We end up here for every else
                return $q.reject(exception);
            });
            return promise;
        },

        getPodcast: function (id) {
            var exception = {reason: 'This podcast was not found on the Subsonic server.'};
            var promise = this.subsonicRequest('getPodcasts.view', {
                params: {
                    id: id,
                    includeEpisodes: true
                }
            }).then(function (subsonicResponse) {
                var episodes = [];
                if (subsonicResponse.podcasts.channel !== undefined) {
                    var channelArray = [].concat(subsonicResponse.podcasts.channel);
                    if (channelArray.length > 0) {
                        var channel = channelArray[0];
                        if (channel !== null && channel.id === id) {
                            var episodesArray = [].concat(channel.episode);
                            episodes = _(episodesArray).filter(function (episode) {
                                return episode.status === "completed";
                            });
                            if(episodes.length > 0) {
                                return map.mapPodcasts(episodes);
                            } else {
                                return $q.reject({reason: 'No downloaded episode found for this podcast. Please check the podcast settings.'});
                            }
                        }
                    }
                }
                // We end up here for every else
                return $q.reject(exception);
            });
            return promise;
        },

        scrobble: function (song) {
            var promise = this.subsonicRequest('scrobble.view', {
                params: {
                    id: song.id,
                    submisssion: true
                }
            }).then(function () {
                if(globals.settings.Debug) { console.log('Successfully scrobbled song: ' + song.id); }
                return true;
            });
            return promise;
        }
        // End subsonic
    };
}]);
