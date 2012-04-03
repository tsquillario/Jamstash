// Global Variables
var debug = true;
var audio;
var hostURL = location.href;
var baseURL;
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
            if ($.cookie('MusicFolders')) {
                loadArtists($.cookie('MusicFolders'), false);
            } else {
                loadArtists();
            }
            getMusicFolders();
            break;
        case '#tabCurrent':
            var header = generateSongHeaderHTML();
            $("#CurrentPlaylistContainer thead").html(header);
            break;
        case '#tabPlaylists':
            loadPlaylists();
            break;
        case '#tabPreferences':
            break;
        default:
            break;
    }
}

function loadArtists(id, refresh) {
    if (refresh) {
        $('#ArtistContainer').empty();
    }
    var url;
    if (id == "all") {
        url = baseURL + '/getIndexes.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp';
    } else if (id) {
        url = baseURL + '/getIndexes.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&musicFolderId=' + id;    
    } else {
        url = baseURL + '/getIndexes.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp';
    }
    var content = $('#ArtistContainer').html();
    if (content === "") {
        // Load Artist List
        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'jsonp',
            timeout: 10000,
            success: function (data) {
                if (data["subsonic-response"].status === 'ok') {
                    var indexlist, indexname;

                    // There is a bug in the API that doesn't return a JSON array for one artist
                    var indexes = [];
                    if (data["subsonic-response"].indexes.index.length > 0) {
                        indexes = data["subsonic-response"].indexes.index;
                    } else {
                        indexes[0] = data["subsonic-response"].indexes.index;
                    }

                    $.each(indexes, function (i, index) {
                        if (index.name === '#') {
                            indexname = '0-9';
                        } else {
                            indexname = index.name;
                        }
                        $('<li class=\"index\" id=\"index_' + indexname + '\" title=\"Scroll to Top\">' + indexname + '<span class=\"floatright\">&uarr;</span></li>').appendTo("#ArtistContainer");
                        indexlist += '<li><a href=\"#\">' + indexname + '</a></li>';
                        var artists = [];
                        if (index.artist.length > 0) {
                            artists = index.artist;
                        } else {
                            artists[0] = index.artist;
                        }
                        $.each(artists, function (i, artist) {
                            if (artist.name !== undefined) {
                                var html = "";
                                html += '<li id=\"' + artist.id + '\" class=\"item\">';
                                html += '<span>' + artist.name + '</span>';
                                html += '</li>';
                                $(html).appendTo("#ArtistContainer");
                            }
                        });
                    });
                    //$(indexlist).appendTo("#IndexList");
                    $("#BottomIndex").empty();
                    $(indexlist).appendTo("#BottomIndex");
                } else {
                    var error = data["subsonic-response"].status;
                    var errorcode = data["subsonic-response"].error.code;
                    var errormsg = data["subsonic-response"].error.message;
                    alert('Status: ' + error + ', Code: ' + errorcode + ', Message: ' + errormsg);
                    //var errorhtml = '<li class=\"item\"><span>' + error + '</span></li>';
                    //$(errorhtml).appendTo("#IndexList");
                }
            }
        });
    }
}
function getMusicFolders() {
    $.ajax({
        url: baseURL + '/getMusicFolders.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp',
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].musicFolders.musicFolder !== undefined) {
                // There is a bug in the API that doesn't return a JSON array for one artist
                var folders = [];
                if (data["subsonic-response"].musicFolders.musicFolder.length > 0) {
                    folders = data["subsonic-response"].musicFolders.musicFolder;
                } else {
                    folders[0] = data["subsonic-response"].musicFolders.musicFolder;
                }

                var savedMusicFolder = $.cookie('MusicFolders');
                var options = [];
                options.push('<option value="all">All Folders</option>');
                $.each(folders, function (i, folder) {
                    if (savedMusicFolder == folder.id) {
                        options.push('<option value="' + folder.id + '" selected>' + folder.name + '</option>');
                    } else {
                        options.push('<option value="' + folder.id + '">' + folder.name + '</option>');
                    }
                });
                $('#MusicFolders').html(options.join(''));
            } else {
            }
        }
    });
}
function getAlbums(id, action, appendto) {
    $.ajax({
        url: baseURL + '/getMusicDirectory.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + id,
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (action === '') {
                $('#AlbumRows').empty();
            }
            if (action === 'autoplay') {
                $('#CurrentPlaylistContainer tbody').empty();
            }
            if (data["subsonic-response"].directory.child !== undefined) {
                // There is a bug in the API that doesn't return a JSON array for one artist
                var children = [];
                if (data["subsonic-response"].directory.child.length > 0) {
                    children = data["subsonic-response"].directory.child;
                } else {
                    children[0] = data["subsonic-response"].directory.child;
                }

                var rowcolor;
                var albumhtml;
                var isDir;
                var header;
                $.each(children, function (i, child) {
                    if (i % 2 === 0) {
                        rowcolor = 'even';
                    } else {
                        rowcolor = 'odd';
                    }
                    isDir = child.isDir;
                    if (isDir === true) {
                        albumhtml = generateAlbumHTML(rowcolor, child.id, child.parent, child.coverArt, child.title, child.artist, child.userRating);
                    } else {
                        var track;
                        if (child.track === undefined) { track = "&nbsp;"; } else { track = child.track; }
                        var time = secondsToTime(child.duration);
                        albumhtml = generateSongHTML(rowcolor, child.id, child.parent, track, child.title, child.artist, child.album, child.coverArt, child.userRating, time['m'], time['s']);
                    }
                    $(albumhtml).appendTo(appendto);
                });
                if (appendto === '#CurrentPlaylistContainer') {
                    updateMessage(children.length + ' Song(s) Added');
                }
                if (appendto === '#AlbumRows' && isDir === true) {
                    header = generateAlbumHeaderHTML();
                }
                if (appendto === '#AlbumRows' && isDir === false) {
                    header = generateSongHeaderHTML();
                }
                $("#AlbumHeader").html(header);
                if (action === 'autoplay') {
                    autoPlay();
                }
            }
        }
    });
}
function getAlbumListBy(id) {
    var size;
    if ($.cookie('AutoAlbumSize') === null) {
        size = 15;
    } else {
        size = $.cookie('AutoAlbumSize');
    }
    $.ajax({
        url: baseURL + '/getAlbumList.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&size=' + size + '&type=' + id,
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].albumList.album !== undefined) {
                $("#AlbumRows").empty();
                var header = generateAlbumHeaderHTML();
                $("#AlbumHeader").html(header);
                // There is a bug in the API that doesn't return a JSON array for one artist
                var albums = [];
                if (data["subsonic-response"].albumList.album.length > 0) {
                    albums = data["subsonic-response"].albumList.album;
                } else {
                    albums[0] = data["subsonic-response"].albumList.album;
                }

                var rowcolor;
                var html;
                $.each(albums, function (i, album) {
                    if (i % 2 === 0) {
                        rowcolor = 'even';
                    } else {
                        rowcolor = 'odd';
                    }
                    // Only show albums, not songs (Rated songs will also be returned in API call, trying to display them will break Back button, disabled for now)
                    var albumhtml;
                    if (album.isDir === true) {
                        albumhtml = generateAlbumHTML(rowcolor, album.id, album.parent, album.coverArt, album.title, album.artist, album.userRating);
                    }
                    $(albumhtml).appendTo("#AlbumRows");
                });
            } else {
                $('#AlbumRows').empty();
            }
        }
    });
}
function getRandomSongList(action, appendto) {
    var size;
    if ($.cookie('AutoPlaylistSize') === null) {
        size = 25;
    } else {
        size = $.cookie('AutoPlaylistSize');
    }
    $.ajax({
        url: baseURL + '/getRandomSongs.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&size=' + size,
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].randomSongs.song !== undefined) {
                if (appendto === '#TrackContainer') {
                    $("#TrackContainer").empty();
                }
                if (action === 'autoplay') {
                    $(appendto).empty();
                }
                // There is a bug in the API that doesn't return a JSON array for one artist
                var items = [];
                if (data["subsonic-response"].randomSongs.song.length > 0) {
                    items = data["subsonic-response"].randomSongs.song;
                } else {
                    items[0] = data["subsonic-response"].randomSongs.song;
                }

                var rowcolor;
                var html;
                $.each(items, function (i, item) {
                    if (i % 2 === 0) {
                        rowcolor = 'even';
                    } else {
                        rowcolor = 'odd';
                    }
                    var track;
                    if (item.track === undefined) { track = "&nbsp;"; } else { track = item.track; }
                    var time = secondsToTime(item.duration);
                    html = generateSongHTML(rowcolor, item.id, item.parent, track, item.title, item.artist, item.album, item.coverArt, item.userRating, time['m'], time['s']);
                    $(html).appendTo(appendto);
                });
                if (appendto === '#CurrentPlaylistContainer') {
                    updateMessage(items.length + ' Song(s) Added');
                }
                if (action === 'autoplay') {
                    autoPlay();
                }
            } else {
                $(appendto).empty();
            }
        }
    });
}
function generateAlbumHeaderHTML() {
    var html;
    html = '<tr><th></th><th></th><th>Album</th><th>Artist</th></tr>';
    return html;
}
function generateAlbumHTML(rowcolor, childid, parentid, coverart, title, artist, rating) {
    var html;
    html = '<tr class=\"album ' + rowcolor + '\" childid=\"' + childid + '\" parentid=\"' + parentid + '\" userrating=\"' + rating + '\">';
    html += '<td class=\"itemactions\"><a class=\"add\" href=\"\" title=\"Add To Current Playlist\"></a>';
    html += '<a class=\"play\" href=\"\" title=\"Play\"></a>';
    html += '<a class=\"download\" href=\"\" title=\"Download\"></a>';
    if (rating === 5) {
        html += '<a class=\"favorite\" href=\"\" title=\"Favorite\"></a>';
    } else {
        html += '<a class=\"rate\" href=\"\" title=\"Add To Favorites\"></a>';
    }
    html += '</td>';
    html += '<td class=\"albumart\"><img src=\"' + baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=jsonp&size=50&id=' + coverart + '\" /></td>';
    html += '<td class=\"album\">' + title + '</td>';
    html += '<td class=\"artist\">' + artist + '</td>';
    html += '</tr>';
    return html;
}
function generateSongHeaderHTML() {
    var html;
    html = '<tr><th></th><th>Track</th><th>Title</th><th>Artist</th><th>Album</th><th class=\"alignright\">Time</th></tr>';
    return html;
}
function generateSongHTML(rowcolor, childid, parentid, track, title, artist, album, coverart, rating, m, s) {
    var html;
    html = '<tr class=\"song ' + rowcolor + '\" childid=\"' + childid + '\" parentid=\"' + parentid + '\" userrating=\"' + rating + '\">';
    html += '<td class=\"itemactions\"><a class=\"add\" href=\"\" title=\"Add To Current Playlist\"></a>';
    html += '<a class=\"remove\" href=\"\" title=\"Remove\"></a>';
    html += '<a class=\"play\" href=\"\" title=\"Play\"></a>';
    if (rating === 5) {
        html += '<a class=\"favorite\" href=\"\" title=\"Favorite\"></a>';
    } else {
        html += '<a class=\"rate\" href=\"\" title=\"Add To Favorites\"></a>';
    }
    html += '</td>';
    html += '<td class=\"track\">' + track + '</td>';
    html += '<td class=\"title\">' + title + '</td>';
    html += '<td class=\"artist\">' + artist + '</td>';
    html += '<td class=\"album\">' + album + '<img src=\"' + baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=jsonp&size=25&id=' + coverart + '\" /></td>';
    html += '<td class=\"time\">' + m + ':' + s + '</td>';
    html += '</tr>';
    return html;
}

