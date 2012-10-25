// Global Variables
var debug = false;
var audio = null;
var hostURL = location.href;
var baseURL;
var version;
var username;
var password;
var passwordenc;
var server;
var smwidth;
var volume = 50;
var currentVersion = '2.2.1';

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

//Sound manager
soundManager.url = 'js/sm/swf';
if (getCookie('ForceFlash')) {
    soundManager.preferFlash = true;
} else {
    soundManager.preferFlash = false;
}
soundManager.useHTML5Audio = true;

// Set auth cookies if specified in URL on launch
var u = getParameterByName('u'); 
var p = getParameterByName('p');
var s = getParameterByName('s');
if (u && p && s) {
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
if (getCookie('Volume')) {
    volume = parseInt(getCookie('Volume'));
}
var version = '1.6.0';

function loadTabContent(tab) {
    if (username && password) {
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
            case '#tabCurrent':
                if (debug) { console.log("TAG CURRENT"); }
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
    }
}

//Volumen control
function drawvolumecontroller(length,height,nowselected){	
    document.getElementById("volumcontroller").innerHTML = "";
    for (i=0;i<length;i++){
        magassag = 7 + Math.round((1.4)*(length - i)); //where 40 is the container height
        margintop = height-magassag;
        if (margintop <= 0) {
            margintop=0;
        }
        if (i >= nowselected){		//background-color valtozik ameddig epp ki van jelolve
            document.getElementById("volumcontroller").innerHTML = document.getElementById("volumcontroller").innerHTML+'<div  onmouseup="volumecontrolchanged('+i+')" style="background-color:#898989;height:'+magassag+'px;margin-top:'+margintop+'px;" class="volumecontrollerbar"></div>';
        } else {
            document.getElementById("volumcontroller").innerHTML = document.getElementById("volumcontroller").innerHTML+'<div  onmouseup="volumecontrolchanged('+i+')" style="height:'+magassag+'px;margin-top:'+margintop+'px;" class="volumecontrollerbar"></div>';
        }		
    }	
}
function volumecontrolchanged(newvolume){
    drawvolumecontroller(10,35,newvolume);
    soundManager.setVolume('audio',(newvolume-10)*-10);
    volume=(newvolume-10)*-10;
    updateMessage('Volume: ' + volume + '%');
    $.cookie('Volume', ((newvolume-10)*-10), {
        expires: 365
    });
}