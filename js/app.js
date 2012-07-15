// Global Variables
var debug = false;
var audio;
var hostURL = location.href;
var baseURL;
var version;
var username;
var password;
var passwordenc;
var server;

//Sound manager
soundManager.url = 'js/sm/swf';
if ($.cookie('ForceFlash')) {
    soundManager.preferFlash = true;
} else {
    soundManager.preferFlash = false;
}
soundManager.debugMode = false;
//soundManager.useHTML5Audio = true;

// Set auth cookies if specified in URL on launch
var u = getParameterByName('u'); 
var p = getParameterByName('p');
var s = getParameterByName('s');
if (u && p && s) {
    if (!$.cookie('username')) {
        $.cookie('username', u, { expires: 365 });
        username = u;
    }
    if (!$.cookie('password')) {
        $.cookie('password', p, { expires: 365 });
        password = p;
    }
    if (!$.cookie('Server')) {
        $.cookie('Server', s, { expires: 365 });
        baseURL = $.cookie('Server') + '/rest';
    }
    window.location.href = getPathFromUrl(window.location);
}
if ($.cookie('Server')) {
    baseURL = $.cookie('Server') + '/rest';
}
var applicationName;
if ($.cookie('ApplicationName')) {
    applicationName = $.cookie('ApplicationName');
} else {
    applicationName = 'MiniSub';
}
if ($.cookie('username')) {
    username = $.cookie('username');
}
if ($.cookie('passwordenc')) {
    password = $.cookie('passwordenc');
} else {
    if ($.cookie('password')) {
        password = 'enc:' + HexEncode($.cookie('password'));
    }
}
var auth = makeBaseAuth(username, password);
if ($.cookie('password')) {
    $.cookie('passwordenc', 'enc:' + HexEncode($.cookie('password')), { expires: 365 });
    $.cookie('password', null);
}
var version = '1.6.0';

function loadTabContent(tab) {
    if (username && password) {
        switch (tab) {
            case '#tabLibrary':
                if (debug) { console.log("TAG LIBRARY"); }
                if ($.cookie('MusicFolders')) {
                    loadArtists($.cookie('MusicFolders'), false);
                } else {
                    loadArtists();
                }
                getMusicFolders();
                break;
            case '#tabCurrent':
                if (debug) { console.log("TAG CURRENT"); }
                var header = generateSongHeaderHTML();
                $("#CurrentPlaylistContainer thead").html(header);
                break;
            case '#tabPlaylists':
                if (debug) { console.log("TAG PLAYLIST"); }
                loadPlaylists();
                break;
            case '#tabPreferences':
                break;
            default:
                break;
        }
    }
}