function refreshRowColor() {
    $.each($('table.songlist tr.song'), function (i) {
        $(this).removeClass('even odd');
        var rowcolor;
        if (i % 2 === 0) {
            rowcolor = 'even';
        } else {
            rowcolor = 'odd';
        }
        $(this).addClass(rowcolor);
    });
}
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
            var title, artist, album;
            if (data["subsonic-response"].directory !== undefined) {
                if (data["subsonic-response"].directory.child.length > 0) {
                    $.each(data["subsonic-response"].directory.child, function (i, child) {
                        if (child.id === songid) {
                            title = child.title;
                            artist = child.artist;
                            album = child.album;
                            coverart = child.coverArt;
                        }
                    });
                }
            }
            $('#songdetails_song').html(title);
            $('#songdetails_song').attr('parentid', albumid);
            $('#songdetails_song').attr('childid', songid);
            $('#songdetails_artist').html(artist + ' - ' + album);
            $('#coverartimage').attr('href', baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + coverart);
            $('#coverartimage img').attr('src', baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=jsonp&size=50&id=' + coverart);
            $('#playermiddle').css('visibility', 'visible');
            $('#songdetails').css('visibility', 'visible');
            // SoundManager Initialize
            var salt = Math.floor(Math.random()*100000);
            if (audio) {
                soundManager.destroySound('audio');
            }
            audio = soundManager.createSound({
                id: 'audio',
                url: baseURL + '/stream.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + songid + '&salt=' + salt,
                stream: true,
                whileloading: function () {
                    if (debug) {
                        console.log('loaded:' + this.bytesLoaded + ' total:' + this.bytesTotal);
                    }
                    var percent = this.bytesLoaded / this.bytesTotal;
                    var scrubber = $('#audio_wrapper0').find(".scrubber");
                    var loaded = $('#audio_wrapper0').find(".loaded");
                    loaded.css('width', (scrubber.get(0).offsetWidth * percent) + 'px');
                },
                whileplaying: function () {
                    //console.log('position:' + this.position + ' duration:' + this.duration);
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
                        scrobbleSong(true);
                    }
                },
                onload: function () {
                    var duration = $('#audio_wrapper0').find(".duration");
                    var dp = this.duration / 1000,
                        dm = Math.floor(dp / 60),
                        ds = Math.floor(dp % 60);
                    duration.html((dm < 10 ? '0' : '') + dm + ':' + (ds < 10 ? '0' : '') + ds);
                },
                onfinish: function () {
                    var next = $('#CurrentPlaylistContainer tr.playing').next();
                    changeTrack(next);
                }
            });
            audio.play('audio');

            $('table.songlist tr.song').removeClass('playing');
            $(el).addClass('playing');
            $('#PlayTrack').find('img').attr('src', 'images/pause_24x32.png');
            $('#PlayTrack').addClass('playing');
            scrobbleSong(false);
            scrobbled = false;

            if ($.cookie('EnableNotifications')) {
                showNotification(baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=jsonp&size=50&id=' + coverart, title, artist + ' - ' + album);
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
function playAll() {
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
function changeTrack(next) {
    var songid = $(next).attr('childid');
    if (songid !== undefined) {
        var albumid = $(next).attr('parentid');
        if (debug) { console.log(next + " " + songid +" " + albumid) }
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
function search(type, query) {
    $.ajax({
        url: baseURL + '/search2.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&query=' + query,
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].searchResult2 !== "") {
                $("#AlbumRows").empty();
                var header = generateSongHeaderHTML();
                $("#AlbumHeader").html(header);
                // There is a bug in the API that doesn't return a JSON array for one artist
                var children = [];
                if (data["subsonic-response"].searchResult2.song.length > 0) {
                    children = data["subsonic-response"].searchResult2.song;
                } else {
                    children[0] = data["subsonic-response"].searchResult2.song;
                }

                var rowcolor;
                var albumhtml;
                $.each(children, function (i, child) {
                    if (i % 2 === 0) {
                        rowcolor = 'even';
                    } else {
                        rowcolor = 'odd';
                    }

                    var track;
                    if (child.track === undefined) { track = "&nbsp;"; } else { track = child.track; }
                    var time = secondsToTime(child.duration);
                    albumhtml = generateSongHTML(rowcolor, child.id, child.parent, track, child.title, child.artist, child.album, child.coverArt, child.userRating, time['m'], time['s']);
                    $(albumhtml).appendTo("#AlbumRows");
                });
            }
        }
    });
}
var starttime;
var updater;
function updateChatMessages() {
    updater = $.periodic({ period: 1000, decay: 1.5, max_period: 1800000 }, function () {
        $.ajax({
            periodic: this,
            url: baseURL + '/getChatMessages.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&since=' + starttime,
            method: 'GET',
            dataType: 'jsonp',
            timeout: 10000,
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function (data) {
                if (data["subsonic-response"].chatMessages.chatMessage === undefined) {
                    this.periodic.increment();
                } else {
                    var msgs = [];
                    if (data["subsonic-response"].chatMessages.chatMessage.length > 0) {
                        msgs = data["subsonic-response"].chatMessages.chatMessage;
                    } else {
                        msgs[0] = data["subsonic-response"].chatMessages.chatMessage;
                    }
                    this.periodic.reset();
                    var sorted = msgs.sort(function (a, b) {
                        return a.time - b.time;
                    });
                    var x = 1;
                    $.each(sorted, function (i, msg) {
                        var chathtml = '<div class=\"msg\">';
                        chathtml += '<span class=\"time\">' + $.format.date(new Date(parseInt(msg.time, 10)), 'hh:mm:ss a') + '</span> ';
                        chathtml += '<span class=\"user\">' + msg.username + '</span></br>';
                        chathtml += '<span class=\"msg\">' + msg.message + '</span>';
                        chathtml += '</div>';
                        $(chathtml).appendTo("#ChatMsgs");
                        if (x === sorted.length) {
                            starttime = msg.time;
                        }
                        x++;
                    });
                    $("#ChatMsgs").linkify();
                    $("#ChatMsgs").attr({ scrollTop: $("#ChatMsgs").attr("scrollHeight") });
                }
            }
        });
    });
}
function stopUpdateChatMessages() {
    updater.cancel();
}
function addChatMessage(msg) {
    $.ajax({
        type: 'GET',
        url: baseURL + '/addChatMessage.view',
        dataType: 'jsonp',
        timeout: 10000,
        data: { u: username, p: passwordenc, v: version, c: applicationName, f: "jsonp", message: msg },
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function () {
            updater.reset();
        },
        traditional: true // Fixes POST with an array in JQuery 1.4
    });
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

function loadPlaylists(refresh) {
    if (refresh) {
        $('#PlaylistContainer').empty();
    }
    var content = $('#PlaylistContainer').html();
    if (content === "") {
        // Load Playlists
        $.ajax({
            url: baseURL + '/getPlaylists.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp',
            method: 'GET',
            dataType: 'jsonp',
            timeout: 10000,
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function (data) {
                var playlists = [];
                if (data["subsonic-response"].playlists.playlist.length > 0) {
                    playlists = data["subsonic-response"].playlists.playlist;
                } else {
                    playlists[0] = data["subsonic-response"].playlists.playlist;
                }
                $.each(playlists, function (i, playlist) {
                    var html = "";
                    html += '<li id=\"' + playlist.id + '\" class=\"item\">';
                    html += '<span>' + playlist.name + '</span>';
                    html += '<div class=\"floatright\"><a class=\"play\" href=\"\" title=\"Play\"></a></div>';
                    html += '<div class=\"floatright\"><a class=\"add\" href=\"\" title=\"Add To Current Playlist\"></a></div>';
                    html += '</li>';
                    $(html).appendTo("#PlaylistContainer");
                });
            }
        });
    }
}
function loadPlaylistsForMenu(menu) {
    $('#' + menu).empty();
    $.ajax({
        url: baseURL + '/getPlaylists.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp',
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            var playlists = [];
            if (data["subsonic-response"].playlists.playlist.length > 0) {
                playlists = data["subsonic-response"].playlists.playlist;
            } else {
                playlists[0] = data["subsonic-response"].playlists.playlist;
            }
            $.each(playlists, function (i, playlist) {
                if (menu === 'submenu_AddCurrentToPlaylist') {
                    $("<a href=\"#\" onclick=\"javascript:addToPlaylist('" + playlist.id + "', 'current'); return false;\">" + playlist.name + "</a><br />").appendTo("#" + menu);
                } else {
                    $("<a href=\"#\" onclick=\"javascript:addToPlaylist('" + playlist.id + "', ''); return false;\">" + playlist.name + "</a><br />").appendTo("#" + menu);
                }
            });
            //$("<a href=\"#\" onclick=\"javascript:addToPlaylist('new'); return false;\">+ New Playlist</a><br />").appendTo("#submenu");
        }
    });
}
function newPlaylist() {
    var reply = prompt("Choose a name for your new playlist.", "");
    if (reply) {
        $.ajax({
            url: baseURL + '/createPlaylist.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&name=' + reply,
            method: 'GET',
            dataType: 'jsonp',
            timeout: 10000,
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function (data) {
                loadPlaylists(true);
            }
        });
    }
}
function deletePlaylist(id) {
    $.ajax({
        url: baseURL + '/deletePlaylist.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + id,
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            loadPlaylists(true);
            $('#TrackContainer tbody').empty();
        }
    });
}
function addToPlaylist(playlistid, from) {
    var selected = [];
    var el;
    if (from === 'current') {
        el = $('#CurrentPlaylist table.songlist tr.selected');
    } else {
        el = $('#Albums table.songlist tr.selected');
    }
    el.each(function (index) {
        selected.push($(this).attr('childid'));
    });
    if (selected.length > 0) {
        if (playlistid !== 'new') { // Create new playlist from here, will implement in UI later
            // Get songs from playlist
            var currentsongs = [];
            $.ajax({
                url: baseURL + '/getPlaylist.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + playlistid,
                method: 'GET',
                dataType: 'jsonp',
                timeout: 10000,
                beforeSend: function (req) {
                    req.setRequestHeader('Authorization', auth);
                },
                success: function (data) {
                    // There is a bug in the API that doesn't return a JSON array for one artist
                    var children = [];
                    if (data["subsonic-response"].playlist.entry !== undefined) {
                        if (data["subsonic-response"].playlist.entry.length > 1) {
                            children = data["subsonic-response"].playlist.entry;
                        } else {
                            children[0] = data["subsonic-response"].playlist.entry;
                        }
                        $.each(children, function (i, child) {
                            currentsongs.push(child.id);
                        });
                    }
                    var newsongs = [];
                    var count = 0;
                    $.each(selected, function (i, songid) {
                        if (jQuery.inArray(songid, currentsongs) === -1) {
                            currentsongs.push(songid);
                            count++;
                        }
                    });
                    if (count > 0) {
                        $.ajax({
                            type: 'GET',
                            url: baseURL + '/createPlaylist.view',
                            dataType: 'jsonp',
                            timeout: 10000,
                            data: { u: username, p: passwordenc, v: version, c: applicationName, f: "jsonp", playlistId: playlistid, songId: currentsongs },
                            beforeSend: function (req) {
                                req.setRequestHeader('Authorization', auth);
                            },
                            success: function () {
                                $('table.songlist tr.song').each(function () {
                                    $(this).removeClass('selected');
                                });
                                updateMessage('Playlist Updated!');
                            },
                            traditional: true // Fixes POST with an array in JQuery 1.4
                        });
                    }
                }
            });
        } else {
            $.ajax({
                type: 'GET',
                url: baseURL + '/createPlaylist.view',
                dataType: 'jsonp',
                timeout: 10000,
                data: { u: username, p: passwordenc, v: version, c: applicationName, f: "jsonp", name: 'New Playlist', songId: selected },
                beforeSend: function (req) {
                    req.setRequestHeader('Authorization', auth);
                },
                success: function () {
                    $('table.songlist tr.song').each(function () {
                        $(this).removeClass('selected');
                    });
                    updateMessage('Playlist Created!');
                },
                traditional: true // Fixes POST with an array in JQuery 1.4
            });
        }
        setTimeout(function () { $('div.submenu').fadeOut(); }, 100);
    }
}
function addToCurrent(addAll) {
    var count
    if (addAll) {
        count = $('#AlbumContainer tr').length;
    } else {
        count = $('#AlbumContainer tr.selected').length;
    }
    if (count > 0) {
        if (addAll) {
            $('#AlbumContainer tr.song').each(function (index) {
                $(this).clone().appendTo('#CurrentPlaylistContainer tbody');
                updateMessage(count + ' Song(s) Added');
            });
        } else {
            $('#AlbumContainer tr.selected').each(function (index) {
                $(this).clone().appendTo('#CurrentPlaylistContainer tbody');
                updateMessage(count + ' Song(s) Added');
            });
        }
    }
}
function downloadItem(id) {
    var url;
    if (id) {
        url = baseURL + '/download.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + id;
        window.location = url;
    }
    /*
    $('table.songlist tr.selected').each(function (index) {
        id = $(this).attr('childid');
        if (id) {
            url = baseURL + '/download.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + id;
            window.location = url;
        }
    });
    */
}
function savePlaylist(playlistid) {
    var songs = [];
    $('#TrackContainer tr.song').each(function (index) {
        songs.push($(this).attr('childid'));
    });
    if (songs.length > 0) {
        $.ajax({
            type: 'GET',
            url: baseURL + '/createPlaylist.view',
            dataType: 'jsonp',
            timeout: 10000,
            data: { u: username, p: passwordenc, v: version, c: applicationName, f: "jsonp", playlistId: playlistid, songId: songs },
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function () {
                getPlaylist(playlistid);
                updateMessage('Playlist Updated!');
            },
            traditional: true // Fixes POST with an array in JQuery 1.4
        });
    }
}
function getPlaylist(id, action, appendto) {
    $.ajax({
        url: baseURL + '/getPlaylist.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&id=' + id,
        method: 'GET',
        dataType: 'jsonp',
        timeout: 10000,
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].playlist.entry !== undefined) {
                if (appendto === '#TrackContainer tbody') {
                    $(appendto).empty();
                    var header = generateSongHeaderHTML();
                    $("#TrackContainer thead").html(header);
                }
                if (action === 'autoplay') {
                    $(appendto).empty();
                }
                // There is a bug in the API that doesn't return a JSON array for one artist
                var children = [];
                if (data["subsonic-response"].playlist.entry.length > 0) {
                    children = data["subsonic-response"].playlist.entry;
                } else {
                    children[0] = data["subsonic-response"].playlist.entry;
                }

                var rowcolor;
                var html;
                $.each(children, function (i, child) {
                    if (i % 2 === 0) {
                        rowcolor = 'even';
                    } else {
                        rowcolor = 'odd';
                    }
                    var track;
                    if (child.track === undefined) { track = "&nbsp;"; } else { track = child.track; }
                    var time = secondsToTime(child.duration);
                    html = generateSongHTML(rowcolor, child.id, child.parent, track, child.title, child.artist, child.album, child.coverArt, child.userRating, time['m'], time['s']);
                    $(html).appendTo(appendto);
                });
                if (appendto === '#CurrentPlaylistContainer tbody') {
                    updateMessage(children.length + ' Song(s) Added');
                }
                if (action === 'autoplay') {
                    autoPlay();
                }
            } else {
                if (appendto === '#TrackContainer tbody') {
                    $(appendto).empty();
                }
            }
        }
    });
}

