angular.module('JamStash')
.controller('AppController', ['$scope', '$rootScope', '$document', '$window', '$location', '$cookieStore', '$http', 'utils', 'globals', 'model', 'notifications', 'player',
    function($scope, $rootScope, $document, $window, $location, $cookieStore, $http, utils, globals, model, notifications, player) {
    'use strict';

    $rootScope.settings = globals.settings;
    $rootScope.song = [];
    $rootScope.queue = [];
    $rootScope.playingSong = null;
    $rootScope.MusicFolders = [];
    $rootScope.Genres = [];
    $rootScope.Messages = [];

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

    $scope.$watchCollection('queue', function(newItem, oldItem) {
        if (oldItem.length != newItem.length 
		&& globals.settings.ShowQueue) {
            $rootScope.showQueue();
        }
        /*
        for (var index in newCol) {
            var item = newCol[index];
            item.order = parseInt(index) + 1;
        }
        */
    });
    $rootScope.showQueue = function () {
        $('#SideBar').css('display', 'block');
        $('#right-component').removeClass('lgcolumn_expanded');
    };
    $rootScope.hideQueue = function () {
        $('#SideBar').css('display', 'none');
        $('#right-component').addClass('lgcolumn_expanded');
    };
    $scope.toggleQueue = function () {
        if ($('#SideBar').css('display') == 'none') {
            $rootScope.showQueue();
        } else {
            $rootScope.hideQueue();
        }
    };
    $scope.toggleQueue = function () {
        if ($('#SideBar').css('display') == 'none') {
            $rootScope.showQueue();
        } else {
            $rootScope.hideQueue();
        }
    };
    $rootScope.showArtists = function () {
        $('#left-component').css('display', '');
        $('#right-component').removeClass('lgcolumn_expandedleft');
    };
    $rootScope.hideArtists = function () {
        $('#left-component').css('display', 'none');
        $('#right-component').addClass('lgcolumn_expandedleft');
    };
    $scope.toggleArtists = function () {
        if ($('#left-component').css('display') == 'none') {
            $rootScope.showArtists();
        } else {
            $rootScope.hideArtists();
        }
    };

    $scope.fancyboxOpenImage = function (url) {
        utils.fancyboxOpenImage(url);
    };

    $('#audiocontainer .scrubber').mouseover(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '8px' });
    });
    $('#audiocontainer .scrubber').mouseout(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '4px' });
    });

	$(document).on("click", ".message", function(){
	   $(this).remove();
	});

    // Global Functions
    window.onbeforeunload = function () {
        if (!globals.settings.Debug) {
            if ($rootScope.queue.length > 0) {
                return "You're about to end your session, are you sure?";
            }
        }
    };
    $rootScope.showIndex = false;
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
    $(document).on( 'click', 'message', function() { 
        $(this).fadeOut(function () { $(this).remove(); });
        return false;
    })
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
                player.nextTrack();
            } else if (unicode == 37 || unicode == 177) { // back arrow
                player.previousTrack();
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
        player.play(next);
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
            player.play(next);
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
    $rootScope.reloadRoute = function (reload) {
        utils.reloadRoute(reload);
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
    // Hyz: I don't know yet how to remove the circular dependency between player-service
    // and notification-service... So I'll keep this one there until I know.
    $rootScope.nextTrack = function (loadonly, song) {
        player.nextTrack(loadonly, song);
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

    function loadTrackPosition() {
        if (utils.browserStorageCheck()) {
            // Load Saved Song
            var song = angular.fromJson(localStorage.getItem('CurrentSong'));
            if (song) {
                player.load(song);
                // Load Saved Queue
                var items = angular.fromJson(localStorage.getItem('CurrentQueue'));
                if (items) {
                    $rootScope.queue = items;
                    if ($rootScope.queue.length > 0) {
                        notifications.updateMessage($rootScope.queue.length + ' Saved Song(s)', true);
                    }
                    if (globals.settings.Debug) { console.log('Play Queue Loaded From localStorage: ' + $rootScope.queue.length + ' song(s)'); }
                }
            }
        } else {
            if (globals.settings.Debug) { console.log('HTML5::loadStorage not supported on your browser'); }
        }
    }

    /* Launch on Startup */
    $scope.loadSettings();
    utils.switchTheme(globals.settings.Theme);

    if(!globals.settings.ShowQueue) {
        $rootScope.hideQueue();
    }

    if ($scope.loggedIn()) {
        //$scope.ping();
        if (globals.settings.SaveTrackPosition) {
            loadTrackPosition();
            player.startSaveTrackPosition();
        }
    }
    /* End Startup */
}]);
