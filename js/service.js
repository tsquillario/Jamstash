JamStash.service('model', function () {
    // Figure out how to move this, circular dependency with utils
    secondsToTime = function (secs) {
        // secs = 4729
        var times = new Array(3600, 60, 1);
        var time = '';
        var tmp;
        for (var i = 0; i < times.length; i++) {
            tmp = Math.floor(secs / times[i]);
            // 0: 4729/3600 = 1
            // 1: 1129/60 = 18
            // 2: 49/1 = 49
            if (tmp < 1) {
                tmp = '00';
            }
            else if (tmp < 10) {
                tmp = '0' + tmp;
            }
            if (i === 0 && tmp == '00') {
            } else {
                time += tmp;
                if (i < 2) {
                    time += ':';
                }
            }
            secs = secs % times[i];
        }
        return time;
    };
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
        this.time = duration === '' ? '00:00' : secondsToTime(duration);
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
});

JamStash.service('globals', function () {
    this.SearchTypes = [
        { id: "song", name: "Song" },
        { id: "album", name: "Album" },
        { id: "artist", name: "Artist" }
    ];
    this.Layouts = [
        { id: "grid", name: "Grid" },
        { id: "list", name: "List" }
    ];
    this.AlbumSorts = [
        { id: "default", name: "Default Sort" },
        { id: "artist", name: "Artist" },
        { id: "album", name: "Album" },
        { id: "track", name: "Track" },
        { id: "createdate desc", name: "Date Added" }
    ];
    this.settings = {
        // Subsonic
        /* Demo Server
        Username: "android-guest"),
        Password: "guest"),
        Server: "http://subsonic.org/demo"),
        */
        Url: "http://Jamstash.com/beta/#/archive/",
        Username: "",
        Password: "",
        Server: "",
        Timeout: 20000,
        Protocol: "jsonp",
        ApplicationName: "Jamstash",
        ApiVersion: "1.6.0",
        AutoPlaylists: "",
        AutoPlaylistSize: 25,
        AutoAlbumSize: 15,
        // General
        HideAZ: false,
        ScrollTitle: true,
        NotificationSong: true,
        NotificationNowPlaying: false,
        SaveTrackPosition: false,
        ForceFlash: false,
        Theme: "Default",
        DefaultLibraryLayout: this.Layouts[0],
        DefaultSearchType: this.SearchTypes[0],
        DefaultAlbumSort: this.AlbumSorts[0],
        DefaultArchiveAlbumSort: "date desc",
		Jukebox: false,
		AutoPlay: false,
        LoopQueue: false,
        Repeat: false,
        Debug: false
    };
    this.SavedCollections = [];
    this.SavedGenres = [];
    this.Player1 = '#playdeck_1';
    this.archiveUrl = 'https://archive.org/';

    this.BaseURL = function () { return this.settings.Server + '/rest'; };
    this.BaseParams = function () { return 'u=' + this.settings.Username + '&p=' + this.settings.Password + '&f=' + this.settings.Protocol + '&v=' + this.settings.ApiVersion + '&c=' + this.settings.ApplicationName; };
});
JamStash.service('notifications', function ($rootScope, globals) {
    var msgIndex = 1;
    this.updateMessage = function (msg, autohide) {
        if (msg != '') {
            var id = msgIndex;
            $('#messages').append('<span id=\"msg_' + id + '\" class="message">' + msg + '</span>');
            $('#messages').fadeIn();
            $("#messages").scrollTo('100%');
            var el = '#msg_' + id;
            if (autohide) {
                setTimeout(function () {
                    $(el).fadeOut(function () { $(this).remove(); });
                }, globals.settings.Timeout);
            } else {
                $(el).click(function () {
                    $(el).fadeOut(function () { $(this).remove(); });
                    return false;
                });
            }
            msgIndex++;
        }
    }
    this.requestPermissionIfRequired = function () {
        if (window.Notify.isSupported() && window.Notify.needsPermission()) {
            window.Notify.requestPermission();
        }
    }
    this.hasNotificationPermission = function () {
        return (window.Notify.needsPermission() === false);
    }
    this.hasNotificationSupport = function () {
        return window.Notify.isSupported();
    }
    var notifications = new Array();

    this.showNotification = function (pic, title, text, type, bind) {
        if (this.hasNotificationPermission()) {
            //closeAllNotifications()
            var settings = {}
            if (bind = '#NextTrack') {
                settings.notifyClick = function () {
                    $rootScope.nextTrack();
                    this.close();
                };
            }
            if (type == 'text') {
                settings.body = text;
                settings.icon = pic;
            } else if (type == 'html') {
                settings.body = text;
            }
            var notification = new Notify(title, settings);
            notifications.push(notification);
            setTimeout(function (notWin) {
                notWin.close();
            }, globals.settings.Timeout, notification);
            notification.show();
        } else {
            console.log("showNotification: No Permission");
        }
    }
    this.closeAllNotifications = function () {
        for (notification in notifications) {
            notifications[notification].close();
        }
    }
});

