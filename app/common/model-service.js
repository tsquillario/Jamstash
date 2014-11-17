/**
* jamstash.model Module
*
* Stores the Index, Artist, Album and Song model. Provides a mapping service that converts between subsonic's
* representation and ours.
*/
angular.module('jamstash.model', ['jamstash.utils'])

.service('model', ['utils', function(utils){
    'use strict';

    this.Index = function (name, artist) {
        this.name = name;
        this.artist = artist;
    };
    this.Artist = function (id, name) {
        this.id = id;
        this.name = name;
    };
    this.Album = function (id, parentid, name, artist, artistId, coverartthumb, coverartfull, date, starred, description, url, type) {
        this.id = id;
        this.parentid = parentid;
        this.name = name;
        this.artist = artist;
        this.artistId = artistId;
        this.coverartthumb = coverartthumb;
        this.coverartfull = coverartfull;
        this.date = date;
        this.starred = starred;
        this.description = description;
        this.url = url;
        this.type = type;
    };
    this.Song = function (id, parentid, track, name, artist, artistId, album, albumId, coverartthumb, coverartfull, duration, rating, starred, suffix, specs, url, position, description) {
        this.id = id;
        this.parentid = parentid;
        this.track = track;
        this.name = name;
        this.artist = artist;
        this.artistId = artistId;
        this.album = album;
        this.albumId = albumId;
        this.coverartthumb = coverartthumb;
        this.coverartfull = coverartfull;
        this.duration = duration;
        this.time = duration === '' ? '00:00' : utils.secondsToTime(duration);
        this.rating = rating;
        this.starred = starred;
        this.suffix = suffix;
        this.specs = specs;
        this.url = url;
        this.position = position;
        this.selected = false;
        this.playing = false;
        this.description = description;
        this.displayName = this.name + " - " + this.album + " - " + this.artist;
    };
}])

.service('map', ['$http', 'globals', 'utils', 'model', function($http, globals, utils, model){
    'use strict';

    this.mapArtist = function (data) {
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
    this.mapIndex = function (data) {
        var name, id = '';
        if (typeof data.id !== 'undefined') { id = data.id; }
        if (typeof data.name !== 'undefined') { name = data.name.toString(); }
        return new model.Artist(id, name);
    };
    this.mapAlbum = function (data) {
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
    this.mapSong = function (data) {
        var song = data;
        var url, title, artist, track, rating, starred, contenttype, suffix, description;
        var specs = '', coverartthumb = '', coverartfull = '';
        if (typeof song.coverArt != 'undefined') {
            coverartthumb = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=30&id=' + song.coverArt;
            coverartfull = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&id=' + song.coverArt;
        } else {
            coverartthumb = 'images/albumdefault_60.jpg';
            coverartfull = 'images/albumdefault_160.jpg';
        }
        if (typeof song.description == 'undefined') { description = ''; } else { description = song.description; }
        if (typeof song.artist == 'undefined') { artist = '&nbsp;'; } else { artist = song.artist.toString(); }
        if (typeof song.title == 'undefined') { title = '&nbsp;'; } else { title = song.title.toString(); }
        if (typeof song.track == 'undefined') { track = '&nbsp;'; } else { track = song.track.toString(); }
        if (typeof song.starred !== 'undefined') { starred = true; } else { starred = false; }
        if (song.bitRate !== undefined) { specs += song.bitRate + ' Kbps'; }
        if (song.transcodedSuffix !== undefined) { specs += ', transcoding:' + song.suffix + ' > ' + song.transcodedSuffix; } else { specs += ', ' + song.suffix; }
        if (song.transcodedSuffix !== undefined) { suffix = song.transcodedSuffix; } else { suffix = song.suffix; }
        if (suffix == 'ogg') { suffix = 'oga'; }
        var salt = Math.floor(Math.random() * 100000);
        url = globals.BaseURL() + '/stream.view?' + globals.BaseParams() + '&id=' + song.id + '&salt=' + salt;
        return new model.Song(song.id, song.parent, track, title, artist, song.artistId, song.album, song.albumId, coverartthumb, coverartfull, song.duration, song.userRating, starred, suffix, specs, url, 0, description);
    };
    this.mapPlaylist = function (data) {
        return new model.Artist(data.id, data.name);
    };
    this.mapPodcast = function (data) {
        var song = data;
        var url, track, rating, starred, contenttype, suffix, description, artist, album, title;
        var specs = '', coverartthumb = '', coverartfull = '';
        if (typeof song.coverArt != 'undefined') {
            coverartthumb = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=60&id=' + song.coverArt;
            coverartfull = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&id=' + song.coverArt;
        }
        if (typeof song.album == 'undefined') { album = '&nbsp;'; } else { album = song.album.toString(); }
        if (typeof song.artist == 'undefined') { artist = '&nbsp;'; } else { artist = song.artist.toString(); }
        if (typeof song.title == 'undefined') { title = '&nbsp;'; } else { title = song.title.toString(); }
        if (typeof song.description == 'undefined') { description = ''; } else { description = song.description; }
        if (typeof song.track == 'undefined') { track = '&nbsp;'; } else { track = song.track.toString(); }
        if (typeof song.starred !== 'undefined') { starred = true; } else { starred = false; }
        if (song.bitRate !== undefined) { specs += song.bitRate + ' Kbps'; }
        if (song.transcodedSuffix !== undefined) { specs += ', transcoding:' + song.suffix + ' > ' + song.transcodedSuffix; } else { specs += ', ' + song.suffix; }
        if (song.transcodedSuffix !== undefined) { suffix = song.transcodedSuffix; } else { suffix = song.suffix; }
        if (suffix == 'ogg') { suffix = 'oga'; }
        var salt = Math.floor(Math.random() * 100000);
        url = globals.BaseURL() + '/stream.view?' + globals.BaseParams() + '&id=' + song.streamId + '&salt=' + salt;
        return new model.Song(song.streamId, song.parent, track, title, artist, song.artistId, album, song.albumId, coverartthumb, coverartfull, song.duration, song.userRating, starred, suffix, specs, url, 0, description);
    };
}]);
