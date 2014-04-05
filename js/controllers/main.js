JamStash.controller('AppCtrl',
function AppCtrl($scope, $rootScope, $document, $window, $location, $cookieStore, utils, globals, model, notifications, player) {
    $rootScope.settings = globals.settings;
    $rootScope.song = [];
    $rootScope.queue = [];
    $rootScope.playingSong = null;
    $rootScope.MusicFolders = [];
    $rootScope.Genres = [];
    $rootScope.selectedPlaylist = "";
    $rootScope.selectedAutoPlaylist = "";
    $rootScope.SelectedMusicFolder = "";
    $rootScope.unity = null;
    $rootScope.loggedIn = function () {
        if (globals.settings.Server !== '' && globals.settings.Username !== '' && globals.settings.Password !== '') {
            return true;
        } else {
            return false;
        }
    };
    $rootScope.totalDisplayed = 50;
    $rootScope.loadMore = function () {
        $scope.totalDisplayed += 50;
    };
    $rootScope.go = function (path) {
        $location.path(path);
    };
    /*
    $scope.playSong = function (loadonly, data) { 
    $scope.$apply(function () {
    $rootScope.playSong(loadonly, data);
    });
    }
    */

    // Reads cookies and sets globals.settings values
    $scope.loadSettings = function () {
        // Temporary Code to Convert Cookies added 2/2/2014
        if ($cookieStore.get('Settings')) {
            utils.setValue('Settings', $cookieStore.get('Settings'), false);
            $cookieStore.remove('Settings');
        }
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
    };
    $scope.toggleSetting = function (setting) {
        var id = setting;
        if (globals.settings[id]) {
            globals.settings[id] = false;
        } else {
            globals.settings[id] = true;
        }
        notifications.updateMessage(setting + ' : ' + globals.settings[id], true);
    };

    $.ajaxSetup({
        'beforeSend': function () {
            $("#loading").show();
        },
        'complete': function () {
            $("#loading").hide();
        }
    });


    $(".coverartfancy").on("click", "a", function () {
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
            setTimeout(function () { if (submenu_active === false) $('div.submenu').stop().fadeOut(); }, 10000);
        }
    };
    $rootScope.showQueue = function () {
        $.fancybox.open();
    };
    $rootScope.hideQueue = function () {
        $.fancybox.close();
    };
    $scope.toggleQueue = function () {
        var submenu = $('#QueuePreview');
        if (submenu.css('display') == 'none') {
            $rootScope.showQueue();
        } else {
            $rootScope.hideQueue();
        }
    };
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

    $('.showQueue').fancybox({
        href: '#showqueue',
        autoWidth: false,
        width: '100%',
        //margin: [50, 10, 50, 10], // top, right, bottom, left
        openEffect: 'none',
        closeEffect: 'none',
        beforeLoad: function () {
            if ($rootScope.queue == 0) {
                this.close();
            }
        }
    });

    $('#audiocontainer .scrubber').mouseover(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '8px' });
    });
    $('#audiocontainer .scrubber').mouseout(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '4px' });
    });

    $('.message').on('click', function () { $(this).remove(); });

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


    // JQuery UI Sortable - Drag and drop sorting
    /*
    var fixHelper = function (e, ui) {
        ui.children().each(function () {
            $(this).width($(this).width());
        });
        return ui;
    };
    $("#QueuePreview ul.songlist").sortable({
        helper: fixHelper
    });
    */
    /* JQuery Layout Plugin - I don't think this is used anywhere
    function resizePageLayout() {
        var pageLayout = $("body").data("layout");
        if (pageLayout) pageLayout.resizeAll();
    };
    */

    // Global Functions
    window.onbeforeunload = function () {
        if (!globals.settings.Debug) {
            if ($rootScope.queue.length > 0) {
                return "You're about to end your session, are you sure?";
            }
        }
    };

    $scope.dragStart = function (e, ui) {
        ui.item.data('start', ui.item.index());
    };
    $scope.dragEnd = function (e, ui) {
        var start = ui.item.data('start'),
            end = ui.item.index();
        $rootScope.queue.splice(end, 0,
            $rootScope.queue.splice(start, 1)[0]);
        $scope.$apply();
    };
    $document.keydown(function (e) {
        $scope.scrollToIndex(e);
    });
    $scope.scrollToIndex = function (e) {
        var source = e.target.id;
        if (source != 'Search' && source != 'Source' && source != 'Description' && source != 'ChatMsg' && source != 'AutoPlaylists') {
            var unicode = e.charCode ? e.charCode : e.keyCode;
            if (globals.settings.Debug) { console.log('Keycode Triggered: ' + unicode); }
            if (unicode == 49) { // 1
                $('#action_Queue').click();
            } else if (unicode == 50) {
                $('#action_Library').click();
            } else if (unicode == 51) {
                $('#action_Playlists').click();
            } else if (unicode == 52) {
                $('#action_Podcasts').click();
            } else if (unicode == 53) {
                $('#action_Archive').click();
            } else if (unicode == 54) { // 6
                $('#action_Settings').click();
            }
            if (unicode >= 65 && unicode <= 90 && $('#tabLibrary').is(':visible')) { // a-z
                var key = utils.findKeyForCode(unicode);
                if (key == 'x' || key == 'y' || key == 'z') {
                    key = 'x-z';
                }
                var el = '#' + key.toUpperCase();
                if ($(el).length > 0) {
                    $('#left-component').stop().scrollTo(el, 400);
                }
            } else if (unicode == 39 || unicode == 176) { // right arrow
                $rootScope.nextTrack();
            } else if (unicode == 37 || unicode == 177) { // back arrow
                $rootScope.previousTrack();
            } else if (unicode == 32 || unicode == 179 || unicode.toString() == '0179') { // spacebar
                player.playPauseSong();
                return false;
            } else if (unicode == 36 && $('#tabLibrary').is(':visible')) { // home
                $('#left-component').stop().scrollTo('#MusicFolders', 400);
            }
            if (unicode == 189) { // dash - volume down
                var volume = utils.getValue('Volume') ? parseFloat(utils.getValue('Volume')) : 1;
                if (volume <= 1 && volume > 0 && source === '') {
                    volume += -0.1;
                    $(globals.Player1).jPlayer({
                        volume: volume
                    });
                    utils.setValue('Volume', volume, true);
                    if (globals.settings.Debug) { console.log('Volume: ' + Math.round(volume * 100) + '%'); }
                }
            }
            if (unicode == 187) { // equals - volume up
                var volume = utils.getValue('Volume') ? parseFloat(utils.getValue('Volume')) : 1;
                if (volume < 1 && volume >= 0 && source ==- '') {
                    volume += 0.1;
                    $(globals.Player1).jPlayer({
                        volume: volume
                    });
                    utils.setValue('Volume', volume, true);
                    if (globals.settings.Debug) { console.log('Volume: ' + Math.round(volume * 100) + '%'); }
                }
            }
        }
        return true;
    };
    $scope.scrollToIndexName = function (index) {
        var el = '#' + index;
        if ($(el).length > 0) {
            $('#left-component').stop().scrollTo(el, 400);
        }
    };
    $scope.scrollToTop = function () {
        $('#Artists').stop().scrollTo('#auto', 400);
    };
    $scope.selectAll = function () {
        angular.forEach($rootScope.song, function (item, key) {
            $scope.selectedSongs.push(item);
            item.selected = true;
        });
    };
    $scope.playAll = function () {
        $rootScope.queue = [];
        $scope.selectAll();
        $scope.addSongsToQueue();
        var next = $rootScope.queue[0];
        $rootScope.playSong(false, next);
    };
    $scope.playFrom = function (index) {
        var from = $rootScope.song.slice(index,$rootScope.song.length);
        angular.forEach(from, function (item, key) {
            $scope.selectedSongs.push(item);
            item.selected = true;
        });
        $rootScope.queue = [];
        $scope.addSongsToQueue();
        var next = $rootScope.queue[0];
        $rootScope.playSong(false, next);
    };
    $scope.selectNone = function () {
        angular.forEach($rootScope.song, function (item, key) {
            $scope.selectedSongs = [];
            item.selected = false;
        });
    };
    $scope.addSongsToQueue = function () {
        if ($scope.selectedSongs.length !== 0) {
            angular.forEach($scope.selectedSongs, function (item, key) {
                $scope.queue.push(item);
                item.selected = false;
            });
            //$rootScope.showQueue();
            notifications.updateMessage($scope.selectedSongs.length + ' Song(s) Added to Queue', true);
            $scope.selectedSongs.length = 0;
        }
    };
    $scope.removeSong = function (item) {
        var index = $rootScope.song.indexOf(item)
        $rootScope.song.splice(index, 1);
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

                    folders.unshift({
                        "id": -1,
                        "name": "All Folders"
                    });
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
                        $rootScope.SelectedMusicFolder = $rootScope.MusicFolders[index];
                    } else {
                        $rootScope.SelectedMusicFolder = $rootScope.MusicFolders[0];
                    }
                    $scope.$apply();
                }
            }
        });
    };
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
    };
    $scope.download = function (id) {
        $.ajax({
            url: globals.BaseURL() + '/getUser.view?' + globals.BaseParams() + '&username=' + globals.settings.Username,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (typeof data["subsonic-response"].error != 'undefined') {
                    notifications.updateMessage('Error: ' + data["subsonic-response"].error.message, true);
                } else {
                    if (data["subsonic-response"].user.downloadRole === true) {
                        $window.location.href = globals.BaseURL() + '/download.view?' + globals.BaseParams() + '&id=' + id;
                    } else {
                        notifications.updateMessage('You do not have permission to Download', true);
                    }
                }
            }
        });
    };
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
                        notifications.updateMessage(data["subsonic-response"].error.message);
                    }
                }
            },
            error: function () {
                notifications.updateMessage('Unable to connect to Subsonic server');
            }
        });
    };
    $scope.addSongToQueue = function (data) {
        $rootScope.queue.push(data);
    };
    $scope.queueRemoveSelected = function (data, event) {
        angular.forEach($scope.selectedSongs, function (item, key) {
            var index = $rootScope.queue.indexOf(item);
            if (index > -1) {
                $rootScope.queue.splice(index, 1);
            }
        });
    };
    $scope.queueEmpty = function () {
        //self.selectedSongs([]);
        $rootScope.queue = [];
        $.fancybox.close();
    };
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
    };
    $scope.queueShuffle = function () {
        $rootScope.queue.sort(function () { return 0.5 - Math.random(); });
    };
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
    };
    $rootScope.getRandomSongs = function (action, genre, folder) {
        if (globals.settings.Debug) { console.log('action:' + action + ', genre:' + genre + ', folder:' + folder); }
        var size = globals.settings.AutoPlaylistSize;
        $rootScope.selectedPlaylist = null;
        if (typeof folder == 'number') {
            $rootScope.selectedAutoPlaylist = folder;
        } else if (genre !== '') {
            $rootScope.selectedAutoPlaylist = genre;
        } else {
            $rootScope.selectedAutoPlaylist = 'random';
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
                            $rootScope.queue.push(utils.mapSong(item));
                        });
                        $scope.$apply();
                        //$rootScope.showQueue();
                        notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                    } else if (action == 'play') {
                        $rootScope.queue = [];
                        angular.forEach(items, function (item, key) {
                            $rootScope.queue.push(utils.mapSong(item));
                        });
                        var next = $rootScope.queue[0];
                        $scope.$apply(function () {
                            $rootScope.playSong(false, next);
                        });
                        //$rootScope.showQueue();
                        notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                    } else {
                        $rootScope.song = [];
                        angular.forEach(items, function (item, key) {
                            $rootScope.song.push(utils.mapSong(item));
                        });
                        $scope.$apply();
                    }
                }
            }
        });
    };
    $scope.updateFavorite = function (item) {
        var id = item.id;
        var starred = item.starred;
        var url;
        if (starred) {
            url = globals.BaseURL() + '/unstar.view?' + globals.BaseParams() + '&id=' + id;
            item.starred = undefined;
        } else {
            url = globals.BaseURL() + '/star.view?' + globals.BaseParams() + '&id=' + id;
            item.starred = true;
        }
        $.ajax({
            url: url,
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function () {
                notifications.updateMessage('Favorite Updated!', true);
            }
        });
    };
    $scope.toTrusted = function (html) {
        return $sce.trustAsHtml(html);
    };

    /* Launch on Startup */
    $scope.loadSettings();
    utils.switchTheme(globals.settings.Theme);
    if ($scope.loggedIn()) {
        $scope.ping();
        $scope.getMusicFolders();
        if (globals.settings.SaveTrackPosition) {
            player.loadTrackPosition();
            player.startSaveTrackPosition();
        }
    }
    /* End Startup */
});