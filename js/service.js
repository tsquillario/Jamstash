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
        AutoPlay: false,
        LoopQueue: false,
        Repeat: false,
        Debug: false
    };
    this.SavedCollections = [];
    this.SavedGenres = [];
    this.Player1 = '#playdeck_1';

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
JamStash.directive('split', function () {
    return {
        link: function (scope, elm, attrs) {
            elm.splitPane();
        }
    };
});
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
            coverartthumb = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=60&id=' + song.coverArt;
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

JamStash.factory('subsonic', function ($rootScope, $http, $q, globals, utils, map, notifications) {
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
    var showIndex = false;
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
        showIndex: showIndex,
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
                                $rootScope.playSong(false, next);
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
                                    if ($scope.SelectedAlbumSort.id != "default") {
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
        getRandomSongs: function (action, genre, folder) {
            var deferred = $q.defer();
            if (globals.settings.Debug) { console.log('action:' + action + ', genre:' + genre + ', folder:' + folder); }
            var size = globals.settings.AutoPlaylistSize;
            content.selectedPlaylist = null;
            if (typeof folder == 'number') {
                content.selectedAutoPlaylist = folder;
            } else if (genre !== '') {
                content.selectedAutoPlaylist = genre;
            } else {
                content.selectedAutoPlaylist = 'random';
            }
            var genreParams = '';
            if (genre !== '' && genre != 'Random') {
                genreParams = '&genre=' + genre;
            }
            folderParams = '';
            if (typeof folder == 'number' && folder !== '' && folder != 'all') {
                //alert(folder);
                folderParams = '&musicFolderId=' + folder;
            } else if (typeof $rootScope.SelectedMusicFolder.id != 'undefined' && $rootScope.SelectedMusicFolder.id >= 0) {
                //alert($rootScope.SelectedMusicFolder.id);
                folderParams = '&musicFolderId=' + $rootScope.SelectedMusicFolder.id;
            }
            $.ajax({
                url: globals.BaseURL() + '/getRandomSongs.view?' + globals.BaseParams() + '&size=' + size + genreParams + folderParams,
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: globals.settings.Timeout,
                success: function (data) {
                    if (typeof data["subsonic-response"].randomSongs.song != 'undefined') {
                        var items = [];
                        if (data["subsonic-response"].randomSongs.song.length > 0) {
                            items = data["subsonic-response"].randomSongs.song;
                        } else {
                            items[0] = data["subsonic-response"].randomSongs.song;
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
                            $rootScope.playSong(false, next);
                            notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                        } else {
                            content.album = [];
                            content.song = [];
                            angular.forEach(items, function (item, key) {
                                content.song.push(map.mapSong(item));
                            });
                        }
                    }
                    deferred.resolve(content);
                }
            });
            return deferred.promise;
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
                                $rootScope.queue.push(map.mapSong(item));
                            });
                            notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                        } else if (action == 'play') {
                            $rootScope.queue = [];
                            angular.forEach(items, function (item, key) {
                                $rootScope.queue.push(map.mapSong(item));
                            });
                            var next = $rootScope.queue[0];
                            $rootScope.playSong(false, next);
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
        getStarred: function (action, type) {
            var deferred = $q.defer();
            var size = globals.settings.AutoPlaylistSize;
            content.selectedPlaylist = null;
            content.selectedAutoPlaylist = 'starred';
            $.ajax({
                url: globals.BaseURL() + '/getStarred.view?' + globals.BaseParams() + '&size=' + size,
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: globals.settings.Timeout,
                success: function (data) {
                    if (typeof data["subsonic-response"].starred !== 'undefined') {
                        var items = [];
                        switch (type) {
                            case 'artist':
                                if (typeof data["subsonic-response"].starred.artist !== 'undefined') {
                                    if (data["subsonic-response"].starred.artist.length > 0) {
                                        items = data["subsonic-response"].starred.artist;
                                    } else {
                                        items[0] = data["subsonic-response"].starred.artist;
                                    }
                                }
                                break;
                            case 'album':
                                if (typeof data["subsonic-response"].starred.album !== 'undefined') {
                                    if (data["subsonic-response"].starred.album.length > 0) {
                                        items = data["subsonic-response"].starred.album;
                                    } else {
                                        items[0] = data["subsonic-response"].starred.album;
                                    }
                                }
                                break;
                            case 'song':
                                if (typeof data["subsonic-response"].starred.song !== 'undefined') {
                                    if (data["subsonic-response"].starred.song.length > 0) {
                                        items = data["subsonic-response"].starred.song;
                                    } else {
                                        items[0] = data["subsonic-response"].starred.song;
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
                                        $rootScope.playSong(false, next);
                                        notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                                    } else {
                                        content.album = [];
                                        content.song = [];
                                        angular.forEach(items, function (item, key) {
                                            content.song.push(map.mapSong(item));
                                        });
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    deferred.resolve(content);
                }
            });
            return deferred.promise;
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
                                $rootScope.playSong(false, next);
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
        }
        // End subsonic
    };
});

JamStash.factory('json', function ($http) { // Deferred loading
    return {
        getCollections: function (callback) {
            $http.get('js/json_collections.js').success(callback);
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


