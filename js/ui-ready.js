$(document).ready(function () {
    //User config staff
    $('#Username').val($.cookie('username'));
    //$('#Password').val($.cookie('passwordenc'));
    $('#AutoPlaylists').val($.cookie('AutoPlaylists'));
    $('#AutoAlbumSize').val($.cookie('AutoAlbumSize'));
    $('#AutoPlaylistSize').val($.cookie('AutoPlaylistSize'));
    $('#Server').val($.cookie('Server'));
    $('#ApplicationName').val($.cookie('ApplicationName'));

    // Set Preferences defaults
    if ($.cookie('Theme')) {
        $('#Theme').val($.cookie('Theme'));
        var theme = $.cookie('Theme');
        switchTheme(theme);
    }
    if ($.cookie('HideAZ')) {
        $('#HideAZ').attr('checked', true);
    } else {
        $('#HideAZ').attr('checked', false);
    }
    if ($.cookie('Notification_Song')) {
        $('#Notification_Song').attr('checked', true);
    } else {
        $('#Notification_Song').attr('checked', false);
    }
    if ($.cookie('Notification_NowPlaying')) {
        $('#Notification_NowPlaying').attr('checked', true);
    } else {
        $('#Notification_NowPlaying').attr('checked', false);
    }
    if ($.cookie('ScrollTitle')) {
        $('#ScrollTitle').attr('checked', true);
    } else {
        $('#ScrollTitle').attr('checked', false);
    }
    if ($.cookie('Debug')) {
        $('#Debug').attr('checked', true);
        debug = true;
        soundManager.debugMode = true;
    } else {
        $('#Debug').attr('checked', false);
    }
    if ($.cookie('ForceFlash')) {
        $('#ForceFlash').attr('checked', true);
    } else {
        $('#ForceFlash').attr('checked', false);
    }
    if ($.cookie('SaveTrackPosition')) {
        $('#SaveTrackPosition').attr('checked', true);
    } else {
        $('#SaveTrackPosition').attr('checked', false);
    }
    if ($.cookie('AutoPilot')) {
        $.cookie('AutoPilot', null)
    }

    // Tabs
    $('.tabcontent').hide(); //Hide all content
    if (!$.cookie('username') && !$.cookie('passwordenc') && !$.cookie('Server')) {
        $('ul.tabs li a').each(function () {
            if ($(this).attr("href") == '#tabPreferences') {
                $(this).addClass("active"); //Add "active" class to selected tab
            }
        });
        $('#tabPreferences').show(); //Show first tab content
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
        $('a#logo').attr("href", $.cookie('Server'));
        $('a#logo').attr("title", 'Launch Subsonic');
        if ($.cookie('Notification_NowPlaying')) {
            updateNowPlaying(true);
        }
        ping();
    }

    // Tabs - Click Event
    $("ul.tabs li a").click(function () {
        $("ul.tabs li a").removeClass("active"); //Remove any "active" class
        $(this).addClass("active"); //Add "active" class to selected tab
        $(".tabcontent").hide(); //Hide all tab content

        var activeTab = $(this).attr("href"); //Find the href attribute value to identify the active tab + content
        $(activeTab).fadeIn('fast'); //Fade in the active ID content
        loadTabContent(activeTab);
    });

    // Ajax Loading Screen
    $("#toploading").ajaxStart(function () {
        $(this).show();
    });
    $("#toploading").ajaxStop(function () {
        $(this).hide();
    });

    // Keyboard shortcuts
    $(document).keydown(function (e) {
        var source = e.target.id;
        if (source != 'Search' && source != 'ChatMsg') {
            var unicode = e.charCode ? e.charCode : e.keyCode;
            // a-z
            if (unicode >= 65 && unicode <= 90 && $('#tabLibrary').is(':visible')) {
                var key = findKeyForCode(unicode);
                var el = '#index_' + key.toUpperCase();
                if ($(el).length > 0) {
                    $('#Artists').stop().scrollTo(el, 400);
                }
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
            } else if (unicode == 36 && $('#tabLibrary').is(':visible')) {
                $('#Artists').stop().scrollTo('#auto', 400);
            }
            if (unicode == 189) { // dash
                if (volume <= 100 && volume > 0 && source == '') {
                    volume += -10;
                    soundManager.setVolume('audio', volume);
                    updateMessage('Volume: ' + volume + '%');
                }
            }
            if (unicode == 187) { // equals
                if (volume < 100 && volume >= 0 && source == '') {
                    volume += 10;
                    soundManager.setVolume('audio', volume);
                    updateMessage('Volume: ' + volume + '%');
                }
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
        //rateSong(itemid, 5);
        starItem(itemid, true);
        $(this).removeClass('rate');
        $(this).addClass('favorite');
        return false;
    });
    $('tr.album a.favorite').live('click', function (event) {
        var itemid = $(this).parent().parent().attr('childid');
        //rateSong(itemid, 0);
        starItem(itemid, false);
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
        playSong(this, songid, albumid, 0, false);
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
            playSong(firstsong, songid, albumid, 0, false);
        } else {
            playSong($(this).parent().parent(), songid, albumid, 0, false);
        }
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
        //rateSong(songid, 5);
        starItem(songid, true);
        $(this).removeClass('rate');
        $(this).addClass('favorite');
        return false;
    });
    $('table.songlist tr.song a.favorite').live('click', function (event) {
        var songid = $(this).parent().parent().attr('childid');
        //rateSong(songid, 0);
        starItem(songid, false);
        $(this).removeClass('favorite');
        $(this).addClass('rate');
        return false;
    });
    $('table.songlist tr.song a.albumlink').live('click', function (event) {
        var parentid = $(this).parent().parent().attr('parentid');
        if (parentid != '' && parentid !== undefined) {
            getAlbums(parentid, 'link', '#AlbumRows');
        }
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
    $("#submenu_AddToPlaylist a").live("click", function (event) {
        var id = $(this).attr('childid');
        if (id == 'new') {
            addToPlaylist('new', '');
        } else if (id != '' && id !== undefined) {
            addToPlaylist(id, '');
        }
        return false;
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
        //loadArtists("", true);
        if ($.cookie('MusicFolders')) {
            loadArtists($.cookie('MusicFolders'), true);
        } else {
            loadArtists(null, true);
        }
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
        //$('#CurrentPlaylistContainer tbody tr.song').shuffle();
        $('#CurrentPlaylistContainer tbody tr.song:not(#CurrentPlaylistContainer tbody tr.playing)').shuffle();
        refreshRowColor('#CurrentPlaylistContainer tbody');
        var songid = $('#CurrentPlaylistContainer tbody tr.playing').attr('childid');
        if (songid !== undefined) {
            $('#CurrentPlaylist').scrollTo($('#' + songid), 400);
        }
        return false;
    });
    $('#action_Empty').live('click', function () {
        $('#CurrentPlaylistContainer tbody').empty();
        deleteCurrentPlaylist();
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
    $("#submenu_AddCurrentToPlaylist a").live("click", function (event) {
        var id = $(this).attr('childid');
        if (id == 'new') {
            addToPlaylist('new', 'current');
        } else if (id != '' && id !== undefined) {
            addToPlaylist(id, 'current');
        }
        return false;
    });
    $('#songdetails').click(function (e) {
        var source = e.target.nodeName;
        var hash = window.location.hash;
        if (source != 'IMG' && hash != '#tabCurrent') {
            $('#action_tabCurrent').click();
        }
    });
    $('#songdetails').mouseover(function () {
        $(this).addClass('hover');
        /*
        var total = $("#CurrentPlaylistContainer tr.song").size();
        if (total > 0) {
        var submenu = $('div#submenu_CurrentPlaylist');
        //get the position of the placeholder element
        pos = $(this).offset();
        width = $(this).width();
        height = $(this).height();
        //show the menu directly over the placeholder
        submenu.css({ "left": (pos.left - 1) + "px", "top": (pos.top - height - 152) + "px" }).show();

        var html = '';
        var rowcolor;
        var i = 0;
        var playing = false;
        $("#CurrentPlaylistContainer tr.song").each(function (e) {
        if (i < 10) {
        if (i % 2 === 0) {
        rowcolor = 'even';
        } else {
        rowcolor = 'odd';
        }
        var value = $(this).find("td.title").html();
        if ($(this).hasClass('playing')) {
        html += '<tr class=\"song playing ' + rowcolor + '\"><td></td><td>' + value + '</td></tr>';
        playing = true;
        } else {
        html += '<tr class=\"song ' + rowcolor + '\"><td></td><td>' + value + '</td></tr>';
        }
        } else {
        return false;
        }
        i++;
        });
        $('#CurrentPlaylistPreviewContainer tbody').html(html);
        if (playing) {
        $('#submenu_CurrentPlaylist').scrollTo($('#CurrentPlaylistPreviewContainer tr.playing'), 400);
        }
        }
        */
    });
    $('#songdetails').mouseout(function () {
        $(this).removeClass('hover')
        //$('div.submenu').hide();
    });
    $('#CurrentPlaylist').mouseenter(function () {
        var html = $('#status').html();
        if (html != '') {
            $('#status').fadeIn();
        }
    });
    $('#CurrentPlaylist').mouseleave(function () {
        $('#status').stop().fadeOut();
    });

    $('#action_CurrentSelectAll').click(function () {
        var count = 0;
        $('#CurrentPlaylist tr.song').each(function () {
            $(this).addClass('selected');
            count++;
        });
        updateMessage(count + ' Song(s) Selected');
        return false;
    });
    $('#action_CurrentSelectNone').click(function () {
        $('#CurrentPlaylist tr.song').each(function () {
            $(this).removeClass('selected');
        });
        return false;
    });
    $('#action_AutoPilot').click(function () {
        var msg;
        if ($.cookie('AutoPilot')) {
            $.cookie('AutoPilot', null);
            msg = 'Autopilot Off';
            $('#action_AutoPilot').removeClass('selected');
        } else {
            $('#CurrentPlaylistContainer tbody').empty();
            getRandomSongList('', '#CurrentPlaylistContainer tbody', '', '');
            $.cookie('AutoPilot', true, { expires: 365 });
            $('#action_AutoPilot').addClass('selected');
            msg = 'Autopilot On';
        }
        $(this).attr("title", msg);
        updateMessage(msg);
        return false;
    });

    // Playlist Click Events
    $('#AutoPlaylistContainer li.item, #FolderContainer li.item').live('click', function () {
        $('#AutoPlaylistContainer li, #FolderContainer li, #PlaylistContainer li').removeClass('selected');
        $(this).addClass('selected');
        var genre = $(this).data('genre');
        var folder = $(this).data('folder');
        getRandomSongList('', '#TrackContainer tbody', genre, folder);
    });
    $('#AutoPlaylistContainer li.item a.play, #FolderContainer li.item a.play').live('click', function () {
        var genre = $(this).data('genre');
        var folder = $(this).data('folder');
        getRandomSongList('autoplay', '#CurrentPlaylistContainer tbody', genre, folder);
        return false;
    });
    $('#AutoPlaylistContainer li.item a.add, #FolderContainer li.item a.add').live('click', function () {
        var genre = $(this).data('genre');
        var folder = $(this).data('folder');
        getRandomSongList('', '#CurrentPlaylistContainer tbody', genre, folder);
        return false;
    });
    $('#PlaylistContainer li.item').live('click', function () {
        $('#AutoPlaylistContainer li, #FolderContainer li, #PlaylistContainer li').removeClass('selected');
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
        loadFolders(true);
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

    // Podcast Click Events
    $('#ChannelsContainer li.item').live('click', function () {
        $('#AutoChannelsContainer li').removeClass('selected');
        $('#ChannelsContainer li').removeClass('selected');
        $(this).addClass('selected');
        getPodcast($(this).attr("id"), '', '#PodcastContainer tbody');
    });
    $('#ChannelsContainer li.item a.play').live('click', function () {
        getPodcast($(this).parent().parent().attr("id"), 'autoplay', '#CurrentPlaylistContainer tbody');
        return false;
    });
    $('#ChannelsContainer li.item a.download').live('click', function (event) {
        var itemid = $(this).parent().parent().attr('albumid');
        downloadItem(itemid, 'item');
        return false;
    });
    $('#ChannelsContainer li.item a.add').live('click', function () {
        getPodcast($(this).parent().parent().attr("id"), '', '#CurrentPlaylistContainer tbody');
        return false;
    });
    $('#action_RefreshPodcasts').click(function () {
        loadPodcasts(true);
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
        if (itemid !== undefined) {
            starItem(itemid, true);
            $(this).removeClass('rate');
            $(this).addClass('favorite');
        }
        return false;
    });
    $('#songdetails a.favorite').live('click', function (event) {
        var itemid = $('#songdetails_song').attr('childid');
        //rateSong(itemid, 0);
        starItem(itemid, false);
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
            updateNowPlaying(false);
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
        if (password != "") {
            $.cookie('passwordenc', 'enc:' + HexEncode(password), { expires: 365 });
        }
        var AutoPlaylists = $('#AutoPlaylists').val();
        $.cookie('AutoPlaylists', AutoPlaylists, { expires: 365 });
        var AutoAlbumSize = $('#AutoAlbumSize').val();
        $.cookie('AutoAlbumSize', AutoAlbumSize, { expires: 365 });
        var AutoPlaylistSize = $('#AutoPlaylistSize').val();
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
    $('#Theme').live('change', function () {
        var theme = $(this).val();
        switchTheme(theme);
        $.cookie('Theme', theme, { expires: 365 });
    });
    $('#Genres').live('change', function () {
        var genre = $(this).val();
        var currentGenres = $('#AutoPlaylists').val();
        var newGenres;
        if (currentGenres == '') {
            newGenres = genre;
        } else {
            newGenres = currentGenres + ', ' + genre;
        }
        $('#AutoPlaylists').val(newGenres);
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
    $('#Notification_Song').live('click', function () {
        if ($('#Notification_Song').is(':checked')) {
            requestPermissionIfRequired();
            if (hasNotificationPermission()) {
                $.cookie('Notification_Song', '1', { expires: 365 });
            }
        } else {
            $.cookie('Notification_Song', null);
        }
    });
    $('#Notification_NowPlaying').live('click', function () {
        if ($('#Notification_NowPlaying').is(':checked')) {
            requestPermissionIfRequired();
            if (hasNotificationPermission()) {
                $.cookie('Notification_NowPlaying', '1', { expires: 365 });
            }
        } else {
            $.cookie('Notification_NowPlaying', null);
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
        } else {
            $.cookie('Debug', null);
            debug = false;
        }
    });
    $('#ForceFlash').live('click', function () {
        if ($('#ForceFlash').is(':checked')) {
            $.cookie('ForceFlash', '1', { expires: 365 });
        } else {
            $.cookie('ForceFlash', null);
        }
        location.reload(true);
    });
    $('#SaveTrackPosition').live('click', function () {
        if ($('#SaveTrackPosition').is(':checked')) {
            $.cookie('SaveTrackPosition', '1', { expires: 365 });
            var sm = soundManager.getSoundById('audio');
            if (sm !== undefined) {
                saveTrackPosition();
            }
        } else {
            $.cookie('SaveTrackPosition', null);
            $.cookie('CurrentSong', null);
            deleteCurrentPlaylist();
        }
        //location.reload(true);
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

});                                                                                       // End document.ready

