/**
* jamstash.subsonic.service Module
*
* Provides access through $http to the Subsonic server's API.
* Also offers more fine-grained functionality that is not part of Subsonic's API.
*/
angular.module('jamstash.subsonic.service', [
    'ngLodash',
    'jamstash.settings.service',
    'jamstash.model'
])

.service('subsonic', subsonicService);

subsonicService.$inject = [
    '$http',
    '$q',
    'lodash',
    'globals',
    'map'
];

function subsonicService(
    $http,
    $q,
    _,
    globals,
    map
) {
    'use strict';

    var self = this;
    _.extend(self, {
        addToPlaylist        : addToPlaylist,
        deletePlaylist       : deletePlaylist,
        getAlbumByTag        : getAlbumByTag,
        getAlbumListBy       : getAlbumListBy,
        getArtists           : getArtists,
        getGenres            : getGenres,
        getMusicFolders      : getMusicFolders,
        getPlaylist          : getPlaylist,
        getPlaylists         : getPlaylists,
        getPodcast           : getPodcast,
        getPodcasts          : getPodcasts,
        getRandomSongs       : getRandomSongs,
        getRandomStarredSongs: getRandomStarredSongs,
        getDirectory         : getDirectory,
        getStarred           : getStarred,
        newPlaylist          : newPlaylist,
        ping                 : ping,
        recursiveGetDirectory: recursiveGetDirectory,
        savePlaylist         : savePlaylist,
        scrobble             : scrobble,
        search               : search,
        subsonicRequest      : subsonicRequest,
        toggleStar           : toggleStar,
        addToJukebox         : addToJukebox,
        sendToJukebox        : sendToJukebox
    });

    // TODO: Hyz: Remove when refactored
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

    /**
     * Handles building the URL with the correct parameters and error-handling while communicating with
     * a Subsonic server
     * @param  {String} partialUrl the last part of the Subsonic URL you want, e.g. 'getStarred.view'. If it does not start with a '/', it will be prefixed
     * @param  {Object} config     optional $http config object. The base settings expected by Subsonic (username, password, etc.) will be overwritten.
     * @return {Promise}           a Promise that will be resolved if we receive the 'ok' status from Subsonic. Will be rejected otherwise with an object : {'reason': a message that can be displayed to a user, 'httpError': the HTTP error code, 'subsonicError': the error Object sent by Subsonic}
     */
    function subsonicRequest(partialUrl, config) {
        var exception = { reason: 'Error when contacting the Subsonic server.' };
        var deferred = $q.defer();
        var actualUrl = (partialUrl.charAt(0) === '/') ? partialUrl : '/' + partialUrl;
        var url = globals.BaseURL() + actualUrl;

        // Extend the provided config (if it exists) with our params
        // Otherwise we create a config object
        var actualConfig = config || {};
        actualConfig.params = actualConfig.params || {};
        _.extend(actualConfig.params,  {
            u: globals.settings.Username,
            p: globals.settings.Password,
            f: globals.settings.Protocol,
            v: globals.settings.ApiVersion,
            c: globals.settings.ApplicationName
        });
        actualConfig.timeout = globals.settings.Timeout;

        var httpPromise;
        if (globals.settings.Protocol === 'jsonp') {
            actualConfig.params.callback = 'JSON_CALLBACK';
            httpPromise = $http.jsonp(url, actualConfig);
        } else {
            httpPromise = $http.get(url, actualConfig);
        }
        httpPromise.success(function (data) {
            var subsonicResponse = (data['subsonic-response'] !== undefined) ? data['subsonic-response'] : { status: 'failed' };
            if (subsonicResponse.status === 'ok') {
                deferred.resolve(subsonicResponse);
            } else {
                if (subsonicResponse.status === 'failed' && subsonicResponse.error !== undefined) {
                    exception.subsonicError = subsonicResponse.error;
                    exception.version = subsonicResponse.version;
                }
                deferred.reject(exception);
            }
        }).error(function (data, status) {
            exception.httpError = status;
            deferred.reject(exception);
        });
        return deferred.promise;
    }

    function ping() {
        return self.subsonicRequest('ping.view');
    }

    function getMusicFolders() {
        var exception = { reason: 'No music folder found on the Subsonic server.' };
        var promise = self.subsonicRequest('getMusicFolders.view', {
            cache: true
        }).then(function (subsonicResponse) {
            if (subsonicResponse.musicFolders !== undefined && subsonicResponse.musicFolders.musicFolder !== undefined) {
                return [].concat(subsonicResponse.musicFolders.musicFolder);
            } else {
                return $q.reject(exception);
            }
        });
        return promise;
    }

    function getArtists(folder) {
        var exception = { reason: 'No artist found on the Subsonic server.' };
        var params;
        if (! isNaN(folder)) {
            params = {
                musicFolderId: folder
            };
        }
        var promise = self.subsonicRequest('getIndexes.view', {
            cache: true,
            params: params
        }).then(function (subsonicResponse) {
            if (subsonicResponse.indexes !== undefined && (subsonicResponse.indexes.index !== undefined || subsonicResponse.indexes.shortcut !== undefined)) {
                // Make sure shortcut, index and each index's artist are arrays
                // because Madsonic will return an object when there's only one element
                var formattedResponse = {};
                formattedResponse.shortcut = [].concat(subsonicResponse.indexes.shortcut);
                formattedResponse.index = [].concat(subsonicResponse.indexes.index);
                _.map(formattedResponse.index, function (index) {
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
    }

    function getAlbumByTag(id) { // Gets Album by ID3 tag: NOT Being Used Currently 1/24/2015
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
    }

    function getDirectory(id) {
        var exception = { reason: 'This directory is empty.' };
        var promise = self.subsonicRequest('getMusicDirectory.view', {
            params: {
                id: id
            }
        }).then(function (subsonicResponse) {
            if (subsonicResponse.directory.child !== undefined) {
                // Make sure this is an array using concat because Madsonic will return an object when there's only one element
                var children = [].concat(subsonicResponse.directory.child);
                if (children.length > 0) {
                    var allChildren = _.partition(children, function (item) {
                        return item.isDir;
                    });
                    return {
                        directories: map.mapAlbums(allChildren[0]),
                        songs: map.mapSongs(allChildren[1])
                    };
                }
            }
            // We end up here for every else
            return $q.reject(exception);
        });
        return promise;
    }

    // This is used when we add or play a directory, so we recursively get all its contents
    function recursiveGetDirectory(id) {
        var deferred = $q.defer();
        // We first use getDirectory() to get the contents of the root directory
        self.getDirectory(id).then(function (data) {
            var directories = data.directories;
            var songs = data.songs;
            // If there are only songs, we return them immediately: this is a leaf directory and the end of the recursion
            if (directories.length === 0) {
                deferred.resolve(songs);
            } else {
                // otherwise, for each directory, we call ourselves
                var promises = [];
                angular.forEach(directories, function (dir) {
                    var subdirectoryRequest = self.recursiveGetDirectory(dir.id).then(function (data) {
                        // This is where we join all the songs together in a single array
                        return songs.concat(data);
                    });
                    promises.push(subdirectoryRequest);
                });
                // since all of this is asynchronous, we need to wait for all the requests to finish by using $q.all()
                var allRequestsFinished = $q.all(promises).then(function (data) {
                    // and since $q.all() wraps everything in another array, we use flatten() to end up with only one array of songs
                    return _.flatten(data);
                });
                deferred.resolve(allRequestsFinished);
            }
        }, function () {
            // Even if getDirectory returns an error, we resolve with an empty array. Otherwise one empty directory somewhere
            // would keep us from playing all the songs of a directory recursively
            deferred.resolve([]);
        });
        return deferred.promise;
    }

    function getAlbumListBy(type, offset) {
        var actualOffset = (offset > 0) ? offset : 0;
        var exception = { reason: 'No matching albums found on the Subsonic server.' };
        var params = {
            size: globals.settings.AutoAlbumSize,
            type: type,
            offset: actualOffset
        };
        var promise = self.subsonicRequest('getAlbumList.view', {
            params: params
        }).then(function (subsonicResponse) {
            if (subsonicResponse.albumList.album !== undefined) {
                // Make sure this is an array using concat because Madsonic will return an object when there's only one element
                var albumArray = [].concat(subsonicResponse.albumList.album);
                if (albumArray.length > 0) {
                    return map.mapAlbums(albumArray);
                }
            }
            // We end up here for every else
            return $q.reject(exception);
        });
        return promise;
    }

    function search(query, type) {
        if (_([0, 1, 2]).contains(type)) {
            var promise = self.subsonicRequest('search2.view', {
                params: {
                    query: query
                }
            }).then(function (subsonicResponse) {
                var searchResult;
                if (! _.isEmpty(subsonicResponse.searchResult2)) {
                    searchResult = subsonicResponse.searchResult2;
                } else if (! _.isEmpty(subsonicResponse.search2)) {
                    // We also check search2 because Music Cabinet doesn't respond the same thing
                    // as everyone else...
                    searchResult = subsonicResponse.search2;
                }
                if (! _.isEmpty(searchResult)) {
                    // Make sure that song, album and artist are arrays using concat
                    // because Madsonic will return an object when there's only one element
                    switch (type) {
                        case 0:
                            if (searchResult.song !== undefined) {
                                return map.mapSongs([].concat(searchResult.song));
                            }
                            break;
                        case 1:
                            if (searchResult.album !== undefined) {
                                return map.mapAlbums([].concat(searchResult.album));
                            }
                            break;
                        case 2:
                            if (searchResult.artist !== undefined) {
                                return [].concat(searchResult.artist);
                            }
                            break;
                    }
                }
                // We end up here for every else
                return $q.reject({ reason: 'No results.' });
            });
            return promise;
        } else {
            return $q.reject({ reason: 'Wrong search type.' });
        }
    }

    function getRandomSongs(genre, folder) {
        var exception = { reason: 'No songs found on the Subsonic server.' };
        var params = {
            size: globals.settings.AutoPlaylistSize
        };
        if (genre !== undefined && genre !== '' && genre !== 'Random') {
            params.genre = genre;
        }
        if (! isNaN(folder)) {
            params.musicFolderId = folder;
        }
        var promise = self.subsonicRequest('getRandomSongs.view', {
            params: params
        }).then(function (subsonicResponse) {
            if (subsonicResponse.randomSongs !== undefined) {
                // Make sure this is an array using concat because Madsonic will return an object when there's only one element
                var songArray = [].concat(subsonicResponse.randomSongs.song);
                if (songArray.length > 0) {
                    return map.mapSongs(songArray);
                }
            }
            // We end up here for every else
            return $q.reject(exception);
        });
        return promise;
    }

    function getStarred() {
        var promise = self.subsonicRequest('getStarred.view', { cache: true })
            .then(function (subsonicResponse) {
                if (angular.equals(subsonicResponse.starred, {})) {
                    return $q.reject({ reason: 'Nothing is starred on the Subsonic server.' });
                } else {
                    return subsonicResponse.starred;
                }
            });
        return promise;
    }

    function getRandomStarredSongs() {
        var promise = self.getStarred()
            .then(function (starred) {
                if (starred.song !== undefined) {
                    // Make sure this is an array using concat because Madsonic will return an object when there's only one element
                    var songArray = [].concat(starred.song);
                    if (songArray.length > 0) {
                        // Return random subarray of songs
                        var songs = [].concat(_.sample(songArray, globals.settings.AutoPlaylistSize));
                        return map.mapSongs(songs);
                    }
                }
                // We end up here for every else
                return $q.reject({ reason: 'No starred songs found on the Subsonic server.' });
            });
        return promise;
    }

    function getPlaylists() {
        var exception = { reason: 'No playlist found on the Subsonic server.' };
        var promise = self.subsonicRequest('getPlaylists.view')
        .then(function (subsonicResponse) {
            if (subsonicResponse.playlists.playlist !== undefined) {
                // Make sure this is an array using concat because Madsonic will return an object when there's only one element
                var playlistArray = [].concat(subsonicResponse.playlists.playlist);
                if (playlistArray.length > 0) {
                    var allPlaylists = _.partition(playlistArray, function (item) {
                        return item.owner === globals.settings.Username;
                    });
                    return { playlists: allPlaylists[0], playlistsPublic: allPlaylists[1] };
                }
            }
            // We end up here for every else
            return $q.reject(exception);
        });
        return promise;
    }

    function getPlaylist(id) {
        var exception = { reason: 'This playlist is empty.' };
        var promise = self.subsonicRequest('getPlaylist.view', {
            params: {
                id: id
            }
        }).then(function (subsonicResponse) {
            if (subsonicResponse.playlist.entry !== undefined) {
                // Make sure this is an array using concat because Madsonic will return an object when there's only one element
                var entryArray = [].concat(subsonicResponse.playlist.entry);
                if (entryArray.length > 0) {
                    return map.mapSongs(entryArray);
                }
            }
            // We end up here for every else
            return $q.reject(exception);
        });
        return promise;
    }

    function newPlaylist(name) {
        var promise = self.subsonicRequest('createPlaylist.view', {
            params: {
                name: name
            }
        });
        return promise;
    }

    function deletePlaylist(playlistId) {
        var promise = self.subsonicRequest('deletePlaylist.view', {
            params: {
                id: playlistId
            }
        });
        return promise;
    }

    function addToPlaylist(playlistId, songs) {
        var songIds = _.pluck(songs, 'id');
        var promise = self.subsonicRequest('updatePlaylist.view', {
            params: {
                playlistId :  playlistId,
                songIdToAdd: songIds
            }
        });
        return promise;
    }

    function savePlaylist(playlistId, songs) {
        var songIds = _.pluck(songs, 'id');
        var promise = self.subsonicRequest('createPlaylist.view', {
            params: {
                playlistId: playlistId,
                songId    : songIds
            }
        });
        return promise;
    }

    function getGenres() {
        var exception = { reason: 'No genre found on the Subsonic server.' };
        var promise = self.subsonicRequest('getGenres.view')
        .then(function (subsonicResponse) {
            if (subsonicResponse.genres !== undefined && subsonicResponse.genres.genre !== undefined) {
                var genreArray = [].concat(subsonicResponse.genres.genre);
                if (genreArray.length > 0) {
                    var stringArray;
                    if (genreArray[0].value) {
                        stringArray = _.pluck(genreArray, 'value');
                    // Of course, Madsonic doesn't return the same thing as Subsonic...
                    } else if (genreArray[0].content) {
                        stringArray = _.pluck(genreArray, 'content');
                    }
                    return stringArray;
                }
            }
            // We end up here for every else
            return $q.reject(exception);
        });
        return promise;
    }

    function getPodcasts() {
        var exception = { reason: 'No podcast found on the Subsonic server.' };
        var promise = self.subsonicRequest('getPodcasts.view', {
            params: {
                includeEpisodes: false
            }
        })
        .then(function (subsonicResponse) {
            if (subsonicResponse.podcasts !== undefined && subsonicResponse.podcasts.channel !== undefined) {
                // Make sure this is an array using concat because Madsonic will return an object when there's only one element
                var channelArray = [].concat(subsonicResponse.podcasts.channel);
                if (channelArray.length > 0) {
                    return channelArray;
                }
            }
            // We end up here for every else
            return $q.reject(exception);
        });
        return promise;
    }

    function getPodcast(id) {
        var exception = { reason: 'This podcast was not found on the Subsonic server.' };
        var promise = self.subsonicRequest('getPodcasts.view', {
            params: {
                id: id,
                includeEpisodes: true
            }
        }).then(function (subsonicResponse) {
            var episodes = [];
            if (subsonicResponse.podcasts.channel !== undefined) {
                // Make sure this is an array using concat because Madsonic will return an object when there's only one element
                var channelArray = [].concat(subsonicResponse.podcasts.channel);
                if (channelArray.length > 0) {
                    var channel = channelArray[0];
                    if (channel !== null && channel.id === id) {
                        // Make sure this is an array using concat because Madsonic will return an object when there's only one element
                        var episodesArray = [].concat(channel.episode);
                        episodes = _.filter(episodesArray, function (episode) {
                            return episode.status === 'completed';
                        });
                        if (episodes.length > 0) {
                            return map.mapPodcasts(episodes);
                        } else {
                            return $q.reject({ reason: 'No downloaded episode found for this podcast. Please check the podcast settings.' });
                        }
                    }
                }
            }
            // We end up here for every else
            return $q.reject(exception);
        });
        return promise;
    }

    function scrobble(song) {
        var promise = self.subsonicRequest('scrobble.view', {
            params: {
                id: song.id,
                submisssion: true
            }
        }).then(function () {
            if (globals.settings.Debug) { console.log('Successfully scrobbled song: ' + song.id); }
            return true;
        });
        return promise;
    }

    function toggleStar(item) {
        var partialUrl = (item.starred) ? 'unstar.view' : 'star.view';
        var promise = self.subsonicRequest(partialUrl, {
            params: {
                id: item.id
            }
        }).then(function () {
            return ! item.starred;
        });
        return promise;
    }

    function addToJukebox(song) {
        if (globals.settings.Debug) { console.log("Load Jukebox"); }
        var promise = self.subsonicRequest('jukeboxControl.view', {
            params: {
                action: 'set',
                id: song.id
            }
        }).then(function () {
            self.sendToJukebox('start');
        });
        return promise;
    }

    function sendToJukebox(action) {
        if (globals.settings.Debug) { console.log("Send Jukebox " + action); }
        var promise = self.subsonicRequest('jukeboxControl.view', {
            params: {
                action: action
            }
        })
        return promise;
    }
}
