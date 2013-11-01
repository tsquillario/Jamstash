JamStash.controller('AppCtrl',
function AppCtrl($scope, $rootScope, $document, $location, utils, globals, model, notifications, player) {
    $rootScope.settings = globals.settings;
    $rootScope.song = [];
    $rootScope.queue = [];
    $rootScope.playingSong;
    $rootScope.MusicFolders = [];
    $rootScope.Genres = [];
    $rootScope.selectedPlaylist = "";
    $rootScope.selectedAutoPlaylist = "";
    $rootScope.selectedMusicFolder = "";
    $rootScope.unity;

    $rootScope.$watch("selectedMusicFolder", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            if (typeof newValue != 'undefined' && newValue != null) {
                utils.setValue('MusicFolders', angular.toJson(newValue), true);
                //$scope.getArtists(newValue.id);
            } else {
                utils.setValue('MusicFolders', null, true);
                //$scope.getArtists();
            }
        }
    });
    /*
    $scope.playSong = function (loadonly, data) { 
    $scope.$apply(function () {
    $rootScope.playSong(loadonly, data);
    });
    }
    */

    // Reads cookies and sets globals.settings values
    $scope.loadSettings = function () {
        if (utils.getValue('Settings')) {
            $.each(utils.getValue('Settings'), function (k, v) {
                if (v == 'false') { v = false; }
                if (v == 'true') { v = true; }
                globals.settings[k] = v;
            });
        }
        if (utils.getValue("SavedCollections")) { globals.SavedCollections = utils.getValue("SavedCollections").split(","); }
        if (utils.getValue("SavedGenres")) { globals.SavedGenres = utils.getValue("SavedGenres").split(","); }
        if (globals.settings.Debug) { console.log('Settings: ' + JSON.stringify(globals.settings, null, 2)); }
    }
    $scope.toggleSetting = function (setting) {
        var id = setting;
        if (globals.settings[id]) {
            globals.settings[id] = false;
        } else {
            globals.settings[id] = true;
        }
        notifications.updateMessage(setting + ' : ' + globals.settings[id], true);
    }

    $.ajaxSetup({
        'beforeSend': function () {
            $("#loading").show();
        },
        'complete': function () {
            $("#loading").hide();
        }
    });


    $("a.coverartfancy").live("click", function () {
        $("a.coverartfancy").fancybox({
            beforeShow: function () {
                //this.title = $('#songdetails_artist').html();
            },
            afterLoad: function () {
                //this.inner.prepend( '<h1>1. My custom title</h1>' );
                //this.content = '<h1>2. My custom title</h1>';
            },
            hideOnContentClick: true,
            type: 'image',
            openEffect: 'none',
            closeEffect: 'none'
        });
    });

    var submenu_active = false;
    $('div.submenu').mouseenter(function () {
        submenu_active = true;
    });
    $('div.submenu').mouseleave(function () {
        submenu_active = false;
        $('div.submenu').hide();
        //setTimeout(function () { if (submenu_active == false) $('div.submenu').stop().fadeOut(); }, 400);
    });
    $scope.toggleSubmenu = function (menu, pl, pos, margin) {
        var submenu = $(menu);
        if (submenu.css('display') !== 'none') {
            submenu.fadeOut();
        } else {
            var el = $(pl);
            off = el.offset();
            width = el.width();
            height = el.height();
            switch (pos) {
                case 'right':
                    //show the menu to the right of placeholder
                    submenu.css({ "left": (off.left + margin) + "px", "top": (off.top) + "px" }).fadeIn(400);
                    break;
                case 'left':
                    //show the menu to the right of placeholder
                    submenu.css({ "left": (off.left - margin) + "px", "top": (off.top) + "px" }).fadeIn(400);
                    break;
            }
            setTimeout(function () { if (submenu_active == false) $('div.submenu').stop().fadeOut(); }, 10000);
        }
    }

    $("a.coverartfancy").fancybox({
        beforeShow: function () {
            //this.title = $('#songdetails_artist').html();
        },
        afterLoad: function () {
            //this.inner.prepend( '<h1>1. My custom title</h1>' );
            //this.content = '<h1>2. My custom title</h1>';
        },
        hideOnContentClick: true,
        type: 'image',
        openEffect: 'none',
        closeEffect: 'none'
    });

    $('#action_Welcome').fancybox({
        openEffect: 'none',
        closeEffect: 'none'
    });

    $('#audiocontainer .scrubber').mouseover(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '8px' });
    });
    $('#audiocontainer .scrubber').mouseout(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '4px' });
    });

    $('.message').live('click', function () { $(this).remove(); });

    // JQuery UI Sortable - Drag and drop sorting
    var fixHelper = function (e, ui) {
        ui.children().each(function () {
            $(this).width($(this).width());
        });
        return ui;
    };
    $("#QueuePreview ul.songlist").sortable({
        helper: fixHelper
    });

    // Sway.fm Unity Plugin
    $rootScope.unity = UnityMusicShim();
    $rootScope.unity.setSupports({
        playpause: true,
        next: true,
        previous: true
    });
    $rootScope.unity.setCallbackObject({
        pause: function () {
            if (globals.settings.Debug) { console.log("Unity: Recieved playpause command"); }
            player.playPauseSong();
        },
        next: function () {
            if (globals.settings.Debug) { console.log("Unity: Recieved next command"); }
            $rootScope.nextTrack();
        },
        previous: function () {
            if (globals.settings.Debug) { console.log("Unity: Recieved previous command"); }
            $rootScope.previousTrack();
        }
    });

    // JQuery Layout Plugin
    function resizePageLayout() {
        var pageLayout = $("body").data("layout");
        if (pageLayout) pageLayout.resizeAll();
    };

    //$( "#nav" ).tabs();
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

    // create the page-layout, which will ALSO create the tabs-wrapper child-layout
    var pageLayout = $("body").layout(pageLayoutOptions);

    $scope.layoutThreeCol = {
        east__size: .45,
        east__minSize: 400,
        east__maxSize: .5, // 50% of layout width
        east__initClosed: false,
        east__initHidden: false,
        //center__size: 'auto',
        center__minWidth: .35,
        center__initClosed: false,
        center__initHidden: false,
        west__size: .2,
        west__minSize: 200,
        west__initClosed: false,
        west__initHidden: false,
        //stateManagement__enabled: true, // automatic cookie load & save enabled by default
        showDebugMessages: true // log and/or display messages from debugging & testing code
        //applyDefaultStyles: true
    };

    $scope.layoutTwoCol = {
        center__size: .8,
        center__minSize: 400,
        center__maxSize: .5, // 50% of layout width
        center__initClosed: false,
        center__initHidden: false,
        west__size: .2,
        west__minSize: 200,
        west__initClosed: false,
        west__initHidden: false,
        //stateManagement__enabled: true, // automatic cookie load & save enabled by default
        showDebugMessages: true // log and/or display messages from debugging & testing code
        //applyDefaultStyles: true
    };

    // Global Functions
    window.onbeforeunload = function () {
        if (!self.settings.Debug()) {
            if (self.queue().length > 0) {
                return "You're about to end your session, are you sure?";
            }
        }
    }

    $document.keydown(function (e) {
        $scope.scrollToIndex(e);
    });
    $scope.scrollToIndex = function (e) {
        var source = e.target.id;
        if (source != 'Search' && source != 'Source' && source != 'Description' && source != 'ChatMsg' && source != 'AutoPlaylists') {
            var unicode = e.charCode ? e.charCode : e.keyCode;
            if (globals.settings.Debug) { console.log('Keycode Triggered: ' + unicode); }
            /*
            if (unicode == 49) {
            utils.changeTab('tabQueue');
            } else if (unicode == 50) {
            utils.changeTab('tabLibrary');
            } else if (unicode == 51) {
            utils.changeTab('tabArchive');
            } else if (unicode == 52) {
            utils.changeTab('tabPlaylists');
            } else if (unicode == 53) {
            utils.changeTab('tabPodcasts');
            } else if (unicode == 54) {
            utils.changeTab('tabSettings');
            }
            */
            if (unicode >= 65 && unicode <= 90 && $('#tabLibrary').is(':visible')) { // a-z
                var key = utils.findKeyForCode(unicode);
                if (key == 'x' || key == 'y' || key == 'z') {
                    key = 'x-z';
                }
                var el = '#' + key.toUpperCase();
                if ($(el).length > 0) {
                    $('#SubsonicArtists').stop().scrollTo(el, 400);
                }
            } else if (unicode == 39 || unicode == 176) { // right arrow
                $rootScope.nextTrack();
            } else if (unicode == 37 || unicode == 177) { // back arrow
                $rootScope.previousTrack();
            } else if (unicode == 32 || unicode == 179 || unicode == 0179) { // spacebar
                player.playPauseSong();
                return false;
            } else if (unicode == 36 && $('#tabLibrary').is(':visible')) { // home
                $('#SubsonicArtists').stop().scrollTo('#MusicFolders', 400);
            }
            if (unicode == 189) { // dash - volume down
                var volume = utils.getValue('Volume') ? parseFloat(utils.getValue('Volume')) : 1;
                if (volume <= 1 && volume > 0 && source == '') {
                    volume += -.1;
                    $(player1).jPlayer({
                        volume: volume
                    });
                    utils.setValue('Volume', volume, true);
                    //updateMessage('Volume: ' + Math.round(volume * 100) + '%');
                }
            }
            if (unicode == 187) { // equals - volume up
                var volume = utils.getValue('Volume') ? parseFloat(utils.getValue('Volume')) : 1;
                if (volume < 1 && volume >= 0 && source == '') {
                    volume += .1;
                    $(player1).jPlayer({
                        volume: volume
                    });
                    utils.setValue('Volume', volume, true);
                    //updateMessage('Volume: ' + Math.round(volume * 100) + '%');
                }
            }
        }
        return true;
    };
    $scope.scrollToIndexName = function (index) {
        var el = '#' + index;
        if ($(el).length > 0) {
            $('#SubsonicArtists').stop().scrollTo(el, 400);
        }
    };
    $scope.scrollToTop = function () {
        $('#Artists').stop().scrollTo('#auto', 400);
    }
    $scope.selectAll = function () {
        angular.forEach($rootScope.song, function (item, key) {
            $scope.selectedSongs.push(item);
            item.selected = true;
        });
    }
    $scope.selectNone = function () {
        angular.forEach($rootScope.song, function (item, key) {
            $scope.selectedSongs = [];
            item.selected = false;
        });
    }
    $scope.isActive = function (route) {
        return route === $location.path();
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
                        $rootScope.selectedMusicFolder = $rootScope.MusicFolders[index];
                    }
                    $scope.$apply();
                }
            }
        });
    }
    $scope.getGenres = function () {
        var genres = 'Acid Rock,Acoustic,Alt Country,Alt/Indie,Alternative & Punk,Alternative Metal,Alternative,AlternRock,Awesome,Bluegrass,Blues,Blues-Rock,Classic Hard Rock,Classic Rock,Comedy,Country,Country-Rock,Dance,Dance-Rock,Deep Funk,Easy Listening,Electronic,Electronica,Electronica/Dance,Folk,Folk/Rock,Funk,Grunge,Hard Rock,Heavy Metal,Holiday,House,Improg,Indie Rock,Indie,International,Irish,Jam Band,Jam,Jazz Fusion,Jazz,Latin,Live Albums,Metal,Music,Oldies,Other,Pop,Pop/Rock,Post Rock,Progressive Rock,Psychedelic Rock,Psychedelic,Punk,R&B,Rap & Hip-Hop,Reggae,Rock & Roll,Rock,Rock/Pop,Roots,Ska,Soft Rock,Soul,Southern Rock,Thrash Metal,Unknown,Vocal,World';
        $rootScope.Genres = genres.split(',');
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
    }
    $scope.download = function (id) {
        $.ajax({
            url: globals.BaseURL() + '/getUser.view?' + globals.BaseParams() + '&username=' + globals.settings.Username,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (data["subsonic-response"].user.downloadRole == true) {
                    $window.location.href = globals.BaseURL() + '/download.view?' + globals.BaseParams() + '&id=' + id;
                } else {
                    notifications.updateMessage('You do not have permission to Download', true);
                }
            }
        });
    }
    $scope.ping = function () {
        $.ajax({
            url: globals.BaseURL() + '/ping.view?' + globals.BaseParams(),
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (data["subsonic-response"].status == 'ok') {
                    globals.settings.ApiVersion = data["subsonic-response"].version;
                } else {
                    if (typeof data["subsonic-response"].error != 'undefined') {
                        alert(data["subsonic-response"].error.message);
                    }
                }
            },
            error: function () {
                alert('Unable to connect to Subsonic server');
            }
        });
    }
    $scope.mapSong = function (data) {
        var song = data;
        var url, track, rating, starred, contenttype, suffix, description;
        var specs = '', coverartthumb = '', coverartfull = '';
        if (typeof song.coverArt != 'undefined') {
            coverartthumb = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=60&id=' + song.coverArt;
            coverartfull = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&id=' + song.coverArt;
        }
        if (typeof song.description == 'undefined') { description = ''; } else { description = song.description; }
        if (typeof song.track == 'undefined') { track = '&nbsp;'; } else { track = song.track; }
        if (typeof song.starred !== 'undefined') { starred = true; } else { starred = false; }
        if (song.bitRate !== undefined) { specs += song.bitRate + ' Kbps'; }
        if (song.transcodedSuffix !== undefined) { specs += ', transcoding:' + song.suffix + ' > ' + song.transcodedSuffix; } else { specs += ', ' + song.suffix; }
        if (song.transcodedSuffix !== undefined) { suffix = song.transcodedSuffix; } else { suffix = song.suffix; }
        if (suffix == 'ogg') { suffix = 'oga'; }
        var salt = Math.floor(Math.random() * 100000);
        url = globals.BaseURL() + '/stream.view?' + globals.BaseParams() + '&id=' + song.id + '&salt=' + salt;
        return new model.Song(song.id, song.parent, track, song.title, song.artist, song.artistId, song.album, song.albumId, coverartthumb, coverartfull, song.duration, song.userRating, starred, suffix, specs, url, 0, description);
    }
    $scope.addSongToQueue = function (data) {
        $rootScope.queue.push(data);
    }
    $scope.queueRemoveSelected = function (data, event) {
        angular.forEach($scope.selectedSongs, function (item, key) {
            var index = $rootScope.queue.indexOf(item);
            if (index > -1) {
                $rootScope.queue.splice(index, 1);
            }
        });
    }
    $scope.queueEmpty = function () {
        //self.selectedSongs([]);
        $rootScope.queue = [];
    }
    $scope.queueTotal = function () {
        var total = 0;
        ko.utils.arrayForEach(self.queue(), function (item) {
            total += parseInt(item.duration());
        });
        if (self.queue().length > 0) {
            return self.queue().length + ' song(s), ' + utils.secondsToTime(total) + ' total time';
        } else {
            return '0 song(s), 00:00:00 total time';
        }
    }
    $scope.queueShuffle = function () {
        $rootScope.queue.sort(function () { return 0.5 - Math.random() });
    }
    $scope.selectedSongs = [];
    $scope.selectSong = function (data) {
        var i = $scope.selectedSongs.indexOf(data);
        if (i >= 0) {
            $scope.selectedSongs.splice(i, 1);
            data.selected = false;
        } else {
            $scope.selectedSongs.push(data);
            data.selected = true;
        }
        //$scope.$apply();
    }
    $rootScope.getRandomSongs = function (action, genre, folder) {
        if (globals.settings.Debug) { console.log('action:' + action + ', genre:' + genre + ', folder:' + folder); }
        var size = globals.settings.AutoPlaylistSize;
        $rootScope.selectedPlaylist = null;
        if (typeof folder == 'number') {
            $rootScope.selectedAutoPlaylist = folder;
        } else if (genre != '') {
            $rootScope.selectedAutoPlaylist = genre;
        } else {
            $rootScope.selectedAutoPlaylist = 'random';
        }
        var genreParams = '';
        if (genre != '' && genre != 'Random') {
            genreParams = '&genre=' + genre;
        }
        folderParams = '';
        if (typeof folder == 'number' && folder != '' && folder != 'all') {
            //alert(folder);
            folderParams = '&musicFolderId=' + folder;
        } else if (typeof $rootScope.selectedMusicFolder.id != 'undefined') {
            //alert($rootScope.selectedMusicFolder.id);
            folderParams = '&musicFolderId=' + $rootScope.selectedMusicFolder.id;
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
                            $rootScope.queue.push($scope.mapSong(item));
                        });
                        $scope.$apply();
                        $('body').layout().open('south');
                        notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                    } else if (action == 'play') {
                        $rootScope.queue = [];
                        angular.forEach(items, function (item, key) {
                            $rootScope.queue.push($scope.mapSong(item));
                        });
                        var next = $rootScope.queue[0];
                        $scope.$apply(function () {
                            $rootScope.playSong(false, next);
                        });
                        $('body').layout().open('south');
                        notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                    } else {
                        $rootScope.song = [];
                        angular.forEach(items, function (item, key) {
                            $rootScope.song.push($scope.mapSong(item));
                        });
                        $scope.$apply();
                    }
                }
            }
        });
    }

    /* Launch on Startup */
    $scope.loadSettings();
    utils.switchTheme(globals.settings.Theme);
    if (globals.settings.Server != '' && globals.settings.Username != '' && globals.settings.Password != '') {
        $scope.ping();
        $scope.getMusicFolders();
        if (globals.settings.SaveTrackPosition) {
            player.loadTrackPosition();
            player.startSaveTrackPosition();
        }
    }
    /* End Startup */
});