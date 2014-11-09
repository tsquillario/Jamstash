angular.module('JamStash')
.controller('AppCtrl', ['$scope', '$rootScope', '$document', '$window', '$location', '$cookieStore', 'utils', 'globals', 'model', 'notifications', 'player',
    function($scope, $rootScope, $document, $window, $location, $cookieStore, utils, globals, model, notifications, player) {
    'use strict';

    $rootScope.settings = globals.settings;
    $rootScope.song = [];
    $rootScope.queue = [];
    $rootScope.playingSong = null;
    $rootScope.MusicFolders = [];
    $rootScope.Genres = [];
    
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
                var exclude = ['Url'];
                var idx = exclude.indexOf(k);
                if (idx === -1) {
                    globals.settings[k] = v;
                }
            });
        }
        if (utils.getValue("SavedCollections")) { globals.SavedCollections = utils.getValue("SavedCollections").split(","); }
        if (utils.getValue("DefaultCollection")) { globals.DefaultCollection = utils.getValue("DefaultCollection"); }
        if (utils.getValue("SavedGenres")) { globals.SavedGenres = utils.getValue("SavedGenres").split(","); }
        if (globals.settings.Debug) { console.log('Loaded Settings: ' + JSON.stringify(globals.settings, null, 2)); }
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
            var off = el.offset();
            var width = el.width();
            var height = el.height();
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
    /*
    $(document).on("click", "a[name=coverartfancy]", function () {
        $.fancybox({
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
    */
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
        href: '#queue',
        autoWidth: false,
        width: '100%',
        //margin: [50, 10, 50, 10], // top, right, bottom, left
        openEffect: 'none',
        closeEffect: 'none',
        beforeLoad: function () {
            if ($rootScope.queue == 0) {
                this.close();
            }
        },
        helpers: {
            title: null
        }
    });
    /*
    $('.showSongs').fancybox({
        href: '#songs',
        autoWidth: false,
        width: '100%',
        //margin: [50, 10, 50, 10], // top, right, bottom, left
        openEffect: 'none',
        closeEffect: 'none',
        beforeLoad: function () {
            if ($rootScope.queue == 0) {
                //this.close();
            }
        },
        helpers: {
            title: null
        }
    });
    $rootScope.showSongs = function () {
        alert($("#songs").html())
        $.fancybox({
            type: 'inline',  
            content: $("#songs").html(),
            autoWidth: false,
            width: '100%',
            transitionIn: 'elastic',  
            transitionOut: 'elastic',
            helpers: {
                title: null
            }
        });
    }
    */

    $('#audiocontainer .scrubber').mouseover(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '8px' });
    });
    $('#audiocontainer .scrubber').mouseout(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '4px' });
    });

	$(document).on("click", ".message", function(){
	   $(this).remove();
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
        if (e.target.tagName.toUpperCase() != 'INPUT') {
            var unicode = e.charCode ? e.charCode : e.keyCode;
            if (globals.settings.Debug) { console.log('Keycode Triggered: ' + unicode); }
            if (unicode == 49) { // 1
                $('#action_Queue').click();
            } else if (unicode == 50) {
                $('#action_Library').click();
            } else if (unicode == 51) {
                $('#action_Archive').click();
            } else if (unicode == 52) {
                $('#action_Settings').click();
            } else if (unicode == 53) {
            } else if (unicode == 54) { // 6
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
        $('#left-component').stop().scrollTo('#MusicFolders', 400);
    };
    $rootScope.selectAll = function (songs) {
        angular.forEach(songs, function (item, key) {
            $scope.selectedSongs.push(item);
            item.selected = true;
        });
    };
    $rootScope.selectNone = function (songs) {
        angular.forEach(songs, function (item, key) {
            $scope.selectedSongs = [];
            item.selected = false;
        });
    };
    $rootScope.playAll = function (songs) {
        $rootScope.queue = [];
        $rootScope.selectAll(songs);
        $rootScope.addSongsToQueue();
        var next = $rootScope.queue[0];
        $rootScope.playSong(false, next);
    };
    $rootScope.playFrom = function (index, songs) {
        var from = songs.slice(index,songs.length);
        $scope.selectedSongs = [];
        angular.forEach(from, function (item, key) {
            $scope.selectedSongs.push(item);
            item.selected = true;
        });
        if ($scope.selectedSongs.length > 0) {
            $rootScope.queue = [];
            $rootScope.addSongsToQueue();
            var next = $rootScope.queue[0];
            $rootScope.playSong(false, next);
        }
    };
    $rootScope.addSongsToQueue = function () {
        if ($scope.selectedSongs.length !== 0) {
            angular.forEach($scope.selectedSongs, function (item, key) {
                $rootScope.queue.push(item);
                item.selected = false;
            });
            notifications.updateMessage($scope.selectedSongs.length + ' Song(s) Added to Queue', true);
            $scope.selectedSongs.length = 0;
        }
    };
	$scope.addSongToQueue = function (data) {
        $rootScope.queue.push(data);
    };
    $rootScope.removeSong = function (item, songs) {
        var index = songs.indexOf(item);
        songs.splice(index, 1);
    };
    $scope.removeSongFromQueue = function (item) {
        var index = $rootScope.queue.indexOf(item)
        $rootScope.queue.splice(index, 1);
    };
    $scope.isActive = function (route) {
        return route === $location.path();
    };
    $rootScope.getSplitPosition = function (scope, elm) {
        window.alert(elm.getBoundingClientRect().left);
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
        utils.arrayForEach(self.queue(), function (item) {
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
    };
	$rootScope.addToJukebox = function (id) {
		if (globals.settings.Debug) { console.log("LOAD JUKEBOX"); }
		$.ajax({
			url: globals.BaseURL() + '/jukeboxControl.view?' + globals.BaseParams() + '&action=set&id=' + id,
			method: 'GET',
			dataType: globals.settings.Protocol,
			timeout: globals.settings.Timeout,
			success: function (data) {
				/*
				if (data["subsonic-response"].podcasts.channel !== undefined) {
				}
				deferred.resolve(podcasts);
				*/
				$.get(globals.BaseURL() + '/jukeboxControl.view?' + globals.BaseParams() + '&action=start');
			}
		});
	};
	$rootScope.sendToJukebox = function (action) {
		if (globals.settings.Debug) { console.log("SEND JUKEBOX " + action); }
		$.ajax({
			url: globals.BaseURL() + '/jukeboxControl.view?' + globals.BaseParams() + '&action=' + action,
			method: 'GET',
			dataType: globals.settings.Protocol,
			timeout: globals.settings.Timeout,
			success: function (data) {
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
        //$scope.ping();
        if (globals.settings.SaveTrackPosition) {
            player.loadTrackPosition();
            player.startSaveTrackPosition();
        }
    }
    /* End Startup */
}]);