/* Reusable Functions */
function confirmDelete() {
    var question = confirm('Are you sure you want to delete the selected item(s)?');
    if (question) {
        return true;
    }
    else {
        return false;
    }
}
function makeBaseAuth(user, password) {
    var tok = user + ':' + password;
    var hash = $.base64Encode(tok);
    return "Basic " + hash;
}
function HexEncode(n) {
    for (var u = "0123456789abcdef", i = [], r = [], t = 0; t < 256; t++)
        i[t] = u.charAt(t >> 4) + u.charAt(t & 15);
    for (t = 0; t < n.length; t++)
        r[t] = i[n.charCodeAt(t)];
    return r.join("") 
}
function findKeyForCode(code) {
    var map = { 'keymap': [
	                { 'key': 'a', 'code': 65 },
	                { 'key': 'b', 'code': 66 },
	                { 'key': 'c', 'code': 67 },
	                { 'key': 'd', 'code': 68 },
	                { 'key': 'e', 'code': 69 },
	                { 'key': 'f', 'code': 70 },
	                { 'key': 'g', 'code': 71 },
	                { 'key': 'h', 'code': 72 },
	                { 'key': 'i', 'code': 73 },
	                { 'key': 'j', 'code': 74 },
	                { 'key': 'k', 'code': 75 },
	                { 'key': 'l', 'code': 76 },
	                { 'key': 'm', 'code': 77 },
	                { 'key': 'n', 'code': 78 },
	                { 'key': 'o', 'code': 79 },
	                { 'key': 'p', 'code': 80 },
	                { 'key': 'q', 'code': 81 },
	                { 'key': 'r', 'code': 82 },
	                { 'key': 's', 'code': 83 },
	                { 'key': 't', 'code': 84 },
	                { 'key': 'u', 'code': 85 },
	                { 'key': 'v', 'code': 86 },
	                { 'key': 'w', 'code': 87 },
	                { 'key': 'x', 'code': 88 },
	                { 'key': 'y', 'code': 89 },
	                { 'key': 'z', 'code': 90 }
                 ]
    };
    var keyFound = 0;
    $.each(map.keymap, function (i, mapping) {
        if (mapping.code === code) {
            keyFound = mapping.key;
        }
    });
    return keyFound;
}
function popOut()
{
    window.open(hostURL, "External Player", "status = 1, height = 735, width = 840, resizable = 0");
}
function secondsToTime(secs) {
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);
    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}
