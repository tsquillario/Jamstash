$(document).ready(function () {
    //User config staff
    $('#Username').val($.cookie('username'));
    $('#Password').val($.cookie('password'));
    $('#AutoAlbumSize').val($.cookie('AutoAlbumSize'));
    $('#AutoPlaylistSize').val($.cookie('AutoPlaylistSize'));
    $('#Server').val($.cookie('Server'));
    $('#ApplicationName').val($.cookie('ApplicationName'));

    // Set Preferences defaults
    if ($.cookie('HideAZ')) {
        $('#HideAZ').attr('checked', true);
    } else {
        $('#HideAZ').attr('checked', false);
    }
    if ($.cookie('EnableNotifications')) {
        $('#EnableNotifications').attr('checked', true);
    } else {
        $('#EnableNotifications').attr('checked', false);
    }
    if ($.cookie('ScrollTitle')) {
        $('#ScrollTitle').attr('checked', true);
    } else {
        $('#ScrollTitle').attr('checked', false);
    }
    if ($.cookie('Debug')) {
        $('#Debug').attr('checked', true);
        debug = true;
    } else {
        $('#Debug').attr('checked', false);
    }

    // Tabs
    $(".tabcontent").hide(); //Hide all content
    if (!$.cookie('username') && !$.cookie('password') && !$.cookie('Server')) {
        $('ul.tabs li a').each(function () {
            if ($(this).attr("href") == '#tabPreferences') {
                $(this).addClass("active"); //Add "active" class to selected tab
            }
        });
        $("#tabPreferences").show(); //Show first tab content
        loadTabContent('#tabPreferences');
    } else {
        if (window.location.hash) {
            var hash = window.location.hash;
            $('ul.tabs li a').each(function () {
                if ($(this).attr("href") == hash) {
                    $(this).addClass("active"); //Add "active" class to selected tab
                }
            });
            $(hash).show(); //Fade in the active ID content
            loadTabContent(hash);
        } else {
            $("ul.tabs li:first a").addClass("active").show(); //Activate first tab
            $(".tabcontent:first").show(); //Show first tab content
            var firstTab = $("ul.tabs li:first a").attr("href");
            loadTabContent(firstTab);
        }
    }

    // Tabs - Click Event
    $("ul.tabs li a").click(function () {
        $("ul.tabs li a").removeClass("active"); //Remove any "active" class
        $(this).addClass("active"); //Add "active" class to selected tab
        $(".tabcontent").hide(); //Hide all tab content

        var activeTab = $(this).attr("href"); //Find the href attribute value to identify the active tab + content
        $(activeTab).show(); //Fade in the active ID content
        loadTabContent(activeTab);
    });

    // Ajax Loading Screen
    $(".toploading").ajaxStart(function () {
        $(this).show();
    });
    $(".toploading").ajaxStop(function () {
        $(this).hide();
    });

    // Keyboard shortcuts
    $(document).keydown(function (e) {
        var source = e.target.id;
        if (source != 'Search' && source != 'ChatMsg') {
            var unicode = e.charCode ? e.charCode : e.keyCode;
            // a-z
            if (unicode >= 65 && unicode <= 90) {
                var key = findKeyForCode(unicode);
                var el = '#index_' + key.toUpperCase();
                $('#Artists').stop().scrollTo(el, 400);
                // right arrow
            } else if (unicode == 39 || unicode == 176) {
                var next = $('#CurrentPlaylistContainer tr.playing').next();
                if (!next.length) next = $('#CurrentPlaylistContainer li').first();
                changeTrack(next);
                // back arrow
            } else if (unicode == 37 || unicode == 177) {
                var prev = $('#CurrentPlaylistContainer tr.playing').prev();
                if (!prev.length) prev = $('#CurrentPlaylistContainer tr').last();
                changeTrack(prev);
                // spacebar
            } else if (unicode == 32 || unicode == 179 || unicode == 0179) {
                playPauseSong();
            } else if (unicode == 36) {
                $('#Artists').stop().scrollTo('#auto', 400);
            }
        }
    });

    // Main Click Events
    // Albums Click Event
    $('#MusicFolders').live('change', function () {
        var folder = $(this).val();
        loadArtists(folder, true);
        $.cookie('MusicFolders', folder, { expires: 365 });
    });
    $('#ArtistContainer li.item').live('click', function () {
        $('#AutoAlbumContainer li').removeClass('selected');
        $('#ArtistContainer li').removeClass('selected');
        $(this).addClass('selected');
        getAlbums($(this).attr("id"), '', '#AlbumRows');
    });
    $('#BottomIndex li a').live('click', function () {
        var el = 'a[name = "index_' + $(this).text() + '"]';
        $('#Artists').stop().scrollTo(el, 400);
        return false;
    });
    $('#AutoAlbumContainer li.item').live('click', function () {
        $('#AutoAlbumContainer li').removeClass('selected');
        $('#ArtistContainer li').removeClass('selected');
        $(this).addClass('selected');
        getAlbumListBy($(this).attr("id"));
    });
    $('tr.album a.play').live('click', function (e) {
        var albumid = $(this).parent().parent().attr('childid');
        var artistid = $(this).parent().parent().attr('parentid');
        getAlbums(albumid, 'autoplay', '#CurrentPlaylistContainer');
        return false;
    });
    $('tr.album a.add').live('click', function (e) {
        var albumid = $(this).parent().parent().attr('childid');
        var artistid = $(this).parent().parent().attr('parentid');
        getAlbums(albumid, 'add', '#CurrentPlaylistContainer');
        return false;
    });
    $('tr.album a.download').live('click', function (event) {
        var itemid = $(this).parent().parent().attr('childid');
        downloadItem(itemid, 'item');
        return false;
    });
    $('tr.album a.rate').live('click', function (event) {
        var itemid = $(this).parent().parent().attr('childid');
        rateSong(itemid, 5);
        $(this).removeClass('rate');
        $(this).addClass('favorite');
        return false;
    });
    $('tr.album a.favorite').live('click', function (event) {
        var itemid = $(this).parent().parent().attr('childid');
        rateSong(itemid, 0);
        $(this).removeClass('favorite');
        $(this).addClass('rate');
        return false;
    });
    $('tr.album').live('click', function (e) {
        var albumid = $(this).attr('childid');
        var artistid = $(this).attr('parentid');
        getAlbums(albumid, '', '#AlbumRows');
        return false;
    });

    // Track - Click Events
    // Multiple Select
    $('.noselect').disableTextSelect();
    var lastChecked = null;
    $('table.songlist tr.song').live('click', function (event) {
        var checkboxclass = 'table.songlist tr.song';
        var songid = $(this).attr('childid');
        var albumid = $(this).attr('parentid');
        if (!event.ctrlKey) {
            $(checkboxclass).removeClass('selected');
        }
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            $(this).addClass('selected');
        }
        if (!lastChecked) {
            lastChecked = this;
            return;
        }
        if (event.shiftKey) {
            var start = $(checkboxclass).index(this);
            var end = $(checkboxclass).index(lastChecked);
            for (i = Math.min(start, end); i <= Math.max(start, end); i++) {
                $(checkboxclass).eq(i).addClass('selected');
            }
        }
        lastChecked = this;
    });
    // Double Click
    $('table.songlist tr.song').live('dblclick', function (e) {
        e.preventDefault();
        //$(this).addClass('playing').siblings().removeClass('playing');
        var songid = $(this).attr('childid');
        var albumid = $(this).attr('parentid');
        playSong('', this, songid, albumid);
    });
    $('table.songlist tr.song a.play').live('click', function (event) {
        var songid = $(this).parent().parent().attr('childid');
        var albumid = $(this).parent().parent().attr('parentid');
        if (!$('#tabCurrent').is(':visible')) {
            $('#CurrentPlaylistContainer tbody').empty();
            var track = $(this).parent().parent();
            $(track).clone().appendTo('#CurrentPlaylistContainer');
            id = 0;
            count = 0;
            while (id !== undefined) {
                track = track.next();
                id = $(track).attr('childid');
                $(track).clone().appendTo('#CurrentPlaylistContainer');
                count++;
            }
            updateMessage(count + ' Song(s) Added');
            var firstsong = $('#CurrentPlaylistContainer tr.song:first');
            songid = $(firstsong).attr('childid');
            albumid = $(firstsong).attr('parentid');
            playSong(firstsong, songid, albumid);
        } else {
            playSong($(this).parent().parent(), songid, albumid);
        }
        /* 20120520 OwnCloud Merge
        var songid = $(this).parent().parent().attr('childid');
        var albumid = $(this).parent().parent().attr('parentid');
        playSong($(this).parent().parent(), songid, albumid);
        */
        return false;
    });
    $('table.songlist tr.song a.download').live('click', function (event) {
        var itemid = $(this).parent().parent().attr('childid');
        downloadItem(itemid, 'item');
        return false;
    });
    $('table.songlist tr.song a.add').live('click', function (event) {
        var track = $(this).parent().parent();
        $(track).clone().appendTo('#CurrentPlaylistContainer');
        return false;
    });
    $('table.songlist tr.song a.remove').live('click', function (event) {
        var track = $(this).parent().parent();
        $(track).remove();
        refreshRowColor('table.songlist');
        return false;
    });
    $('table.songlist tr.song a.rate').live('click', function (event) {
        var songid = $(this).parent().parent().attr('childid');
        rateSong(songid, 5);
        $(this).removeClass('rate');
        $(this).addClass('favorite');
        return false;
    });
    $('table.songlist tr.song a.favorite').live('click', function (event) {
        var songid = $(this).parent().parent().attr('childid');
        rateSong(songid, 0);
        $(this).removeClass('favorite');
        $(this).addClass('rate');
        return false;
    });
    $('li.index').live('click', function (e) {
        $('#Artists').stop().scrollTo('#auto', 400);
        return false;
    });

    // Music Library Click Events
    $('a#action_AddToPlaylist').click(function () {
        var submenu = $('div#submenu_AddToPlaylist');
        if (submenu.is(":visible")) {
            submenu.fadeOut();
        } else {
            loadPlaylistsForMenu('submenu_AddToPlaylist');
            //get the position of the placeholder element
            pos = $(this).offset();
            width = $(this).width();
            height = $(this).height();
            //show the menu directly over the placeholder
            submenu.css({ "left": (pos.left) + "px", "top": (pos.top + height + 14) + "px" }).fadeIn(400);
        }
        return false;
    });
    var submenu_active = false;
    $('div.submenu').mouseenter(function () {
        submenu_active = true;
    });
    $('div.submenu').mouseleave(function () {
        submenu_active = false;
        setTimeout(function () { if (submenu_active == false) $('div.submenu').fadeOut(); }, 400);
    });
    $('a#action_AddToCurrent').click(function () {
        addToCurrent(false);
        return false;
    });
    $('a#action_AddAllToCurrent').click(function () {
        addToCurrent(true);
        return false;
    });
    $('a#action_PlayAlbum').click(function () {
        $('#CurrentPlaylistContainer tbody').empty();
        addToCurrent(true);
        // Start playing song
        var first = $('#CurrentPlaylistContainer tr.song').first();
        changeTrack(first);
        return false;
    });
    $('#action_RefreshArtists').click(function () {
        loadArtists("", true);
        return false;
    });
    $('#action_IncreaseWidth').click(function () {
        resizeSMSection(50);
        return false;
    });
    $('#action_DecreaseWidth').click(function () {
        resizeSMSection(-50);
        return false;
    });
    $('#action_SelectAll').click(function () {
        $('#Albums tr.song').each(function () {
            $(this).addClass('selected');
        });
        return false;
    });
    $('#action_SelectNone').click(function () {
        $('#Albums tr.song').each(function () {
            $(this).removeClass('selected');
        });
        return false;
    });
    $('input#Search').keydown(function (e) {
        var unicode = e.charCode ? e.charCode : e.keyCode;
        if (unicode == 13) {
            $('#action_Search').click();
        }
    });
    $('#action_Search').click(function () {
        var query = $('#Search').val();
        var type = $('#SearchType').val();
        search(type, query);
        $('#Search').val("");
        return false;
    });
    // Current Playlist Click Events
    $('#action_Shuffle').live('click', function () {
        $('#CurrentPlaylistContainer tbody tr.song').shuffle();
        refreshRowColor('#CurrentPlaylistContainer tbody');
        return false;
    });
    $('#action_Empty').live('click', function () {
        $('#CurrentPlaylistContainer tbody').empty();
        return false;
    });
    $('a#action_AddCurrentToPlaylist').click(function () {
        var submenu = $('div#submenu_AddCurrentToPlaylist');
        if (submenu.is(":visible")) {
            submenu.fadeOut();
        } else {
            loadPlaylistsForMenu('submenu_AddCurrentToPlaylist');
            //get the position of the placeholder element
            pos = $(this).offset();
            width = $(this).width();
            height = $(this).height();
            //show the menu directly over the placeholder
            submenu.css({ "left": (pos.left) + "px", "top": (pos.top + height + 14) + "px" }).fadeIn(400);
        }
    });
    $('#action_CurrentSelectAll').click(function () {
        $('#CurrentPlaylist tr.song').each(function () {
            $(this).addClass('selected');
        });
        return false;
    });
    $('#action_CurrentSelectNone').click(function () {
        $('#CurrentPlaylist tr.song').each(function () {
            $(this).removeClass('selected');
        });
        return false;
    });
    // Playlist Click Events
    $('#AutoPlaylistContainer li.item').live('click', function () {
        $('#AutoPlaylistContainer li').removeClass('selected');
        $('#PlaylistContainer li').removeClass('selected');
        $(this).addClass('selected');
        getRandomSongList('', '#TrackContainer');
    });
    $('#AutoPlaylistContainer li.item a.play').live('click', function () {
        getRandomSongList('autoplay', '#CurrentPlaylistContainer');
        return false;
    });
    $('#AutoPlaylistContainer li.item a.add').live('click', function () {
        getRandomSongList('', '#CurrentPlaylistContainer');
        return false;
    });
    $('#PlaylistContainer li.item').live('click', function () {
        $('#AutoPlaylistContainer li').removeClass('selected');
        $('#PlaylistContainer li').removeClass('selected');
        $(this).addClass('selected');
        getPlaylist($(this).attr("id"), '', '#TrackContainer tbody');
    });
    $('#PlaylistContainer li.item a.play').live('click', function () {
        getPlaylist($(this).parent().parent().attr("id"), 'autoplay', '#CurrentPlaylistContainer tbody');
        return false;
    });
    $('#PlaylistContainer li.item a.download').live('click', function (event) {
        var itemid = $(this).parent().parent().attr('id');
        downloadItem(itemid, 'playlist');
        return false;
    });
    $('#PlaylistContainer li.item a.add').live('click', function () {
        getPlaylist($(this).parent().parent().attr("id"), '', '#CurrentPlaylistContainer tbody');
        return false;
    });
    $('#action_RefreshPlaylists').click(function () {
        loadPlaylists(true);
        return false;
    });
    $('#action_DeletePlaylist').click(function () {
        if ($('#PlaylistContainer li.selected').length > 0) {
            if (confirmDelete()) {
                $('#PlaylistContainer li.selected').each(function () {
                    deletePlaylist($(this).attr("id"));
                });
            }
        }
        return false;
    });
    $('#action_SavePlaylist').click(function () {
        if ($('#PlaylistContainer li.selected').length > 0) {
            $('#PlaylistContainer li.selected').each(function () {
                savePlaylist($(this).attr("id"));
            });
        }
        return false;
    });
    $('#action_RemoveSongs').click(function () {
        if ($('#TrackContainer tr.selected').length > 0) {
            $('#TrackContainer tr.selected').each(function () {
                $(this).remove();
            });
        }
        return false;
    });
    $('#action_ShufflePlaylist').live('click', function () {
        $('#TrackContainer tbody tr.song').shuffle();
        refreshRowColor('#TrackContainer tbody');
        return false;
    });

    // Player Click Events
    $('#PlayTrack').live('click', function () {
        playPauseSong();
        return false;
    });
    $('#NextTrack').live('click', function () {
        var next;
        var length = $('#CurrentPlaylistContainer tr.song').size();
        if (length > 0) {
            next = $('#CurrentPlaylistContainer tr.playing').next();
        } else {
            next = $('#AlbumContainer tr.playing').next();
        }
        changeTrack(next);
        return false;
    });
    $('#PreviousTrack').live('click', function () {
        var prev = $('#CurrentPlaylistContainer tr.playing').prev();
        changeTrack(prev);
        return false;
    });
    $("a#coverartimage").fancybox({
        'hideOnContentClick': true,
        'type': 'image'
    });
    $('#songdetails a.rate').live('click', function (event) {
        var itemid = $('#songdetails_song').attr('childid');
        rateSong(itemid, 5);
        $(this).removeClass('rate');
        $(this).addClass('favorite');
        return false;
    });
    $('#songdetails a.favorite').live('click', function (event) {
        var itemid = $('#songdetails_song').attr('childid');
        rateSong(itemid, 0);
        $(this).removeClass('favorite');
        $(this).addClass('rate');
        return false;
    });

    // Side Bar Click Events
    $('#action_ToggleSideBar').live('click', function () {
        if ($.cookie('sidebar')) {
            $.cookie('sidebar', null);
            $('#SideBar').hide();
            stopUpdateChatMessages();
            stopUpdateNowPlaying();
        } else {
            $.cookie('sidebar', true, { expires: 365 });
            $('#SideBar').show();
            updateChatMessages();
            updateNowPlaying();
        }
        resizeContent();
        return false;
    });
    $('input#ChatMsg').keydown(function (e) {
        var unicode = e.charCode ? e.charCode : e.keyCode;
        if (unicode == 13) {
            var msg = $('#ChatMsg').val();
            if (msg != '') {
                addChatMessage(msg);
            }
            $('#ChatMsg').val("");
        }
    });

    // Preferences Click Events
    $('#SavePreferences').live('click', function () {
        var username = $('#Username').val();
        var password = $('#Password').val();
        $.cookie('username', username, { expires: 365 });
        $.cookie('password', password, { expires: 365 });
        var AutoAlbumSize = $('#AutoAlbumSize').val();
        var AutoPlaylistSize = $('#AutoPlaylistSize').val();
        $.cookie('AutoAlbumSize', AutoAlbumSize, { expires: 365 });
        $.cookie('AutoPlaylistSize', AutoPlaylistSize, { expires: 365 });
        var server = $('#Server').val();
        if (server != "") {
            $.cookie('Server', server, { expires: 365 });
        }
        var applicationname = $('#ApplicationName').val();
        if (applicationname != "") {
            $.cookie('ApplicationName', applicationname, { expires: 365 });
        }
        location.reload(true);
    });
    $('#HideAZ').live('click', function () {
        if ($('#HideAZ').is(':checked')) {
            $.cookie('HideAZ', '1', { expires: 365 });
            $('#BottomContainer').hide();
        } else {
            $.cookie('HideAZ', null);
            $('#BottomContainer').show();
        }
    });
    $('#EnableNotifications').live('click', function () {
        if ($('#EnableNotifications').is(':checked')) {
            requestPermissionIfRequired();
            if (hasNotificationPermission()) {
                $.cookie('EnableNotifications', '1', { expires: 365 });
            }
        } else {
            $.cookie('EnableNotifications', null);
        }
    });
    $('#ScrollTitle').live('click', function () {
        if ($('#ScrollTitle').is(':checked')) {
            $.cookie('ScrollTitle', '1', { expires: 365 });
        }
    });
    $('#Debug').live('click', function () {
        if ($('#Debug').is(':checked')) {
            $.cookie('Debug', '1', { expires: 365 });
            debug = true;
        }
    });
    $('input#Password').keydown(function (e) {
        var unicode = e.charCode ? e.charCode : e.keyCode;
        if (unicode == 13) {
            $('#SavePreferences').click();
        }
    });
    $('#ResetPreferences').live('click', function () {
        $.cookie('username', null);
        $.cookie('password', null);
        $.cookie('AutoAlbumSize', null);
        $.cookie('AutoPlaylistSize', null);
        $.cookie('Server', null);
        $.cookie('ApplicationName', null);
        $.cookie('HideAZ', null);
        location.reload(true);
    });
    $('#ChangeLogShowMore').live('click', function () {
        $('ul#ChangeLog li.log').each(function (i, el) {
            $(el).show();
        });
        return false;
    });

    // JQuery UI Sortable - Drag and drop sorting
    var fixHelper = function (e, ui) {
        ui.children().each(function () {
            $(this).width($(this).width());
        });
        return ui;
    };
    $("#CurrentPlaylistContainer tbody").sortable({
        helper: fixHelper,
        stop: function () {
            refreshRowColor('#CurrentPlaylistContainer tbody');
        }
    }).disableSelection();
    $("#TrackContainer tbody").sortable({
        helper: fixHelper,
        stop: function () {
            refreshRowColor('#TrackContainer tbody');
        }
    }).disableSelection();

});       // End document.ready