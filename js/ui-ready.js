$(document).ready(function () {
    // Inject Basic Auth
    /*
    $.ajaxSetup({
    beforeSend: function (req) {
    req.setRequestHeader('Authorization', auth);
    }
    //headers: { "Authorization": "Basic " + auth }
    });
    */
    // Fill Settings from Cookies
    if (getCookie('username')) { $('#Username').val(getCookie('username')); }
    //$('#Password').val(getCookie('passwordenc'));
    if (getCookie('AutoPlaylists')) { $('#AutoPlaylists').val(getCookie('AutoPlaylists')); }
    if (getCookie('AutoAlbumSize')) { $('#AutoAlbumSize').val(getCookie('AutoAlbumSize')); }
    if (getCookie('AutoPlaylistSize')) { $('#AutoPlaylistSize').val(getCookie('AutoPlaylistSize')); }
    if (getCookie('Server')) { $('#Server').val(getCookie('Server')); }
    if (getCookie('ApplicationName')) { $('#ApplicationName').val(getCookie('ApplicationName')); }

    // Set Settings defaults
    if (getCookie('Theme')) {
        $('#Theme').val(getCookie('Theme'));
        var theme = getCookie('Theme');
        switchTheme(theme);
    }
    if (getCookie('HideAZ')) {
        $('#HideAZ').attr('checked', true);
    } else {
        $('#HideAZ').attr('checked', false);
    }
    if (getCookie('Notification_Song')) {
        $('#Notification_Song').attr('checked', true);
    } else {
        $('#Notification_Song').attr('checked', false);
    }
    if (getCookie('Notification_NowPlaying')) {
        $('#Notification_NowPlaying').attr('checked', true);
    } else {
        $('#Notification_NowPlaying').attr('checked', false);
    }
    if (getCookie('ScrollTitle')) {
        $('#ScrollTitle').attr('checked', true);
    } else {
        $('#ScrollTitle').attr('checked', false);
    }
    if (getCookie('Debug')) {
        $('#Debug').attr('checked', true);
        debug = true;
    } else {
        $('#Debug').attr('checked', false);
    }
    if (getCookie('ForceFlash')) {
        $('#ForceFlash').attr('checked', true);
    } else {
        $('#ForceFlash').attr('checked', false);
    }
    if (getCookie('Protocol')) {
        $('#Protocol').attr('checked', true);
    } else {
        $('#Protocol').attr('checked', false);
    }
    if (getCookie('AutoPilot')) {
        setCookie('AutoPilot', null)
    }
    // Version check
    if (getCookie('CurrentVersion')) {
        if (checkVersionNewer(parseVersionString(getCookie('CurrentVersion')), parseVersionString(currentVersion))) {
            updateMessage('MiniSub updated to v' + currentVersion, false);
            setCookie('CurrentVersion', currentVersion);
        }
    } else {
        setCookie('CurrentVersion', currentVersion);
    }

    // Sway.fm Unity Plugin
    unity = UnityMusicShim();
    unity.setSupports({
        playpause: true,
        next: true,
        previous: true
    });
    unity.setCallbackObject({
        pause: function () {
            if (debug) { console.log("Unity: Recieved playpause command"); }
            playPauseSong();
        },
        next: function () {
            if (debug) { console.log("Unity: Recieved next command"); }
            $('#NextTrack').click();
        },
        previous: function () {
            if (debug) { console.log("Unity: Recieved previous command"); }
            $('#PreviousTrack').click();
        }
    });

    // Table Sorting
    $('#CurrentPlaylistContainer').stupidtable();
    $('#TrackContainer').stupidtable();
    $('#PodcastContainer').stupidtable();
    $('#AlbumContainer').stupidtable();

    $('#action_RequestURL').click(function () {
        askPermission();
        return false;
    });

    function loadTabContent(tab) {
        var tabid = '#action_' + tab.substring(1, tab.length);
        $("ul.tabs li a").removeClass("active"); //Remove any "active" class
        $(tabid).addClass("active"); //Add "active" class to selected tab
        $(".tabcontent").hide(); //Hide all tab content
        window.location.hash = tab;
        switch (tab) {
            case '#tabLibrary':
                if (debug) { console.log("TAG LIBRARY"); }
                if (getCookie('MusicFolders')) {
                    loadArtists(getCookie('MusicFolders'), false);
                } else {
                    loadArtists();
                }
                getMusicFolders();
                break;
            case '#tabQueue':
                if (debug) { console.log("TAG QUEUE"); }
                var header = generateSongHeaderHTML();
                $('#CurrentPlaylistContainer thead').html(header);
                var count = $('#CurrentPlaylistContainer tbody tr.song').size();
                updateStatus('#status_Current', countCurrentPlaylist('#CurrentPlaylistContainer'));
                if (count > 0) {
                    $('#actionsQueue a.button').removeClass('disabled');
                }
                break;
            case '#tabPlaylists':
                if (debug) { console.log("TAG PLAYLIST"); }
                loadPlaylists();
                loadFolders();
                loadAutoPlaylists();
                updateStatus('#status_Playlists', countCurrentPlaylist('#TrackContainer'));
                break;
            case '#tabPodcasts':
                if (debug) { console.log("TAG PODCAST"); }
                loadPodcasts();
                updateStatus('#status_Podcasts', countCurrentPlaylist('#PodcastContainer'));
                break;
            case '#tabVideos':
                if (debug) { console.log("TAG VIDEOS"); }
                loadVideos(true);
                break;
            case '#tabSettings':
                getGenres();
                break;
            default:
                break;
        }
        $(tab).fadeIn('fast'); //Fade in the active ID content
    }

    // Tabs
    $('.tabcontent').hide(); //Hide all content
    if (!getCookie('username') && !getCookie('passwordenc') && !getCookie('Server')) { // Show Settings
        loadTabContent('#tabSettings');
    } else {
        if (window.location.hash) {
            var hash = window.location.hash;
            loadTabContent(hash);
        } else {
            var firstTab = $("ul.tabs li:first a").attr("href");
            loadTabContent(firstTab);
        }
        $('#logo').attr("href", getCookie('Server'));
        $('#logo').attr("title", 'Launch Subsonic');
        if (getCookie('Notification_NowPlaying')) {
            updateNowPlaying(true);
        }
        ping();
    }

    // Tabs - Click Event
    $("ul.tabs li a").click(function () {
        var currentTab = window.location.hash;
        var activeTab = $(this).attr("href"); //Find the href attribute value to identify the active tab + content
        if (currentTab != activeTab) {
            if (getCookie('username') && getCookie('passwordenc') && getCookie('Server')) {
                loadTabContent(activeTab);
            }
        }
        return false;
    });

    // Show/Hide Loading
    $("#toploading").ajaxStart(function () {
        $(this).show();
    });
    $("#toploading").ajaxStop(function () {
        $(this).hide();
    });

    // Keyboard shortcuts
    $(document).keydown(function (e) {
        var source = e.target.id;
        if (source != 'Search' && source != 'ChatMsg' && source != 'AutoPlaylists') {
            var unicode = e.charCode ? e.charCode : e.keyCode;
            if (unicode >= 65 && unicode <= 90 && $('#tabLibrary').is(':visible')) { // a-z
                var key = findKeyForCode(unicode);
                if (key == 'x' || key == 'y' || key == 'z') {
                    key = 'x-z';
                }
                var el = '#index_' + key.toUpperCase();
                if ($(el).length > 0) {
                    $('#Artists').stop().scrollTo(el, 400);
                }
            } else if (unicode == 39 || unicode == 176) { // right arrow
                $('#NextTrack').click();
            } else if (unicode == 37 || unicode == 177) { // back arrow
                $('#PreviousTrack').click();
            } else if (unicode == 32 || unicode == 179 || unicode == 0179) { // spacebar
                playPauseSong();
                return false;
            } else if (unicode == 36 && $('#tabLibrary').is(':visible')) { // home
                $('#Artists').stop().scrollTo('#MusicFolders', 400);
            }
            if (unicode == 189) { // dash - volume down
                var volume = getCookie('Volume') ? parseFloat(getCookie('Volume')) : 1;
                if (volume <= 1 && volume > 0 && source == '') {
                    volume += -.1;
                    $("#playdeck").jPlayer({
                        volume: volume
                    });
                    setCookie('Volume', volume);
                    //updateMessage('Volume: ' + Math.round(volume * 100) + '%');
                }
            }
            if (unicode == 187) { // equals - volume up
                var volume = getCookie('Volume') ? parseFloat(getCookie('Volume')) : 1;
                if (volume < 1 && volume >= 0 && source == '') {
                    volume += .1;
                    $("#playdeck").jPlayer({
                        volume: volume
                    });
                    setCookie('Volume', volume);
                    //updateMessage('Volume: ' + Math.round(volume * 100) + '%');
                }
            }
        }
    });

    // Library Click Event
    $('#MusicFolders').live('change', function () {
        var folder = $(this).val();
        if (folder != 'all') {
            setCookie('MusicFolders', folder);
        } else {
            setCookie('MusicFolders', null);
        }
        loadArtists(folder, true);
    });
    $('#ArtistContainer li.item').live('click', function () {
        $('#AutoAlbumContainer li').removeClass('selected');
        $('#ArtistContainer li').removeClass('selected');
        $(this).addClass('selected');
        getMusicDirectory($(this).attr("id"), '', '#AlbumContainer tbody', '');
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
    $('#BreadHome').live('click', function () {
        $('#Artists').stop().scrollTo('#MusicFolders', 400);
        return false;
    });
    $('#BreadCrumbs a').live('click', function () {
        var parentid = $(this).attr('parentid');
        var albumid = $(this).attr('albumid');
        if (typeof parentid != 'undefined') {
            getMusicDirectory(parentid, '', '#AlbumContainer tbody', '');
        } else if (typeof albumid != 'undefined') {
            parentid = $(this).prev().attr('parentid');
            getMusicDirectory(albumid, '', '#AlbumContainer tbody', parentid);
        }
        return false;
    });
    $('tr.album').live('click', function (e) {
        var albumid = $(this).attr('childid');
        var artistid = $(this).attr('parentid');
        getMusicDirectory(albumid, '', '#AlbumContainer tbody', artistid);
        return false;
    });
    $('tr.album a.play').live('click', function (e) {
        var albumid = $(this).parent().parent().parent().attr('childid');
        getMusicDirectory(albumid, 'autoplay', '#CurrentPlaylistContainer', '');
        return false;
    });
    $('tr.album a.add').live('click', function (e) {
        var albumid = $(this).parent().parent().parent().attr('childid');
        getMusicDirectory(albumid, 'add', '#CurrentPlaylistContainer', '');
        return false;
    });
    $('tr.album a.download').live('click', function (event) {
        var itemid = $(this).parent().parent().parent().attr('childid');
        downloadItem(itemid, 'item');
        return false;
    });
    $('tr.album a.rate').live('click', function (event) {
        var itemid = $(this).parent().parent().parent().attr('childid');
        //rateSong(itemid, 5);
        starItem(itemid, true);
        $(this).removeClass('rate');
        $(this).addClass('favorite');
        return false;
    });
    $('tr.album a.favorite').live('click', function (event) {
        var itemid = $(this).parent().parent().parent().attr('childid');
        //rateSong(itemid, 0);
        starItem(itemid, false);
        $(this).removeClass('favorite');
        $(this).addClass('rate');
        return false;
    });
    $('tr.album td.artist a').live('click', function (event) {
        var parentid = $(this).parent().parent().attr('parentid');
        if (parentid !== "undefined") {
            $('#AutoAlbumContainer li').removeClass('selected');
            $('#ArtistContainer li').removeClass('selected');
            getMusicDirectory(parentid, '', '#AlbumContainer tbody', '');
        }
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
        var songid = $(this).attr('childid');
        var albumid = $(this).attr('parentid');
        getSongData(this, songid, albumid, 0, false);
    });
    $('table.songlist tr.song a.play').live('click', function (event) {
        var songid = $(this).parent().parent().parent().attr('childid');
        var albumid = $(this).parent().parent().parent().attr('parentid');
        if (!$('#tabQueue').is(':visible')) {
            $('#CurrentPlaylistContainer tbody').empty();
            var track = $(this).parent().parent().parent();
            $(track).clone().appendTo('#CurrentPlaylistContainer');
            id = 0;
            count = 0;
            while (id !== undefined) {
                track = track.next();
                id = $(track).attr('childid');
                $(track).clone().appendTo('#CurrentPlaylistContainer');
                count++;
            }
            updateMessage(count + ' Song(s) Added', true);
            var firstsong = $('#CurrentPlaylistContainer tr.song:first');
            songid = $(firstsong).attr('childid');
            albumid = $(firstsong).attr('parentid');
            getSongData(firstsong, songid, albumid, 0, false);
        } else {
            getSongData($(this).parent().parent().parent(), songid, albumid, 0, false);
        }
        return false;
    });
    $('table.songlist tr.song a.download').live('click', function (event) {
        var itemid = $(this).parent().parent().parent().attr('childid');
        downloadItem(itemid, 'item');
        return false;
    });
    $('table.songlist tr.song a.add').live('click', function (event) {
        var track = $(this).parent().parent().parent();
        $(track).clone().appendTo('#CurrentPlaylistContainer');
        return false;
    });
    $('table.songlist tr.song a.remove').live('click', function (event) {
        var track = $(this).parent().parent().parent();
        $(track).remove();
        return false;
    });
    $('table.songlist tr.song a.rate').live('click', function (event) {
        var songid = $(this).parent().parent().parent().attr('childid');
        //rateSong(songid, 5);
        starItem(songid, true);
        $(this).removeClass('rate');
        $(this).addClass('favorite');
        return false;
    });
    $('table.songlist tr.song a.favorite').live('click', function (event) {
        var songid = $(this).parent().parent().parent().attr('childid');
        //rateSong(songid, 0);
        starItem(songid, false);
        $(this).removeClass('favorite');
        $(this).addClass('rate');
        return false;
    });
    $('table.songlist tr.song td.album a').live('click', function (event) {
        var parentid = $(this).parent().parent().attr('parentid');
        if (parentid != '' && parentid !== undefined) {
            $('#AutoAlbumContainer li').removeClass('selected');
            $('#ArtistContainer li').removeClass('selected');
            getMusicDirectory(parentid, 'link', '#AlbumContainer tbody', '');
        }
        return false;
    });
    $('li.index').live('click', function (e) {
        $('#Artists').stop().scrollTo('#auto', 400);
        return false;
    });

    // Music Library Click Events
    $('#action_AddToPlaylist').click(function () {
        if (!$(this).hasClass('disabled')) {
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
    $('a#action_AddToQueue').click(function () {
        if (!$(this).hasClass('disabled')) {
            if ($('#AlbumContainer tr.selected').size() > 0) {
                addToCurrent(false);
            } else {
                addToCurrent(true);
            }
        }
        return false;
    });
    $('a#action_PlayAlbum').click(function () {
        if (!$(this).hasClass('disabled')) {
            $('#CurrentPlaylistContainer tbody').empty();
            addToCurrent(true);
            // Start playing song
            var first = $('#CurrentPlaylistContainer tr.song').first();
            changeTrack(first);
        }
        return false;
    });
    $('#action_RefreshArtists').click(function () {
        if (getCookie('MusicFolders')) {
            loadArtists(getCookie('MusicFolders'), true);
        } else {
            loadArtists(null, true);
        }
        return false;
    });
    $('#action_RescanLibrary').click(function () {
        rescanLibrary();
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
        if (!$(this).hasClass('disabled')) {
            $('#Albums tr.song').each(function () {
                $(this).addClass('selected');
            });
        }
        return false;
    });
    $('#action_SelectNone').click(function () {
        if (!$(this).hasClass('disabled')) {
            $('#Albums tr.song').each(function () {
                $(this).removeClass('selected');
            });
        }
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
        if (query != '') {
            var type = $('#SearchType').val();
            search(type, query);
            $('#Search').val("");
        }
        return false;
    });
    $('#action_PreviousAlbumList').live('click', function () {
        var type = $('#status_Library').data('type');
        var offset = 0;
        if ($('#status_Library').data('offset') != '') {
            offset = $('#status_Library').data('offset');
        }
        var currOffset = 15;
        if (getCookie('AutoAlbumSize')) {
            currOffset = getCookie('AutoAlbumSize');
        }
        if (offset > 0) {
            $('#status_Library').data('offset', parseInt(offset) - parseInt(currOffset));
            getAlbumListBy(type, parseInt(offset) - parseInt(currOffset));
        }
        return false;
    });
    $('#action_NextAlbumList').live('click', function () {
        var currOffset = 15;
        if (getCookie('AutoAlbumSize')) {
            currOffset = getCookie('AutoAlbumSize');
        }
        var count = $('#AlbumContainer tr.album').size();
        if (count == currOffset) {
            var type = $('#status_Library').data('type');
            var offset = 0;
            if ($('#status_Library').data('offset') != '') {
                offset = $('#status_Library').data('offset');
            }
            $('#status_Library').data('offset', parseInt(offset) + parseInt(currOffset));
            getAlbumListBy(type, parseInt(offset) + parseInt(currOffset));
        }
        return false;
    });

    // Play Queue Click Events
    $('#action_Shuffle').live('click', function () {
        if (!$(this).hasClass('disabled')) {
            $('#CurrentPlaylistContainer tbody tr.song:not(#CurrentPlaylistContainer tbody tr.playing)').shuffle();
            /* Sets currently playing song first in list after sort
            $('#CurrentPlaylistContainer tbody tr.song').shuffle();
            $('#CurrentPlaylistContainer tbody tr.playing').insertBefore($('#CurrentPlaylistContainer tbody tr:first'));
            */
            $('#CurrentPlaylistContainer thead').find('th').removeClass('sorted ascending descending');
            var songid = $('#CurrentPlaylistContainer tbody tr.playing').attr('childid');
            if (songid !== undefined) {
                $('#CurrentPlaylist').scrollTo($('#' + songid), 400);
            }
        }
        return false;
    });
    $('#action_Empty').live('click', function () {
        if (!$(this).hasClass('disabled')) {
            $('#CurrentPlaylistContainer tbody').empty();
            deleteCurrentPlaylist();
            updateStatus('#status_Current', '');
        }
        return false;
    });
    $('#action_AddCurrentToPlaylist').click(function () {
        if (!$(this).hasClass('disabled')) {
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
        }
        return false;
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
        if (source != 'A' && source != 'IMG' && hash != '#tabQueue') {
            loadTabContent('#tabQueue');
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
    });
    $('#action_CurrentSelectAll').click(function () {
        if (!$(this).hasClass('disabled')) {
            var count = 0;
            $('#CurrentPlaylist tr.song').each(function () {
                $(this).addClass('selected');
                count++;
            });
            updateMessage(count + ' Song(s) Selected', true);
        }
        return false;
    });
    $('#action_CurrentSelectNone').click(function () {
        if (!$(this).hasClass('disabled')) {
            $('#CurrentPlaylist tr.song').each(function () {
                $(this).removeClass('selected');
            });
        }
        return false;
    });
    $('#action_CurrentRemoveSongs').click(function () {
        if (!$(this).hasClass('disabled')) {
            if ($('#CurrentPlaylist tr.selected').length > 0) {
                $('#CurrentPlaylist tr.selected').each(function () {
                    $(this).remove();
                });
            }
        }
        return false;
    });
    $('#action_AutoPilot').click(function () {
        var msg;
        if (getCookie('AutoPilot')) {
            setCookie('AutoPilot', null);
            msg = 'Autopilot Off';
            $('#action_AutoPilot').removeClass('selected');
        } else {
            setCookie('AutoPilot', true);
            $('#action_AutoPilot').addClass('selected');
            msg = 'Autopilot On';
            var audio = typeof $("#playdeck").data("jPlayer") != 'undefined' ? true : false;
            var folder = '';
            if (getCookie('MusicFolders')) {
                folder = getCookie('MusicFolders')
            }
            if ($('#CurrentPlaylistContainer tbody').html() == '' && !audio) {
                $('#CurrentPlaylistContainer tbody').empty();
                getRandomSongList('autoplay', '#CurrentPlaylistContainer tbody', '', folder);
                $('#tabQueue a.button').removeClass('disabled');
            } else {
                getRandomSongList('', '#CurrentPlaylistContainer tbody', '', folder);
                $('#tabQueue a.button').removeClass('disabled');
            }
        }
        $(this).attr("title", msg);
        updateMessage(msg, true);
        return false;
    });
    var preview = true;
    $('#action_Preview').click(function () {
        var msg;
        if (preview) {
            //setCookie('Preview', null);
            previewStarredCoverArt();
            //$('#action_Preview').addClass('selected');
            msg = 'Preview On';
            //preview = false;
        } else {
            //setCookie('Preview', true);
            //$('#action_Preview').removeClass('selected');
            //msg = 'Preview Off';
        }
        $(this).attr("title", msg);
        updateMessage(msg, true);
        return false;
    });

    // Playlist Click Events
    $('#AutoPlaylistContainer li.item').live('click', function () {
        $('#AutoPlaylistContainer li, #FolderContainer li, #PlaylistContainer li').removeClass('selected');
        $(this).addClass('selected');
        var genre = $(this).data('genre') !== undefined ? $(this).data('genre') : '';
        var folder = getCookie('MusicFolders') ? getCookie('MusicFolders') : '';
        $('#playlistActions a.button').addClass('disabled');
        getRandomSongList('', '#TrackContainer tbody', genre, folder);
    });
    $('#AutoPlaylistContainer li.item a.play').live('click', function () {
        var genre = $(this).data('genre') !== undefined ? $(this).data('genre') : '';
        var folder = getCookie('MusicFolders') ? getCookie('MusicFolders') : '';
        getRandomSongList('autoplay', '#CurrentPlaylistContainer tbody', genre, folder);
        return false;
    });
    $('#AutoPlaylistContainer li.item a.add').live('click', function () {
        var genre = $(this).data('genre') !== undefined ? $(this).data('genre') : '';
        var folder = getCookie('MusicFolders') ? getCookie('MusicFolders') : '';
        getRandomSongList('', '#CurrentPlaylistContainer tbody', genre, folder);
        return false;
    });
    $('#FolderContainer li.item').live('click', function () {
        $('#AutoPlaylistContainer li, #FolderContainer li, #PlaylistContainer li').removeClass('selected');
        $(this).addClass('selected');
        var folder = $(this).data('folder') !== undefined ? $(this).data('folder') : '';
        $('#playlistActions a.button').addClass('disabled');
        getRandomSongList('', '#TrackContainer tbody', '', folder);
    });
    $('#FolderContainer li.item a.play').live('click', function () {
        var folder = $(this).data('folder') !== undefined ? $(this).data('folder') : '';
        getRandomSongList('autoplay', '#CurrentPlaylistContainer tbody', '', folder);
        return false;
    });
    $('#FolderContainer li.item a.add').live('click', function () {
        var folder = $(this).data('folder') !== undefined ? $(this).data('folder') : '';
        getRandomSongList('', '#CurrentPlaylistContainer tbody', '', folder);
        return false;
    });
    $('#PlaylistContainer li.item').live('click', function () {
        $('#AutoPlaylistContainer li, #FolderContainer li, #PlaylistContainer li').removeClass('selected');
        $(this).addClass('selected');
        $('#playlistActions a.button').removeClass('disabled');
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
    $('#action_NewPlaylist').click(function () {
        newPlaylist();
        return false;
    });
    $('#action_DeletePlaylist').click(function () {
        if (!$(this).hasClass('disabled')) {
            if ($('#PlaylistContainer li.selected').length > 0) {
                if (confirmDelete()) {
                    $('#PlaylistContainer li.selected').each(function () {
                        deletePlaylist($(this).attr("id"));
                    });
                }
            }
        }
        return false;
    });
    $('#action_SavePlaylist').click(function () {
        if (!$(this).hasClass('disabled')) {
            if ($('#PlaylistContainer li.selected').length > 0) {
                $('#PlaylistContainer li.selected').each(function () {
                    savePlaylist($(this).attr("id"));
                });
            }
        }
        return false;
    });
    $('#action_RemoveSongs').click(function () {
        if (!$(this).hasClass('disabled')) {
            if ($('#TrackContainer tr.selected').length > 0) {
                $('#TrackContainer tr.selected').each(function () {
                    $(this).remove();
                });
            }
        }
        return false;
    });
    $('#action_ShufflePlaylist').live('click', function () {
        if (!$(this).hasClass('disabled')) {
            $('#TrackContainer thead').find('th').removeClass('sorted ascending descending');
            $('#TrackContainer tbody tr.song').shuffle();
        }
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

    // Video Click Events
    $('#VideosContainer tr.video').live('dblclick', function (e) {
        e.preventDefault();
        var id = $(this).attr('childid');
        $(this).find('a.play').click();
        //var bitrate = $(this).attr('bitrate');
        //playVideo(id, bitrate);
    });
    $('#action_RefreshVideos').click(function () {
        loadVideos(true);
        return false;
    });

    // Player Click Events
    $('#NextTrack').live('click', function () {
        var next;
        var length = $('#CurrentPlaylistContainer tr.song').size();
        if (length > 0) {
            next = $('#CurrentPlaylistContainer tr.playing').next();
        } else {
            next = $('#AlbumContainer tr.playing').next();
        }
        //changeTrack(next);
        if (!changeTrack(next)) {
            if (getCookie('AutoPilot')) {
            getRandomSongList('autoplayappend', '#CurrentPlaylistContainer tbody', '', '');
            }
        }
        return false;
    });
    $('#PreviousTrack').live('click', function () {
        var prev = $('#CurrentPlaylistContainer tr.playing').prev();
        changeTrack(prev);
        return false;
    });

    $("a#coverartimage").fancybox({
        beforeShow : function() {
            this.title = $('#songdetails_artist').html();
        },
        afterLoad : function() {
            //this.inner.prepend( '<h1>1. My custom title</h1>' );
            //this.content = '<h1>2. My custom title</h1>';
        },
        hideOnContentClick: true,
        type: 'image',
        openEffect: 'none',
        closeEffect: 'none',
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
    $('#audiocontainer .scrubber').mouseover(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '8px' });
    });
    $('#audiocontainer .scrubber').mouseout(function (e) {
        $('.audiojs .scrubber').stop().animate({ height: '4px' });
    });
    $('#action_ShuffleMode').live('click', function () { // This is not being used currently
        clickButton(this);
        return false;
    });
    /*
    $('#action_Mute').live('click', function () {
    if (clickButton(this)) {
    $("#playdeck").jPlayer("mute");
    } else {
    $("#playdeck").jPlayer("unmute");
    }
    return false;
    });
    */

    // Side Bar Click Events
    $('#action_ToggleSideBar').live('click', function () {
        if (getCookie('sidebar')) {
            setCookie('sidebar', null);
            $('#SideBar').hide();
            stopUpdateChatMessages();
            stopUpdateNowPlaying();
        } else {
            setCookie('sidebar', true);
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

    // Settings Click Events
    $('#SaveSettings').live('click', function () {
        if ($('#Username').val() != "") {
            username = $('#Username').val();
            setCookie('username', username);
        }
        if ($('#Password').val() != "") {
            password = 'enc:' + HexEncode($('#Password').val());
            setCookie('passwordenc', password);
        }
        if ($('#Server').val() != "") {
            server = $('#Server').val();
            setCookie('Server', server);
        }
        var AutoPlaylists = $('#AutoPlaylists').val();
        setCookie('AutoPlaylists', AutoPlaylists);
        var AutoAlbumSize = $('#AutoAlbumSize').val();
        setCookie('AutoAlbumSize', AutoAlbumSize);
        var AutoPlaylistSize = $('#AutoPlaylistSize').val();
        setCookie('AutoPlaylistSize', AutoPlaylistSize);
        // Application Name
        if ($('#ApplicationName').val() != "") {
            applicationName = $('#ApplicationName').val();
            setCookie('ApplicationName', applicationName);
        }
        // Hide AZ
        if ($('#HideAZ').is(':checked')) {
            setCookie('HideAZ', '1');
            $('#BottomContainer').hide();
        } else {
            setCookie('HideAZ', null);
            $('#BottomContainer').show();
        }
        // Song Notification
        if ($('#Notification_Song').is(':checked')) {
            requestPermissionIfRequired();
            if (hasNotificationPermission()) {
                setCookie('Notification_Song', '1');
            } else {
                alert('HTML5 Notifications are not available for your current browser, Sorry :(');
                return false;
            }
        } else {
            setCookie('Notification_Song', null);
        }
        // Now Playing Notification
        if ($('#Notification_NowPlaying').is(':checked')) {
            requestPermissionIfRequired();
            if (hasNotificationPermission()) {
                setCookie('Notification_NowPlaying', '1');
            } else {
                alert('HTML5 Notifications are not available for your current browser, Sorry :(');
                return false;
            }
        } else {
            setCookie('Notification_NowPlaying', null);
        }
        // Scroll Title
        if ($('#ScrollTitle').is(':checked')) {
            setCookie('ScrollTitle', '1');
        } else {
            setCookie('ScrollTitle', null);
        }
        // Debug
        if ($('#Debug').is(':checked')) {
            setCookie('Debug', '1');
            debug = true;
        } else {
            setCookie('Debug', null);
            debug = false;
        }
        // Force Flash
        if ($('#ForceFlash').is(':checked')) {
            setCookie('ForceFlash', '1');
            /*
            if (confirm('Switching to the Flash audio player requires a page refresh. Would you like to do that now?')) {
                location.reload(true);
            } else {
            }
            */
        } else {
            setCookie('ForceFlash', null);
        }
        // JSONP
        if ($('#Protocol').is(':checked')) {
            protocol = 'jsonp';
            setCookie('Protocol', '1');
        } else {
            protocol = 'json';
            setCookie('Protocol', null);
        }
        // Save Progress
        if ($('#SaveTrackPosition').is(':checked')) {
            setCookie('SaveTrackPosition', '1');
            var audio = typeof $("#playdeck").data("jPlayer") != 'undefined' ? true : false;
            if (audio) {
                saveTrackPosition();
            }
        } else {
            setCookie('SaveTrackPosition', null);
            setCookie('CurrentSong', null);
            deleteCurrentPlaylist();
        }

        updateBaseParams();
        alert('Settings Saved');
        return false;
    });
    $('#ResetSettings').live('click', function () {
        setCookie('username', null);
        setCookie('password', null);
        setCookie('AutoAlbumSize', null);
        setCookie('AutoPlaylistSize', null);
        setCookie('Server', null);
        setCookie('ApplicationName', null);
        setCookie('HideAZ', null);
        location.reload(true);
    });
    $('#Theme').live('change', function () {
        var theme = $(this).val();
        switchTheme(theme);
        setCookie('Theme', theme);
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
        helper: fixHelper
    }).disableSelection();
    $("#TrackContainer tbody").sortable({
        helper: fixHelper
    }).disableSelection();
});                                                                                                                                                                         // End document.ready