function updateMessage(msg) {
    $('#messages').text(msg);
    $('#messages').fadeIn();
    setTimeout(function () { $('#messages').fadeOut(); }, 5000);
}
// Convert to unicode support
var toHTML = {
        on: function(str) {
        var a = [],
        i = 0;
        for (; i < str.length;) a[i] = str.charCodeAt(i++);
        return "&#" + a.join(";&#") + ";"
        },
        un: function(str) {
        return str.replace(/&#(x)?([^&]{1,5});?/g,
        function(a, b, c) {
        return String.fromCharCode(parseInt(c, b ? 16 : 10))
        })
    }
};
function setTitle(text) {
    if (text != "") {
        document.title = text;
    }
}
var timer = null;
var scrollMsg = "";
var pos = 0;
function scrollTitle(text) {
    if (scrollMsg === "") {
        if (text === "") {
            scrollMsg = document.title;
        } else {
            scrollMsg = text;
        }
    } else {
        if (text != undefined && text != scrollMsg) {
            scrollMsg = text;
        }
    }
    var msg = scrollMsg;
    var speed = 1200;
    var endChar = "   ";
    var ml = msg.length;

    title = msg.substr(pos, ml) + endChar + msg.substr(0, pos);
    document.title = title;

    pos++;
    if (pos > ml) {
        pos = 0;
    } else {
        timer = window.setTimeout("scrollTitle()", speed);
    }
    // To stop timer, clearTimeout(timer);
}
function requestPermissionIfRequired() {
    if (!hasNotificationPermission() && (window.webkitNotifications)) {
        window.webkitNotifications.requestPermission();
    }
}
function hasNotificationPermission() {
    return !!(window.webkitNotifications) && (window.webkitNotifications.checkPermission() == 0);
}
var notifications = new Array();
function showNotification(pic, title, text) {
    if (hasNotificationPermission()) {
        closeAllNotifications()
        var popup = window.webkitNotifications.createNotification(pic, title, text);
        notifications.push(popup);
        setTimeout(function (notWin) {
        notWin.cancel();
        }, 10000, popup);
        popup.show();
    } else {
        console.log("showNotification: No Permission");
    }
}
function closeAllNotifications() {
    for (notification in notifications) {
        notifications[notification].cancel();
    }
}