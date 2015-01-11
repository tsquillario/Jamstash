/**
* jamstash.archive.service Module
*
* Access Archive.org
*/
angular.module('jamstash.archive.service', ['jamstash.settings', 'jamstash.model', 'jamstash.notifications',
    'jamstash.player.service'])

.factory('archive', ['$rootScope', '$http', '$q', '$sce', 'globals', 'model', 'utils', 'map', 'notifications', 'player',
    function($rootScope, $http, $q, $sce, globals, model, utils, map, notifications, player) {
    'use strict';

    var index = { shortcuts: [], artists: [] };
    var content = {
        artist: [],
        album: [],
        song: [],
        breadcrumb: [],
        selectedArtist: null,
        selectedAlbum: null,
        selectedGenre: null,
        selectedArchiveAlbumSort: "date desc"
    };
    var offset = 0;

    var mapAlbum = function (data) {
        var song = data;
        var coverartthumb, coverartfull, starred, title, album, publisher, avg_rating, downloads, identifier, source, date;
        var url = globals.archiveUrl + 'details/' + song.identifier;
        coverartthumb = 'images/albumdefault_50.jpg';
        coverartfull = 'images/albumdefault_160.jpg';
        if (parseInt(song.avg_rating) == 5) { starred = true; } else { starred = false; }
        if (typeof song.title == 'undefined') { title = '&nbsp;'; } else { title = song.title.toString(); }
        if (typeof song.identifier == 'undefined') { identifier = '&nbsp;'; } else { identifier = song.identifier.toString(); }
        if (typeof song.collection[0] == 'undefined') { album = '&nbsp;'; } else { album = song.collection[0].toString(); }
        if (typeof song.source == 'undefined') { source = '&nbsp;'; } else { source = song.source.toString(); }
        if (typeof song.date == 'undefined') { date = '&nbsp;'; } else { date = song.date.toString(); }
        if (typeof song.publisher == 'undefined') { publisher = '&nbsp;'; } else { publisher = song.publisher.toString(); }
        if (typeof song.avg_rating == 'undefined') { avg_rating = '&nbsp;'; } else { avg_rating = song.avg_rating.toString(); }
        if (typeof song.downloads == 'undefined') { downloads = '&nbsp;'; } else { downloads = song.downloads.toString(); }

        //var description = '<b>Details</b><br />';
        var description = '<b>Source</b>: ' + source + '<br />';
        description += '<b>Date</b>: ' + date + '<br />';
        description += '<b>Transferer</b>: ' + publisher + '<br />';
        description += '<b>Rating</b>: ' + avg_rating + '<br />';
        description += '<b>Downloads</b>: ' + downloads + '<br />';
        return new model.Album(identifier, null, title, album, '', coverartthumb, coverartfull, $.format.date(new Date(song.publicdate), "yyyy-MM-dd h:mm a"), starred, $sce.trustAsHtml(description), url);
    };
    var mapSong = function (key, song, server, dir, identifier, coverart) {
        var url, time, track, title, rating, starred, contenttype, suffix;
        var specs = '';
        if (song.format == 'VBR MP3') {
            url = 'http://' + server + dir + key;
            if (typeof song.bitrate == 'undefined' || typeof song.format == 'undefined') { specs = '&nbsp;'; } else { specs = song.bitrate + 'kbps, ' + song.format.toLowerCase(); }
            if (typeof song.track == 'undefined') { track = '&nbsp;'; } else { track = song.track; }
            if (typeof song.title == 'undefined') { title = '&nbsp;'; } else { title = song.title; }
            if (typeof song.length == 'undefined') { time = '&nbsp;'; } else { time = utils.timeToSeconds(song.length); }
            return new model.Song(song.md5, identifier, song.track, title, song.creator, '', song.album, '', coverart, coverart, time, '', '', 'mp3', specs, url, 0, '');
        }
    };

    return {
        getArtists: function (query) {
            var deferred = $q.defer();
            if (globals.settings.Debug) { console.log("LOAD ARCHIVE.ORG COLLECTIONS"); }
            var url = globals.archiveUrl + 'advancedsearch.php?q=';
            if (query !== '') {
                //url += 'collection:(' + collection + ') AND mediatype:(collection) AND identifier:(' + query + ')';
                url += 'mediatype:(collection) AND identifier:(' + query + ')';
            } else {
                url += 'collection:(collection)';
            }
            url += '&fl[]=identifier&sort[]=&sort[]=&sort[]=&rows=50&page=1&output=json';
            $.ajax({
                url: url,
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: globals.settings.Timeout,
                success: function (data) {
                    if (data.response.docs.length > 0) {
                        var items = data.response.docs;
                        //alert(JSON.stringify(data["response"]));
                        content.artist = [];
                        angular.forEach(items, function (item, key) {
                            content.artist.push(item.identifier);
                        });
                    } else {
                        notifications.updateMessage("Sorry :(", true);
                    }
                    deferred.resolve(content);
                }
            });
            return deferred.promise;
        },
        getAlbums: function (name, filter) {
            var deferred = $q.defer();
            if (name) {
                var url = globals.archiveUrl + 'advancedsearch.php?q=';
                if (name !== '') {
                    content.selectedArtist = name;
                    url += 'collection:(' + name + ') AND format:(MP3)';
                } else if (content.selectedArtist) {
                    name = content.selectedArtist;
                    url += 'collection:(' + content.selectedArtist + ') AND format:(MP3)';
                } else {
                    url += 'collection:(' + name + ')';
                }
                content.breadcrumb = [];
                content.breadcrumb.push({ 'type': 'artist', 'id': name, 'name': name });

                if (filter.Source) {
                    url += ' AND source:(' + filter.Source + ')';
                }
                if (filter.Year) {
                    if (parseInt(filter.Year)) {
                        url += ' AND year:(' + filter.Year + ')';
                    }
                }
                if (filter.Description) {
                    url += ' AND description:(' + filter.Description + ')';
                }
                if (content.selectedArtist) {
                    url += '&sort[]=' + globals.settings.DefaultArchiveAlbumSort;
                }
                url += '&fl[]=avg_rating,collection,date,description,downloads,headerImage,identifier,publisher,publicdate,source,subject,title,year';
                url += '&rows=50&page=1&output=json';
                $.ajax({
                    url: url,
                    method: 'GET',
                    dataType: globals.settings.Protocol,
                    timeout: globals.settings.Timeout,
                    success: function (data) {
                        var items = [];
                        if (data.response.docs.length > 0) {
                            items = data.response.docs;
                            //alert(JSON.stringify(data["response"]));
                            content.album = [];
                            content.song = [];
                            angular.forEach(items, function (item, key) {
                                content.album.push(mapAlbum(item));
                            });
                            notifications.updateMessage(content.album.length + ' Items Returned', true);
                        } else {
                            notifications.updateMessage("Sorry :(", true);
                        }
                        deferred.resolve(content);
                    },
                    error: function () {
                        notifications.updateMessage('Archive.org service down :(');
                    }
                });
            } else {
                deferred.resolve(content);
            }
            return deferred.promise;
        },
        getSongs: function (id, action) {
            var deferred = $q.defer();
            if (id) {
                content.selectedAlbum = id;
                if (content.breadcrumb.length > 0) { content.breadcrumb.splice(1, (content.breadcrumb.length - 1)); }
                content.breadcrumb.push({ 'type': 'album', 'id': id, 'name': id });
                var url = globals.archiveUrl + 'details/' + id + '?output=json';
                $.ajax({
                    url: url,
                    method: 'GET',
                    dataType: globals.settings.Protocol,
                    timeout: globals.settings.Timeout,
                    success: function (data) {
                        var coverart = '';
                        var server = data.server;
                        var dir = data.dir;
                        var identifier = data.metadata.identifier[0];
                        if (typeof data.misc.image != 'undefined') {
                            coverart = data.misc.image;
                        }
                        var items = data.files;
                        if (action == 'add') {
                            angular.forEach(items, function (item, key) {
                                var song = mapSong(key, item, server, dir, identifier, coverart);
                                if (song) {
                                    player.queue.push(song);
                                }
                            });
                            notifications.updateMessage(Object.keys(items).length + ' Song(s) Added to Queue', true);
                        } else if (action == 'play') {
                            player.queue = [];
                            angular.forEach(items, function (item, key) {
                                var song = mapSong(key, item, server, dir, identifier, coverart);
                                if (song) {
                                    player.queue.push(song);
                                }
                            });
                            var next = player.queue[0];
                            player.play(next);
                            notifications.updateMessage(Object.keys(items).length + ' Song(s) Added to Queue', true);
                        } else {
                            content.album = [];
                            content.song = [];
                            angular.forEach(items, function (item, key) {
                                var song = mapSong(key, item, server, dir, identifier, coverart);
                                if (song) {
                                    content.song.push(song);
                                }
                            });
                        }
                        deferred.resolve(content);
                    }
                });
            } else {
                deferred.resolve(content);
            }
            return deferred.promise;
        }
    };
}]);
