var scrobbled = false;
var timerid = 0;
function playSong(el, songid, albumid, position, loadonly) {
    ajaxUrl = baseURL + '/getMusicDirectory.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&f=json&id=' + albumid;
    if (debug) { console.log(ajaxUrl) }
    $.ajax({
        url: ajaxUrl,
        method: 'GET',
        dataType: 'json',
        timeout: 10000,
        success: function (data) {
            var title, artist, album, rating, starred, contenttype, suffix;
            var specs = '';
            if (data["subsonic-response"].directory.child !== undefined) {
                // There is a bug in the API that doesn't return a JSON array for one artist
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
                coverartSrc = 'images/albumdefault_56.jpg';
                coverartFullSrc = '';
            } else {
                coverartSrc = baseURL + '/getCoverArt.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&f=json&size=56&id=' + coverart;
                coverartFullSrc = baseURL + '/getCoverArt.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&f=json&id=' + coverart;
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
                $("#playdeck").jPlayer({
                    swfPath: "js/jplayer",
                    wmode: "window",
                    solution: audioSolution,
                    supplied: suffix,
                    errorAlerts: debug,
                    warningAlerts: false,
                    volume: parseInt(volume)/100,
                    cssSelectorAncestor: "#player",
                    cssSelector: {
                        play: "#PlayTrack",
                        pause: "#PauseTrack",
                        seekBar: "#audiocontainer .scrubber",
                        playBar: "#audiocontainer .progress",
                        //mute: "#mute",
                        //unmute: "#unmute",
                        currentTime: "#played",
                        duration: "#duration"
                    },
                    ready: function () {
                        if (suffix == 'oga') {
                            $(this).jPlayer("setMedia", {
                                oga: baseURL + '/stream.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&id=' + songid + '&salt=' + salt,
                            });
                        } else if (suffix == 'mp3') {
                            $(this).jPlayer("setMedia", {
                                mp3: baseURL + '/stream.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&id=' + songid + '&salt=' + salt,
                            });
                        }
                        if (!loadonly) {
                            $(this).jPlayer("play")
                        } else {
                            $(this).jPlayer("pause", position)
                        }
		            },
                    ended: function() { // The $.jPlayer.event.ended event
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
                        spechtml += "<strong>" + solution + "</strong> is";
                        spechtml += " being used with<strong>";
                        for (format in data[solution].support) {
                            if (data[solution].support[format]) {
                                spechtml += " " + format;
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

                if (getCookie('Notification_Song')) {
                    showNotification(coverartSrc, toHTML.un(title), toHTML.un(artist + ' - ' + album), 'text');
                }
                if (getCookie('ScrollTitle')) {
                    scrollTitle(toHTML.un(artist) + ' - ' + toHTML.un(title));
                } else {
                    setTitle(toHTML.un(artist) + ' - ' + toHTML.un(title));
                }
        }
    });
}
function scrobbleSong(submission) {
    var songid = $('#songdetails_song').attr('childid');
    $.ajax({
        url: baseURL + '/scrobble.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&f=json&id=' + songid + "&submission=" + submission,
        method: 'GET',
        dataType: 'json',
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
        url: baseURL + '/setRating.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&f=json&id=' + songid + "&rating=" + rating,
        method: 'GET',
        dataType: 'json',
        timeout: 10000,
        success: function () {
            updateMessage('Rating Updated!');
        }
    });
}
function starItem(itemid, starred) {
    var url;
    if (itemid !== undefined) {
        if (starred) {
            url = baseURL + '/star.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&f=json&id=' + itemid;
        } else {
            url = baseURL + '/unstar.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&f=json&id=' + itemid;
        }
        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            timeout: 10000,
            success: function () {
                updateMessage('Favorite Updated!');
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
        playSong(next, songid, albumid, 0, false);
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
                playSong(song, songid, albumid, 0, true);
            } else {
                // No songs currently playing, so get first and play
                song = $('#CurrentPlaylistContainer tr.song:first');
                var songid = $(song).attr('childid');
                var albumid = $(song).attr('parentid');
                playSong(song, songid, albumid, 0, false);
            }
        } else {
            if (nextSong.length == 1) {
                // Get next song after currently playing
                song = $('#CurrentPlaylistContainer tr.playing').next();
                var songid = $(song).attr('childid');
                var albumid = $(song).attr('parentid');
                playSong(song, songid, albumid, 0, false);
            } else {
                // Otherwise get 
                song = $('#CurrentPlaylistContainer tr.playing');
                var songid = $(song).attr('childid');
                var albumid = $(song).attr('parentid');
                playSong(song, songid, albumid, 0, false);
            }
        }
}