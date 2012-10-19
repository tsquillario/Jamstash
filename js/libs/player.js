var scrobbled = false;
function playSong(el, songid, albumid, position, loadonly) {
    ajaxUrl = baseURL + '/getMusicDirectory.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&f=json&id=' + albumid;
    if (debug) { console.log(ajaxUrl) }
    $.ajax({
        url: ajaxUrl,
        method: 'GET',
        dataType: 'json',
        timeout: 10000,
        success: function (data) {
            var title, artist, album, rating, starred;
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
                        artist = child.artist;
                        album = child.album;
                        coverart = child.coverArt;
                        rating = child.userRating;
                        if (child.starred !== undefined) { starred = true; } else { starred = false; }
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
            $('#songdetails_artist').attr('title', artist + ' - ' + album);
            var coverartSrc, coverartFullSrc;
            if (coverart == undefined) {
                coverartSrc = 'images/albumdefault_56.jpg';
                coverartFullSrc = '';
            } else {
                coverartSrc = baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=json&size=56&id=' + coverart;
                coverartFullSrc = baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=json&id=' + coverart;
            }
            $('#coverartimage').attr('href', coverartFullSrc);
            $('#coverartimage img').attr('src', coverartSrc);
            $('#playermiddle').css('visibility', 'visible');
            $('#songdetails').css('visibility', 'visible');
            if (!loadonly) { // Sometimes we only want to load the track and not play
                // SoundManager Initialize
                var salt = Math.floor(Math.random() * 100000);
                soundManager.onready(function () {
                    if (debug) {
                        console.log("SM HTML5 STATUS");
                        $.each(soundManager.html5, function (key, value) {
                            console.log(key + ': ' + value);
                        });
                    }
                    soundManager.destroySound('audio');
                    soundManager.createSound({
                        id: 'audio',
                        url: baseURL + '/stream.view?u=' + username + '&p=' + password + '&v=' + version + '&c=' + applicationName + '&id=' + songid + '&salt=' + salt,
                        stream: true,
                        type: 'audio/mp3',
                        multiShot: false,
                        whileloading: function () {
                            //if (debug) { console.log('loaded:' + this.bytesLoaded + ' total:' + this.bytesTotal); }
                            var percent = this.bytesLoaded / this.bytesTotal;
                            var scrubber = $('#audio_wrapper0').find(".scrubber");
                            var loaded = $('#audio_wrapper0').find(".loaded");
                            loaded.css('width', (scrubber.get(0).offsetWidth * percent) + 'px');
                            loaded.attr('title', Math.round(percent * 100) + '% loaded');
                        },
                        whileplaying: function () {
                            //if (debug) { console.log('position:' + this.position + ' duration:' + this.duration); }
                            var percent = this.position / this.duration;
                            var scrubber = $('#audio_wrapper0').find(".scrubber");
                            var progress = $('#audio_wrapper0').find(".progress");
                            progress.css('width', (scrubber.get(0).offsetWidth * percent) + 'px');

                            var played = $('#audio_wrapper0').find(".played");
                            var p = (this.duration / 1000) * percent,
                            m = Math.floor(p / 60),
                            s = Math.floor(p % 60);
                            played.html((m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s);

                            // Scrobble song once percentage is reached
                            if (!scrobbled && p > 30 && (percent > 0.5 || p > 480)) {
                                if (debug) { console.log("LAST.FM SCROBBLE"); }
                                scrobbleSong(true);
                            }
                        },
                        onload: function () {
                            var duration = $('#audio_wrapper0').find(".duration");
                            var dp = this.duration / 1000,
                            dm = Math.floor(dp / 60),
                            ds = Math.floor(dp % 60);
                            duration.html((dm < 10 ? '0' : '') + dm + ':' + (ds < 10 ? '0' : '') + ds);
                            var scrubber = $('#audio_wrapper0').find(".scrubber");
                            scrubber.unbind("click");
                            scrubber.click(function (e) {
                                var x = (e.pageX - this.offsetLeft) / scrubber.width();
                                var position = Math.round(dp * 1000 * x);
                                var s = soundManager.getSoundById('audio');
                                s.setPosition(position);
                            });
                            scrubber.mouseover(function (e) {
                                $('.audiojs .scrubber').stop().animate({ height: '8px' });
                            });
                            scrubber.mouseout(function (e) {
                                $('.audiojs .scrubber').stop().animate({ height: '4px' });
                            });
                        },
                        onpause: function () {
                            if (debug) { console.log('Pause Event: ' + ' playState:' + this.playState + ', readyState:' + this.readyState + ', position:' + this.position + ', duration:' + this.duration + ', durationEstimate:' + this.durationEstimate + ', isBuffering:' + this.isBuffering); }
                        },
                        onresume: function () {
                            if (debug) { console.log('Resume Event: ' + ' playState:' + this.playState + ', readyState:' + this.readyState + ', position:' + this.position + ', duration:' + this.duration + ', durationEstimate:' + this.durationEstimate + ', isBuffering:' + this.isBuffering); }
                        },
                        onsuspend: function () {
                            if (debug) { console.log('Suspend Event: ' + ' playState:' + this.playState + ', readyState:' + this.readyState + ', position:' + this.position + ', duration:' + this.duration + ', durationEstimate:' + this.durationEstimate + ', isBuffering:' + this.isBuffering); }
                        },
                        onfinish: function () {
                            var next = $('#CurrentPlaylistContainer tr.playing').next();
                            if (!changeTrack(next)) {
                                if (getCookie('AutoPilot')) {
                                    //var genre = $(this).data('genre');
                                    //var folder = $(this).data('folder');
                                    getRandomSongList('', '#CurrentPlaylistContainer tbody', '', '');
                                }
                            }
                        },
                        ontimeout: function (status) {
                            if (debug) { console.log('The status is ' + status.success + ', the error type is ' + status.error.type); }
                        }
                    });
                    if (position == 0) {
                        soundManager.play('audio');
                        soundManager.setVolume('audio', volume);
                    } else {
                        var p = position;
                        seekAndPlay('audio', p);
                        soundManager.setVolume('audio', volume);
                    }
                    var submenu = $('div#submenu_CurrentPlaylist');
                    if (submenu.is(":visible")) {
                        submenu.fadeOut();
                    }
                });

                $('table.songlist tr.song').removeClass('playing');
                if (el != null) {
                    $(el).addClass('playing');
                }
                $('#PlayTrack').find('img').attr('src', 'images/pause_24x32.png');
                $('#PlayTrack').addClass('playing');
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
        }
    });
}
function seekAndPlay(soundID, soundPosition) {
    var s = soundManager.getSoundById(soundID);
    if (s) {
        s.unload();
        if (s.readyState === 0) { // hasn't started loading yet...
            // load the whole sound, and play when it's done
            s.load({
                onload: function () {
                    this.play({
                        position: soundPosition
                    });
                }
            });
        } else if (s.readyState === 3) {
            // sound has already loaded, ready to go
            s.play({
                position: soundPosition
            });
        }
    }
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
    var el = '#PlayTrack';
    if ($(el).hasClass('playing')) {
        $(el).find('img').attr('src', 'images/play_24x32.png');
        $(el).removeClass('playing');
        $(el).addClass('paused');
        soundManager.pause('audio');
    } else if ($(el).hasClass('paused')) {
        $(el).find('img').attr('src', 'images/pause_24x32.png');
        $(el).removeClass('paused');
        $(el).addClass('playing');
        soundManager.resume('audio');
    } else {
        var el = $('#songdetails_song');
        var songid = el.attr('childid');
        if (songid != '') {
            if (getCookie("CurrentSong")) {
                var currentSong = JSON.parse(getCookie("CurrentSong"));
                playSong($('#' + songid), currentSong.songid, currentSong.albumid, currentSong.position, false);
                var playing = $('#' + songid);
                if (playing != undefined) {
                    $('#CurrentPlaylist').scrollTo(playing, 400);
                }
            }
        } else {
            // Start playing song
            var play = $('#CurrentPlaylistContainer tr.selected').first();
            if (changeTrack(play)) {
                $(el).find('img').attr('src', 'images/pause_24x32.png');
                $(el).addClass('playing');
            } else {
                var first = $('#CurrentPlaylistContainer tr').first();
                changeTrack(first);
            }
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
function autoPlay() {
    if (debug) { console.log('Auto Play'); }
        var song = $('#CurrentPlaylistContainer tr.playing');
        nextSong = $('#CurrentPlaylistContainer tr.playing').next();
        if (song.length == 0) {
            song = $('#CurrentPlaylistContainer tr.song:first');
            play = true;
        } else if (song.length == 1) {
            play = false;
            //$('#NextTrack').click();
        }
    var songid = $(song).attr('childid');
    var albumid = $(song).attr('parentid');
    playSong(song, songid, albumid, 0, false);
}
function nextPlay() {
    if (debug) { console.log('Next Play'); }
        var song = $('#CurrentPlaylistContainer tr.playing');
        var nextSong = $('#CurrentPlaylistContainer tr.playing').next();
        if (song.length == 0) {
            song = $('#CurrentPlaylistContainer tr.song:first');
            var songid = $(song).attr('childid');
            var albumid = $(song).attr('parentid');
            playSong(song, songid, albumid, 0, false);
        } else if (nextSong.length == 1) {
            song = $('#CurrentPlaylistContainer tr.playing').next();
            var songid = $(song).attr('childid');
            var albumid = $(song).attr('parentid');
            playSong(song, songid, albumid, 0, false);
        } else {
            //song = $('#CurrentPlaylistContainer tr.playing').next();
        }
}