// Directives
JamStash.directive('sortable', function () {
    return {
        link: function (scope, elm, attrs) {
            elm.sortable({
                start: scope.dragStart,
                update: scope.dragEnd
            });
            elm.disableSelection();
        }
    };
});
/*
JamStash.directive('split', function () {
    return {
        link: function (scope, elm, attrs) {
            elm.splitPane();
        }
    };
});
*/
JamStash.directive('fancybox', function ($compile) {
    return {
        restrict: 'A',
        replace: false,
        link: function($scope, element, attrs) {
            $scope.fancyboxOpen = function() {
                var el = angular.element(element.html()),
                compiled = $compile(el);
                $.fancybox.open(el);
                compiled($scope);
            };
            $scope.fancyboxOpenUrl = function () {
                var el = angular.element(element.html()),
                compiled = $compile(el);
                $.fancybox.open(el);
                compiled($scope);
            };
        }
    };
});
JamStash.directive('songpreview', function ($compile, subsonic) {
    return {
        restrict: 'E',
        templateUrl: 'js/partials/songs.html',
        replace: false,
        // pass these two names from attrs into the template scope
        scope: {
            song: '@'
        },
        link: function (scope, element, attrs) {
            subsonic.getSongTemplate(function (data) {
                scope.song = data;
                //var el = angular.element(element.html()),
                //var el = element.html(),
                //compiled = $compile(el);
                $.fancybox.open(element);
                //compiled($scope);
            });
        }
    };
});
JamStash.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
});
JamStash.directive('ngEnter', function () {
    return {
        scope: { onEnter: '&' },
        link: function (scope, element) {
            console.log(scope);
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.onEnter();
                    scope.$apply();
                }
            });
        }
    }
});
JamStash.directive('ngDownload', function ($compile) {
    return {
        restrict: 'E',
        scope: { data: '=' },
        link: function (scope, elm, attrs) {
            function getUrl() {
                return URL.createObjectURL(new Blob([JSON.stringify(scope.data)], { type: "application/json" }));
            }

            elm.append($compile(
                    '<a class="button" download="backup.json"' +
                    'href="' + getUrl() + '">' +
                    'Download' +
                    '</a>'
            )(scope));

            scope.$watch(scope.data, function () {
                elm.children()[0].href = getUrl();
            });
        }
    };
});
JamStash.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
});
JamStash.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});


/* Factory */
JamStash.factory('json', function ($http) { // Deferred loading
    return {
        getCollections: function (callback) {
            $http.get('js/json_collections.js').success(callback);
        },
        getChangeLog: function (callback) {
            $http.get('js/json_changelog.js').success(callback);
        }
    };
});
/*
JamStash.factory('template', function ($http, $compile, $http, $templateCache) { // Deferred loading
    return {
        getCollections: function (callback) {
            $http.get('js/json_collections.js', { cache: $templateCache }).success(callback);
        },
        getChangeLog: function (callback) {
            $http.get('js/json_changelog.js', { cache: $templateCache }).success(callback);
        },
        getSongs: function (callback) {
            templateUrl = 'js/partials/songs.html';
            $http.get(templateUrl, { cache: $templateCache }).success(callback);
        }
    };
});
*/

JamStash.service('map', function ($http, globals, utils, model) {
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
});

JamStash.factory('archive', function ($rootScope, $http, $q, $sce, globals, model, utils, map, notifications) {
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
        var coverartthumb, coverartfull, starred, title, album, publisher, avg_rating, downloads, identifier;
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
                        items = data.response.docs;
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
                            notifications.updateMessage(content.album.length, true);
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
                                    $rootScope.queue.push(song);
                                }
                            });
                            notifications.updateMessage(Object.keys(items).length + ' Song(s) Added to Queue', true);
                        } else if (action == 'play') {
                            $rootScope.queue = [];
                            angular.forEach(items, function (item, key) {
                                var song = mapSong(key, item, server, dir, identifier, coverart);
                                if (song) {
                                    $rootScope.queue.push(song);
                                }
                            });
                            var next = $rootScope.queue[0];
                            $rootScope.playSong(false, next);
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
});

JamStash.factory('json', function ($http, $q) { // Deferred loading
    return {
        getCollections: function (callback) {
            //$http.get('js/json_collections.js').success(callback);
            var deferred = $q.defer();
            var collections = ['etree', 'dnalounge'];
            deferred.resolve(collections);
            return deferred.promise;
        },
        getChangeLog: function (callback) {
            $http.get('js/json_changelog.js').success(callback);
        }
    }
});

/* Filters */
JamStash.filter('capitalize', function () {
    return function (input, scope) {
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
});
JamStash.filter('musicfolder', function () {
    return function (items, scope) {
        return items.slice(1, items.length);
    };
});
JamStash.filter('capitalize', function () {
    return function (input, scope) {
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    }
});


