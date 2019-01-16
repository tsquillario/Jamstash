angular.module('JamStash')
.controller('AppController', ['$scope', '$rootScope', '$document', '$window', '$location', '$cookieStore', '$http', 'lodash', 'utils', 'globals', 'model', 'notifications', 'player', 'persistence', 'Page', 'subsonic', 'Loading',
    function ($scope, $rootScope, $document, $window, $location, $cookieStore, $http, _, utils, globals, model, notifications, player, persistence, Page, subsonic, Loading) {
    'use strict';

    $rootScope.settings = globals.settings;
    $rootScope.song = [];
    $rootScope.playingSong = null;
    $rootScope.Messages = [];

    $rootScope.unity = null;
    $scope.Page = Page;
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

    $scope.loading = Loading;
    // TODO: Hyz: remove when there are no longer jQuery ajax calls
    $.ajaxSetup({
        'beforeSend': function () {
            $("#loading").removeClass('ng-hide');
        },
        'complete': function () {
            $("#loading").addClass('ng-hide');
        }
    });

    // Reads cookies and sets globals.settings values
    $scope.loadSettings = function () {
        // Temporary Code to Convert Cookies added 2/2/2014
        if ($cookieStore.get('Settings')) {
            persistence.saveSettings($cookieStore.get('Settings'));
            $cookieStore.remove('Settings');
        }
        var settings = persistence.getSettings();
        if (settings !== undefined) {
            var updSettings = _.omit(settings, 'Url');
            // We can't just assign settings to globals.settings because it's on the scope
            // TODO: Hyz: remove $rootScope.settings and replace with individual settings
            _.each(updSettings, function(val, key) {
                globals.settings[key] = val;
            });
        }
        if (utils.getValue("SavedCollections")) { globals.SavedCollections = utils.getValue("SavedCollections").split(","); }
        if (utils.getValue("DefaultCollection")) { globals.DefaultCollection = utils.getValue("DefaultCollection"); }
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

    $scope.$watchCollection(function () {
        return player.queue;
    }, function(newQueue) {
        if (newQueue !== undefined && newQueue.length > 0 && globals.settings.ShowQueue) {
            $scope.showQueue();
        }
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
        if ($('#SideBar').css('display') === 'none') {
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
        $.fancybox.open({
            helpers : {
                overlay : {
                    css : {
                        'background' : 'rgba(0, 0, 0, 0.15)'
                    }
                }
            },
            hideOnContentClick: true,
            type: 'image',
            openEffect: 'none',
            closeEffect: 'none',
            href: url
        });
    };

    $(document).on("click", ".message", function(){
       $(this).remove();
    });

    // Global Functions
    window.onbeforeunload = function () {
        if (!globals.settings.Debug) {
            if (player.queue.length > 0) {
                return "You're about to end your session, are you sure?";
            }
        }
    };
    $rootScope.showIndex = false;
    $(document).on( 'click', 'message', function() {
        $(this).fadeOut(function () { $(this).remove(); });
        return false;
    })

    // Shortcut processing
    $(document).keydown(function (e) {
        $scope.processKeyEvent(e);
    });
    $scope.scrollToIndex = function (e) {
        $scope.processKeyEvent(e);
        return true;
    };
    $scope.processKeyEvent = function (e) {
        if (e.isDefaultPrevented() ||
            e.repeat ||
            e.altKey || e.metaKey || e.ctrlKey ||
            (e.target && _.contains(['input', 'textarea', 'select'], e.target.tagName.toLowerCase()))) {
          return;
        }

        var key = e.key;
        if (globals.settings.Debug) { console.log('Key pressed: ' + key); }
        if (key == "Esc" || key == "Escape") {
            $rootScope.hideQueue();
        } else if (key == " " || key == "Space") {
            player.togglePause();
        } else if (key == "ArrowLeft" || key == "Left") {
            player.previousTrack();
        } else if (key == "ArrowRight" || key == "Right") {
            player.nextTrack();
        } else if (key == "-" || key == "_") {
            persistence.saveVolume(player.turnVolumeDown());
        } else if (key == "=" || key == "+") {
            persistence.saveVolume(player.turnVolumeUp());
        } else if (/^[a-z]$/i.test(key) && $('#tabLibrary').is(':visible')) {
            if (/^[x-z]$/i.test(key)) {
                key = 'x-z';
            }
            var el = '#' + key.toUpperCase();
            if ($(el).length > 0) {
                $('#left-component').stop().scrollTo(el, 400);
            }
        }
        else{
          return;
        }
        $scope.$apply();
        e.preventDefault();
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

    $rootScope.removeSong = function (item, songs) {
        // TODO: Hyz: Replace
        var index = songs.indexOf(item);
        songs.splice(index, 1);
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

    $scope.toggleStar = function (item) {
        subsonic.toggleStar(item).then(function (newStarred) {
            item.starred = newStarred;
            notifications.updateMessage('Favorite Updated!', true);
        });
    };

    $scope.toTrusted = function (html) {
        return $sce.trustAsHtml(html);
    };

    /* Launch on Startup */
    $scope.loadSettings();
    utils.switchTheme(globals.settings.Theme);

    if(!globals.settings.ShowQueue) {
        $rootScope.hideQueue();
    }

    if ($scope.loggedIn()) {
        //$scope.ping();
        if (globals.settings.SaveTrackPosition) {
            persistence.loadQueue();
            persistence.loadTrackPosition();
        }
        player.setVolume(persistence.getVolume());
    }
    /* End Startup */
}]);
