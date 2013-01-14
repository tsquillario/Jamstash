var scrobbled = false;
var timerid = 0;
var marquee;
function getSongData(el, songid, albumid, position, loadonly) {
    var runningVersion = parseVersionString(apiVersion);
    var minimumVersion = parseVersionString('1.8.0');
    if (checkVersion(runningVersion, minimumVersion)) {
        if (debug) { console.log('apiVersion at or above 1.8.0 using getSong.view'); }        
        ajaxUrl = baseURL + '/getSong.view?' + baseParams + '&id=' + songid;
    } else {
        if (debug) { console.log('apiVersion below 1.8.0 using getMusicDirectory.view'); }        
        ajaxUrl = baseURL + '/getMusicDirectory.view?' + baseParams + '&id=' + albumid; // Deprecated: apiVersion 1.8.0
    }
    if (debug) { console.log(ajaxUrl) }
    $.ajax({
        url: ajaxUrl,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            var title, artist, album, rating, starred, contenttype, suffix;
            var specs = '';
            if (typeof data["subsonic-response"].song != "undefined") {
                var song = data["subsonic-response"].song;
                title = song.title.toString();
                if (song.artist !== undefined) { artist = song.artist.toString(); } else { artist = ''; }
                album = song.album;
                coverart = song.coverArt;
                rating = song.userRating;
                if (song.contentType == 'audio/ogg') { contenttype = song.contentType; } else { contenttype = 'audio/mp3'; }
                if (song.starred !== undefined) { starred = true; } else { starred = false; }
                if (song.bitRate !== undefined) { specs += song.bitRate + ' Kbps'; }
                if (song.transcodedSuffix !== undefined) { specs += ', transcoding:' + song.suffix + ' > ' + song.transcodedSuffix; } else { specs += ', ' + song.suffix; }
                if (song.transcodedSuffix !== undefined) { suffix = song.transcodedSuffix; } else { suffix = song.suffix; }
                if (suffix == 'ogg') { suffix = 'oga'; }
            }
            if (typeof data["subsonic-response"].directory != 'undefined') { // Deprecated: apiVersion 1.8.0
                if (typeof data["subsonic-response"].directory.child != 'undefined') {
                    var children = [];
                    if (data["subsonic-response"].directory.child.length > 0) {
                        children = data["subsonic-response"].directory.child;
                    } else {
                        children[0] = data["subsonic-response"].directory.child;
                    }
                    $.each(children, function (i, child) {
                        if (child.id == songid) {
                            title = child.title.toString();
                            if (child.artist !== undefined) { artist = child.artist.toString(); } else { artist = ''; }
                            album = child.album;
                            coverart = child.coverArt;
                            rating = child.userRating;
                            if (child.contentType == 'audio/ogg') { contenttype = child.contentType; } else { contenttype = 'audio/mp3'; }
                            if (child.starred !== undefined) { starred = true; } else { starred = false; }
                            if (child.bitRate !== undefined) { specs += child.bitRate + ' Kbps'; }
                            if (child.transcodedSuffix !== undefined) { specs += ', transcoding:' + child.suffix + ' > ' + child.transcodedSuffix; } else { specs += ', ' + child.suffix; }
                            if (child.transcodedSuffix !== undefined) { suffix = child.transcodedSuffix; } else { suffix = child.suffix; }
                            if (suffix == 'ogg') { suffix = 'oga'; }
                        }
                    });
                }
            }
            playSong(el, songid, albumid, title, artist, album, coverart, rating, starred, contenttype, suffix, specs, position, loadonly);
        }
    });
}
function playSong(el, songid, albumid, title, artist, album, coverart, rating, starred, contenttype, suffix, specs, position, loadonly) {
        var volume = 1;
        if (getCookie('Volume')) {
            volume = parseFloat(getCookie('Volume'));
        }
        if (starred) {
            $('#songdetails_rate').attr('class', 'favorite');
        } else {
            $('#songdetails_rate').attr('class', 'rate');
        }
        $('#songdetails_song').html(title);
        $('#songdetails_song').attr('title', title);
        $('#songdetails_song').attr('parentid', albumid);
        $('#songdetails_song').attr('childid', songid);
        $('#songdetails_artist').html(artist + ' - ' + album);
        $('#songdetails_artist').attr('title', toHTML.un(artist + ' - ' + album));
        $('#songdetails_specs').html(specs);
        var coverartSrc, coverartFullSrc;
        if (coverart == undefined) {
            coverartSrc = 'images/albumdefault_60.jpg';
            coverartFullSrc = '';
        } else {
            coverartSrc = baseURL + '/getCoverArt.view?' + baseParams + '&size=60&id=' + coverart;
            coverartFullSrc = baseURL + '/getCoverArt.view?' + baseParams + '&id=' + coverart;
        }
        $('#coverartimage').attr('href', coverartFullSrc);
        $('#coverartimage img').attr('src', coverartSrc);
        $('#playermiddle').css('visibility', 'visible');
        $('#songdetails').css('visibility', 'visible');
        var salt = Math.floor(Math.random() * 100000);
        // jPlayer Setup
        var audioSolution = "html,flash";
        if (getCookie('ForceFlash')) {
            audioSolution = "flash,html";
        }
        $("#playdeck").jPlayer("destroy");
        $.jPlayer.timeFormat.showHour = true; 
        $("#playdeck").jPlayer({
            swfPath: "js/jplayer",
            wmode: "window",
            solution: audioSolution,
            supplied: suffix,
            volume: volume,
            errorAlerts: debug,
            warningAlerts: false,
            cssSelectorAncestor: "#player",
            cssSelector: {
                play: "#PlayTrack",
                pause: "#PauseTrack",
                seekBar: "#audiocontainer .scrubber",
                playBar: "#audiocontainer .progress",
                mute: "#action_Mute",
                unmute: "#action_UnMute",
                volumeMax: "#action_VolumeMax",
                currentTime: "#played",
                duration: "#duration"
            },
            ready: function () {
                if (suffix == 'oga') {
                    $(this).jPlayer("setMedia", {
                        oga: baseURL + '/stream.view?' + baseParams + '&id=' + songid + '&salt=' + salt,
                    });
                } else if (suffix == 'mp3') {
                    $(this).jPlayer("setMedia", {
                        mp3: baseURL + '/stream.view?' + baseParams + '&id=' + songid + '&salt=' + salt,
                    });
                }
                if (!loadonly) { // Start playing
                    $(this).jPlayer("play");
                    var playerState = {
                        playing: true,
                        title: title,
                        artist: artist,
                        favorite: false,
                        albumArt: coverartFullSrc
                    }
                    if (unity) {
                        unity.sendState(playerState);
                    }
                } else { // Loadonly
                    $('#' + songid).addClass('playing');
                    $(this).jPlayer("pause", position);
                }
		    },
            timeupdate: function(event) {
                // Scrobble song once percentage is reached
                var p = event.jPlayer.status.currentPercentAbsolute;
                if (!scrobbled && p > 30) {
                    if (debug) { console.log('LAST.FM SCROBBLE - Percent Played: ' + p); }
                    scrobbleSong(true);
                }
            },
            volumechange: function(event) {
                setCookie('Volume', event.jPlayer.options.volume);
            },
            ended: function() {
                var next = $('#CurrentPlaylistContainer tr.playing').next();
                if (!changeTrack(next)) {
                    if (getCookie('AutoPilot')) {
                        getRandomSongList('autoplayappend', '#CurrentPlaylistContainer tbody', '', '');
                    }
                }
            }
        });
        if (getCookie('SaveTrackPosition')) {
            if (timerid != 0) {
                clearInterval(timerid);
            }
            timerid = window.setInterval(function () {
                if (getCookie('SaveTrackPosition')) {
                    var audio = typeof $("#playdeck").data("jPlayer") != 'undefined' ? true : false;
                    if (audio) {
                        saveTrackPosition();
                    }
                }
            }, 5000);
        }
        var submenu = $('div#submenu_CurrentPlaylist');
        if (submenu.is(":visible")) {
            submenu.fadeOut();
        }
        var spechtml = '';
        var data = $('#playdeck').data().jPlayer;
        for (i = 0; i < data.solutions.length; i++) {
            var solution = data.solutions[i];
            if (data[solution].used) {
                spechtml += "<strong class=\"codesyntax\">" + solution + "</strong> is";
                spechtml += " currently being used with<strong>";
                for (format in data[solution].support) {
                    if (data[solution].support[format]) {
                        spechtml += " <strong class=\"codesyntax\">" + format + "</strong>";
                    }
                }
                spechtml += "</strong> support";
            }
        }
        $('#SMStats').html(spechtml);
        $('table.songlist tr.song').removeClass('playing');
        if (el != null) {
            $(el).addClass('playing');
        }
        scrobbleSong(false);
        scrobbled = false;

        if (getCookie('Notification_Song') && !loadonly) {
            showNotification(coverartSrc, toHTML.un(title), toHTML.un(artist + ' - ' + album), 'text', '#NextTrack');
        }
        if (getCookie('ScrollTitle')) {
            scrollTitle(toHTML.un(artist) + ' - ' + toHTML.un(title));
        } else {
            setTitle(toHTML.un(artist) + ' - ' + toHTML.un(title));
        }
}
function playVideo(id, bitrate) {
    var w, h;
    bitrate = parseInt(bitrate);
    if (bitrate <= 600) { 
        w = 320; h = 240; 
    } else if (bitrate <= 1000) { 
        w = 480; h = 360; 
    } else { 
        w = 640; h = 480; 
    } 
    //$("#jPlayerSelector").jPlayer("option", "fullScreen", true);
    $("#videodeck").jPlayer({
		ready: function () {
            /*
            $.fancybox({
                autoSize: false,
                width: w + 10,
                height: h + 10,
                content: $('#videodeck')
            });
            */
			$(this).jPlayer("setMedia", {
				m4v: 'https://&id=' + id + '&salt=83132'
			}).jPlayer("play");
            $('#videooverlay').show();
		},
		swfPath: "js/jplayer",
		solution: "html, flash",
		supplied: "m4v"
	});
}
function scrobbleSong(submission) {
    var songid = $('#songdetails_song').attr('childid');
    $.ajax({
        url: baseURL + '/scrobble.view?' + baseParams + '&id=' + songid + "&submission=" + submission,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function () {
            if (submission) {
                scrobbled = true;
            }
        }
    });
}
function rateSong(songid, rating) {
    $.ajax({
        url: baseURL + '/setRating.view?' + baseParams + '&id=' + songid + "&rating=" + rating,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function () {
            updateMessage('Rating Updated!', true);
        }
    });
}
function starItem(itemid, starred) {
    var url;
    if (itemid !== undefined) {
        if (starred) {
            url = baseURL + '/star.view?' + baseParams + '&id=' + itemid;
        } else {
            url = baseURL + '/unstar.view?' + baseParams + '&id=' + itemid;
        }
        $.ajax({
            url: url,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            success: function () {
                updateMessage('Favorite Updated!', true);
            }
        });
    }
}
function playPauseSong() {
    if (typeof $("#playdeck").data("jPlayer") != 'undefined') {
        if ($("#playdeck").data("jPlayer").status.paused) {
            $("#playdeck").jPlayer("play");
        } else {
            $("#playdeck").jPlayer("pause");
        }
    } 
}
function changeTrack(next) {
    var songid = $(next).attr('childid');
    if (songid !== undefined) {
        var albumid = $(next).attr('parentid');
        getSongData(next, songid, albumid, 0, false);
        $('#CurrentPlaylist').scrollTo($('#' + songid), 400); //Scroll to object
        if (debug) { console.log('Changing Track: songid:' + songid + ', albumid:' + albumid); }        
        return true;
    } else {
        return false;
    }
}
function autoPlay(loadonly) {
    if (debug) { console.log('Next Play'); }
        var song = $('#CurrentPlaylistContainer tr.playing');
        var nextSong = $('#CurrentPlaylistContainer tr.playing').next();
        if (song.length == 0) {
            if (loadonly) {
                // No songs currently playing, so get first and do not play
                song = $('#CurrentPlaylistContainer tr.song:first');
                var songid = $(song).attr('childid');
                var albumid = $(song).attr('parentid');
                getSongData(song, songid, albumid, 0, true);
            } else {
                // No songs currently playing, so get first and play
                song = $('#CurrentPlaylistContainer tr.song:first');
                var songid = $(song).attr('childid');
                var albumid = $(song).attr('parentid');
                getSongData(song, songid, albumid, 0, false);
            }
        } else {
            if (nextSong.length == 1) {
                // Get next song after currently playing
                song = $('#CurrentPlaylistContainer tr.playing').next();
                var songid = $(song).attr('childid');
                var albumid = $(song).attr('parentid');
                getSongData(song, songid, albumid, 0, false);
            } else {
                // Otherwise get 
                song = $('#CurrentPlaylistContainer tr.playing');
                var songid = $(song).attr('childid');
                var albumid = $(song).attr('parentid');
                getSongData(song, songid, albumid, 0, false);
            }
        }
}