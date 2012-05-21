var scrobbled = false;
function playSong(el, songid, albumid) {
    $.ajax({
        url: baseURL + '/getMusicDirectory.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + albumid,
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            var title, artist, album, rating;
            if (data["subsonic-response"].directory !== undefined) {
                // There is a bug in the API that doesn't return a JSON array for one artist
                var children = [];
                if (data["subsonic-response"].directory.child.length > 0) {
                    children = data["subsonic-response"].directory.child;
                } else {
                    children[0] = data["subsonic-response"].directory.child;
                }
                $.each(children, function (i, child) {
                    if (child.id == songid) {
                        title = child.title;
                        artist = child.artist;
                        album = child.album;
                        coverart = child.coverArt;
                        rating = child.userRating;
                    }
                });
            }
            if (rating == 5) {
                $('#songdetails_rate').attr('class', 'favorite');
            } else {
                $('#songdetails_rate').attr('class', 'rate');
            }
            $('#songdetails_song').html(title);
            $('#songdetails_song').attr('parentid', albumid);
            $('#songdetails_song').attr('childid', songid);
            $('#songdetails_artist').html(artist + ' - ' + album);
            var coverartSrc, coverartFullSrc;
            if (coverart == undefined) {
                coverartSrc = 'images/albumdefault_50.jpg';
                coverartFullSrc = '';
            } else {
                coverartSrc = baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=jsonp&size=50&id=' + coverart;
                coverartFullSrc = baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + coverart;
            }
            $('#coverartimage').attr('href', coverartFullSrc);
            $('#coverartimage img').attr('src', coverartSrc);
            $('#playermiddle').css('visibility', 'visible');
            $('#songdetails').css('visibility', 'visible');
            // SoundManager Initialize
            var salt = Math.floor(Math.random() * 100000);
            if (audio) {
                soundManager.destroySound('audio');
            }
            soundManager.onready(function () {
                if (debug) {
                    console.log("SM HTML5 STATUS");
                    $.each(soundManager.html5, function (key, value) {
                        console.log(key + ': ' + value);
                    });
                }
                audio = soundManager.createSound({
                    id: 'audio',
                    url: baseURL + '/stream.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&id=' + songid + '&salt=' + salt,
                    stream: true,
                    whileloading: function () {
                        if (debug) { console.log('loaded:' + this.bytesLoaded + ' total:' + this.bytesTotal); }
                        var percent = this.bytesLoaded / this.bytesTotal;
                        var scrubber = $('#audio_wrapper0').find(".scrubber");
                        var loaded = $('#audio_wrapper0').find(".loaded");
                        loaded.css('width', (scrubber.get(0).offsetWidth * percent) + 'px');
                    },
                    whileplaying: function () {
                        if (debug) { console.log('position:' + this.position + ' duration:' + this.duration); }
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
                            audio.play({
                                position: position
                            });
                        });
                    },
                    onfinish: function () {
                        var next = $('#CurrentPlaylistContainer tr.playing').next();
                        changeTrack(next);
                    }
                });
                audio.play('audio');
            });

            $('table.songlist tr.song').removeClass('playing');
            $(el).addClass('playing');
            $('#PlayTrack').find('img').attr('src', 'images/pause_24x32.png');
            $('#PlayTrack').addClass('playing');
            scrobbleSong(false);
            scrobbled = false;

            if ($.cookie('EnableNotifications')) {
                showNotification(coverartSrc, toHTML.un(title), toHTML.un(artist + ' - ' + album));
            }
            if ($.cookie('ScrollTitle')) {
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
        url: baseURL + '/scrobble.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + songid + "&submission=" + submission,
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function () {
            if (submission) {
                scrobbled = true;
            }
        }
    });
}
function rateSong(songid, rating) {
    $.ajax({
        url: baseURL + '/setRating.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + songid + "&rating=" + rating,
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function () {
            updateMessage('Rating Updated!');
        }
    });
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
function changeTrack(next) {
    var songid = $(next).attr('childid');
    if (songid !== undefined) {
        var albumid = $(next).attr('parentid');
        playSong(next, songid, albumid);
        return true;
    } else {
        return false;
    }
}
function autoPlay() {
    var firstsong = $('#CurrentPlaylistContainer tr.song:first');
    var songid = $(firstsong).attr('childid');
    var albumid = $(firstsong).attr('parentid');
    playSong(firstsong, songid, albumid);
}
