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

var updaterNowPlaying;
var updaterNowPlayingData;
function updateNowPlaying() {
    updaterNowPlaying = $.periodic({ period: 4000, decay: 1.5, max_period: 1800000 }, function () {
        $.ajax({
            periodic: this,
            url: baseURL + '/getNowPlaying.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp',
            method: 'GET',
            dataType: 'jsonp',
            timeout: 10000,
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function (data) {
                if (data["subsonic-response"].nowPlaying.entry === undefined) {
                    this.periodic.increment();
                    $("#NowPlayingList").empty();
                    var chathtml = '<div class=\"msg\">';
                    chathtml += '<span class=\"user\">Nothing :(</span></br>';
                    chathtml += '</div>';
                    $(chathtml).appendTo("#NowPlayingList");
                } else if (updaterNowPlayingData === $.param(data)) {
                    this.periodic.increment();
                } else {
                    $("#NowPlayingList").empty();
                    var msgs = [];
                    if (data["subsonic-response"].nowPlaying.entry.length > 0) {
                        msgs = data["subsonic-response"].nowPlaying.entry;
                    } else {
                        msgs[0] = data["subsonic-response"].nowPlaying.entry;
                    }
                    this.periodic.reset();
                    var sorted = msgs.sort(function (a, b) {
                        return a.minutesAgo - b.minutesAgo;
                    });
                    $.each(sorted, function (i, msg) {
                        var chathtml = '<div class=\"msg\">';
                        chathtml += '<span class=\"user\">' + msg.username + '</span></br>';
                        chathtml += '<span class=\"artist\">' + msg.artist + '</span> - ';
                        chathtml += '<span class=\"title\">' + msg.title + '</span>';
                        chathtml += '</div>';
                        $(chathtml).appendTo("#NowPlayingList");
                    });
                    updaterNowPlayingData = $.param(data);
                }
            }
        });
    });
}
function stopUpdateNowPlaying() {
    updaterNowPlaying.cancel();
}


