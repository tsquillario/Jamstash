// Global Variables
var debug = false;
var audio = null;
var hostURL = location.href;
var baseURL;
var apiVersion;
var username;
var password;
var passwordenc;
var server;
var smwidth;
var currentVersion = '2.3.2';

function getCookie(value) {
    if ($.cookie(value)) {
        return $.cookie(value);
    } else {
        return false;
    }
    /* jQuery.cookies.js
    if (browserStorageCheck) {
        var item = localStorage.getItem(value);
        if (item != '' && item != undefined) {
            return true;
        } else {
            return false;
        }
    } else {
        if (debug) { console.log('HTML5::loadStorage not supported on your browser' + html.length + ' characters'); }
    }
    */
}
function setCookie(key, value) {
    $.cookie(key, value, { expires: 365 });
    /* jQuery.cookies.js
    try {
        if (debug) { console.log('Saving : ' + key + ':' + value); }
        localStorage.setItem(key, value);
    } catch (e) {
        if (e == QUOTA_EXCEEDED_ERR) {
            alert('Quota exceeded!');
        }
    }
    */
}

// Get URL Querystring Parameters
var u = getParameterByName('u'); 
var p = getParameterByName('p');
var s = getParameterByName('s');
if (u && p && s) {
    // Auto configuration from Querystring params
    if (!getCookie('username')) {
        setCookie('username', u);
        username = u;
    }
    if (!getCookie('passwordenc')) {
        setCookie('passwordenc', p);
        password = p;
    }
    if (!getCookie('Server')) {
        setCookie('Server', s, { expires: 365 });
        baseURL = getCookie('Server') + '/rest';
    }
    window.location.href = getPathFromUrl(window.location);
}
if (getCookie('Server')) {
    baseURL = getCookie('Server') + '/rest';
}
var applicationName;
if (getCookie('ApplicationName')) {
    applicationName = getCookie('ApplicationName');
} else {
    applicationName = 'MiniSub';
}
if (getCookie('username')) {
    username = getCookie('username');
}
if (getCookie('passwordenc')) {
    password = getCookie('passwordenc');
} else {
    if (getCookie('password')) {
        password = 'enc:' + HexEncode(getCookie('password'));
    }
}
var auth = makeBaseAuth(username, password);
if (getCookie('password')) {
    setCookie('passwordenc', 'enc:' + HexEncode(getCookie('password')));
    setCookie('password', null);
}
var apiVersion = '1.6.0';

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
                    $('#currentActions a.button').removeClass('disabled');
                }
                var songid = $('#CurrentPlaylistContainer tbody tr.playing').attr('childid');
                if (songid !== undefined) {
                    $('#CurrentPlaylist').scrollTo($('#' + songid), 400);
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
            case '#tabPreferences':
                getGenres();
                break;
            default:
                break;
        }
        $(tab).fadeIn('fast'); //Fade in the active ID content
}





