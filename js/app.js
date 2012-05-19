// Global Variables
var debug = false;
var audio;
var hostURL = location.href;
var baseURL;

// Set auth cookies if specified in URL on launch
var u = getParameterByName('u'); 
var p = getParameterByName('p');
var s = getParameterByName('s');
if (u && p && s) {
    if (!$.cookie('username')) {
        $.cookie('username', u, { expires: 365 });
    }
    if (!$.cookie('password')) {
        $.cookie('password', p, { expires: 365 });
    }
    if (!$.cookie('Server')) {
        $.cookie('Server', s, { expires: 365 });
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
var username = $.cookie('username');
var password = $.cookie('password');
var auth = makeBaseAuth(username, password);
var passwordenc = 'enc:' + HexEncode($.cookie('password'));
var version = '1.6.0';

function loadTabContent(tab) {
    switch (tab) {
        case '#tabLibrary':
            console.log("TAG LIBRARY");
            if ($.cookie('MusicFolders')) {
                loadArtists($.cookie('MusicFolders'), false);
            } else {
                loadArtists();
            }
            getMusicFolders();
            break;
        case '#tabCurrent':
            console.log("TAG CURRENT");
            var header = generateSongHeaderHTML();
            $("#CurrentPlaylistContainer thead").html(header);
            break;
        case '#tabPlaylists':
            console.log("TAG PLAYLIST");
            loadPlaylists();
            break;
        case '#tabPreferences':
            break;
        default:
            break;
    }
}



