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
JamStash.directive('layout', function () {
    return {

        link: function (scope, elm, attrs) {

            var pageLayoutOptions = {
                name: 'pageLayout', // only for debugging
                resizeWithWindowDelay: 250, 	// delay calling resizeAll when window is *still* resizing
                //,	resizeWithWindowMaxDelay: 2000	// force resize every XX ms while window is being resized
                //center__children: {},
                //north__paneSelector: "#container",
                center__paneSelector: "#container",
                south__paneSelector: "#QueuePreview",
                south__resizable: false, // No resize
                //south__closable: false, // No close handle
                //south__spacing_open: 0, // No resize bar
                south__size: 145,
                south__initClosed: true,
                south__minWidth: 145,
                south__maxWidth: 145
            };

            var layoutThreeCol = {
                east__size: 0.42,
                east__minSize: 400,
                east__maxSize: 0.5, // 50% of layout width
                east__initClosed: false,
                east__initHidden: false,
                //center__size: 'auto',
                center__minWidth: 0.38,
                center__initClosed: false,
                center__initHidden: false,
                west__size: 0.2,
                west__minSize: 200,
                west__initClosed: false,
                west__initHidden: false,
                //stateManagement__enabled: true, // automatic cookie load & save enabled by default
                showDebugMessages: true // log and/or display messages from debugging & testing code
                //applyDefaultStyles: true
            };

            var layoutTwoCol = {
                center__size: 0.8,
                center__minSize: 400,
                center__maxSize: 0.5, // 50% of layout width
                center__initClosed: false,
                center__initHidden: false,
                west__size: 0.2,
                west__minSize: 200,
                west__initClosed: false,
                west__initHidden: false,
                //stateManagement__enabled: true, // automatic cookie load & save enabled by default
                showDebugMessages: true // log and/or display messages from debugging & testing code
                //applyDefaultStyles: true
            };

            scope.$watch(attrs.state, function (state) {
                if (state == 1) {
                    var layout = elm.layout(pageLayoutOptions);
                }
                if (state == 2) {
                    var layout = elm.layout(layoutTwoCol);
                    //scope.layout.sizePane('east', 120);
                    //scope.layout.show('west');
                    //scope.layout.show('south');
                } else if (state == 3) {
                    var layout = elm.layout(layoutThreeCol);
                    //scope.layout.sizePane('east', 60);
                    //scope.layout.hide('west');
                    //scope.layout.hide('south');
                }
                scope.layout = layout;
            });
        }
    };
});
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
            /*
            //elm.first().resizable({
            $('#SubsonicAlbums > div:first').resizable({
                handles: 'e',
                minWidth: '100',
                maxWidth: '400',
                resize: function () {
                    alert('foo');
                    var remainingSpace = $(this).parent().width() - $(this).outerWidth();
                    var divTwo = $(this).next();
                    var divTwoWidth = remainingSpace - (divTwo.outerWidth() - divTwo.width());
                    divTwo.css('width', divTwoWidth + 'px');
                }
            });
            */
            /*
            scope.$watch(attrs.state, function (state) {
                if (state == 1) {
                    var layout = elm.layout(pageLayoutOptions);
                }
                if (state == 2) {
                    var layout = elm.layout(layoutTwoCol);
                    //scope.layout.sizePane('east', 120);
                    //scope.layout.show('west');
                    //scope.layout.show('south');
                } else if (state == 3) {
                    var layout = elm.layout(layoutThreeCol);
                    //scope.layout.sizePane('east', 60);
                    //scope.layout.hide('west');
                    //scope.layout.hide('south');
                }
                scope.layout = layout;
            });
            */
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
JamStash.factory('subsonic', function ($http, globals, utils) {
    return {
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
                            song.push(utils.mapSong(item));
                        }
                    });
                    callback(song);
                }
            });
        }
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


