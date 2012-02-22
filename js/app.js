// Global Variables
var hostURL = location.href;
var baseURL;
if ($.cookie('subdirectory')) {
    baseURL = location.protocol + '//' + location.host + '/' + $.cookie('subdirectory') + '/rest';
} else {
    baseURL = location.protocol + '//' + location.host + '/rest';
}
var applicationName;
if ($.cookie('applicationname')) {
    applicationName = $.cookie('applicationname');
} else {
    applicationName = 'MiniSub';
}
var username = $.cookie('username');
var password = $.cookie('password');
var auth = makeBaseAuth(username, password);
function loadTabContent(tab) {
    switch (tab) {
        case '#tabLibrary':
            loadArtists();
            break;
        case '#tabCurrent':
            var header = generateSongHeaderHTML();
            $("#CurrentPlaylistContainer thead").html(header);
            break;
        case '#tabPlaylists':
            loadPlaylists();
            break;
        case '#tabPreferences':
            //loadPreferences();
            break;
        default:
            //alert('default');
            break;
    }
}

function loadArtists(refresh) {
    if (refresh) {
        $('#ArtistContainer').empty();
    }
    var content = $('#ArtistContainer').html();
    if (content == "") {
        // Load Artist List
        $.ajax({
            url: baseURL + '/getIndexes.view?v=1.6.0&c=' + applicationName + '&f=json',
            method: 'GET',
            dataType: 'json',
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function (data) {
                if (data["subsonic-response"].status == 'ok') {
                    var indexlist, indexname;
                    $.each(data["subsonic-response"].indexes.index, function (i, index) {
                        if (index.name == '#') {
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
                            if (artist.name != undefined) {
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
function getAlbums(id, action, appendto) {
    $.ajax({
        url: baseURL + '/getMusicDirectory.view?v=1.6.0&c=' + applicationName + '&f=json&id=' + id,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (action == '') {
                $('#AlbumRows').empty();
            }
            if (action == 'autoplay') {
                $('#CurrentPlaylistContainer tbody').empty();
            }
            if (data["subsonic-response"].directory.child != undefined) {
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
                $.each(children, function (i, child) {
                    if (i % 2 == 0) {
                        rowcolor = 'even';
                    } else {
                        rowcolor = 'odd';
                    }
                    isDir = child.isDir;
                    if (isDir == true) {
                        albumhtml = generateAlbumHTML(rowcolor, child.id, child.parent, child.coverArt, child.title, child.artist, child.userRating);
                    } else {
                        var track;
                        if (child.track === undefined) { track = "&nbsp;"; } else { track = child.track; }
                        var time = secondsToTime(child.duration);
                        albumhtml = generateSongHTML(rowcolor, child.id, child.parent, track, child.title, child.artist, child.album, child.coverArt, child.userRating, time['m'], time['s']);
                    }
                    $(albumhtml).appendTo(appendto);
                });
                if (appendto == '#AlbumRows' && isDir == true) {
                    var header = generateAlbumHeaderHTML();
                }
                if (appendto == '#AlbumRows' && isDir == false) {
                    var header = generateSongHeaderHTML();
                }
                $("#AlbumHeader").html(header);
                if (action == 'autoplay') {
                    autoPlay();
                }
            }
        }
    });
}
function getAlbumListBy(id) {
    var size;
    if ($.cookie('AutoAlbumSize') == null) {
        size = 15;
    } else {
        size = $.cookie('AutoAlbumSize');
    }
    $.ajax({
        url: baseURL + '/getAlbumList.view?v=1.6.0&c=' + applicationName + '&f=json&size=' + size + '&type=' + id,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].albumList.album != undefined) {
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
                    if (i % 2 == 0) {
                        rowcolor = 'even';
                    } else {
                        rowcolor = 'odd';
                    }
                    // Only show albums, not songs (Rated songs will also be returned in API call, trying to display them will break Back button, disabled for now)
                    var albumhtml;
                    if (album.isDir == true) {
                        albumhtml = generateAlbumHTML(rowcolor, album.id, album.parent, album.coverArt, album.title, album.artist, album.userRating);
                    }
                    $(albumhtml).appendTo("#AlbumRows")
                });
            } else {
                $('#AlbumRows').empty();
            }
        }
    });
}
function getRandomSongList(action, appendto) {
    var size;
    if ($.cookie('AutoPlaylistSize') == null) {
        size = 25;
    } else {
        size = $.cookie('AutoPlaylistSize');
    }
    $.ajax({
        url: baseURL + '/getRandomSongs.view?v=1.6.0&c=' + applicationName + '&f=json&size=' + size,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].randomSongs.song != undefined) {
                if (appendto == '#TrackContainer') {
                    $("#TrackContainer").empty();
                }
                if (action == 'autoplay') {
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
                    if (i % 2 == 0) {
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
                if (action == 'autoplay') {
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
    if (rating == 5) {
        html += '<a class=\"favorite\" href=\"\" title=\"Favorite\"></a>';
    } else {
        html += '<a class=\"rate\" href=\"\" title=\"Add To Favorites\"></a>';
    }
    html += '</td>';
    html += '<td class=\"albumart\"><img src=\"' + baseURL + '/getCoverArt.view?v=1.6.0&c=' + applicationName + '&f=json&size=50&id=' + coverart + '\" /></td>';
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
    if (rating == 5) {
        html += '<a class=\"favorite\" href=\"\" title=\"Favorite\"></a>';
    } else {
        html += '<a class=\"rate\" href=\"\" title=\"Add To Favorites\"></a>';
    }
    html += '</td>';
    html += '<td class=\"track\">' + track + '</td>';
    html += '<td class=\"title\">' + title + '</td>';
    html += '<td class=\"artist\">' + artist + '</td>';
    html += '<td class=\"album\">' + album + '<img src=\"' + baseURL + '/getCoverArt.view?v=1.6.0&c=' + applicationName + '&f=json&size=25&id=' + coverart + '\" /></td>';
    html += '<td class=\"time\">' + m + ':' + s + '</td>';
    html += '</tr>';
    return html;
}

function refreshRowColor() {
    $.each($('table.songlist tr.song'), function (i) {
        $(this).removeClass('even odd');
        var rowcolor;
        if (i % 2 == 0) {
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
        url: baseURL + '/getMusicDirectory.view?v=1.6.0&c=' + applicationName + '&f=json&id=' + albumid,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            var title, artist, album;
            if (data["subsonic-response"].directory != undefined) {
                if (data["subsonic-response"].directory.child.length > 0) {
                    $.each(data["subsonic-response"].directory.child, function (i, child) {
                        if (child.id == songid) {
                            title = child.title;
                            artist = child.artist;
                            album = child.album;
                        }
                    });
                }
            }
            $('#songdetails_song').html(title);
            $('#songdetails_song').attr('parentid', albumid);
            $('#songdetails_song').attr('childid', songid);
            $('#songdetails_artist').html(artist + ' - ' + album);
            $('#coverartimage').attr('href', baseURL + '/getCoverArt.view?v=1.6.0&c=' + applicationName + '&f=json&id=' + songid);
            $('#coverartimage img').attr('src', baseURL + '/getCoverArt.view?v=1.6.0&c=' + applicationName + '&f=json&size=56&id=' + songid);
            audio.load(baseURL + '/stream.view?v=1.6.0&c=' + applicationName + '&f=json&id=' + songid);
            audio.play();
            $('table.songlist tr.song').removeClass('playing');
            $(el).addClass('playing');
            $('#PlayTrack').find('img').attr('src', 'images/pause_24x32.png');
            $('#PlayTrack').addClass('playing');
            scrobbleSong(false);
            scrobbled = false;
        }
    });
}
function scrobbleSong(submission) {
    var songid = $('#songdetails_song').attr('childid');
    $.ajax({
        url: baseURL + '/scrobble.view?v=1.6.0&c=' + applicationName + '&f=json&id=' + songid + "&submission=" + submission,
        method: 'GET',
        dataType: 'json',
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
        url: baseURL + '/setRating.view?v=1.6.0&c=' + applicationName + '&f=json&id=' + songid + "&rating=" + rating,
        method: 'GET',
        dataType: 'json',
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
        audio.playPause();
    } else if ($(el).hasClass('paused')) {
        $(el).find('img').attr('src', 'images/pause_24x32.png');
        $(el).removeClass('paused');
        $(el).addClass('playing');
        audio.playPause();
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
    if (songid != undefined) {
        if (!next.length) next = $('#CurrentPlaylistContainer tr').first();
        //next.addClass('playing').siblings().removeClass('playing');
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
function search(type, query) {
    $.ajax({
        url: baseURL + '/search2.view?v=1.6.0&c=' + applicationName + '&f=json&query=' + query,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].searchResult2 != "") {
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
                    if (i % 2 == 0) {
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
function loadChatMessages() {
    $.ajax({
        url: baseURL + '/getChatMessages.view?v=1.6.0&c=' + applicationName + '&f=json',
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            $('#ChatMsgs').empty();
            var sorted = data["subsonic-response"].chatMessages.chatMessage.sort(function (a, b) {
                return a.time - b.time;
            });
            $.each(sorted, function (i, msg) {
                var chathtml = '<div class=\"msg\">';
                chathtml += '<span class=\"time\">' + $.format.date(new Date(parseInt(msg.time)), 'hh:mm:ss a') + '</span> ';
                chathtml += '<span class=\"user\">' + msg.username + '</span></br>';
                chathtml += '<span class=\"msg\">' + msg.message + '</span>';
                chathtml += '</div>';
                $(chathtml).appendTo("#ChatMsgs");
                if (i = 1) {
                    starttime = msg.time;
                }
            });
        }
    });
}
var updater;
function updateChatMessages() {
    updater = $.periodic({ period: 1000, decay: 1.5, max_period: 1800000 }, function () {
        $.ajax({
            periodic: this,
            url: baseURL + '/getChatMessages.view?v=1.6.0&c=' + applicationName + '&f=json&since=' + starttime,
            method: 'GET',
            dataType: 'json',
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
                    $.each(sorted, function (i, msg) {
                        var chathtml = '<div class=\"msg\">';
                        chathtml += '<span class=\"time\">' + $.format.date(new Date(parseInt(msg.time)), 'hh:mm:ss a') + '</span> ';
                        chathtml += '<span class=\"user\">' + msg.username + '</span></br>';
                        chathtml += '<span class=\"msg\">' + msg.message + '</span>';
                        chathtml += '</div>';
                        $(chathtml).appendTo("#ChatMsgs");
                        if (i = 1) {
                            starttime = msg.time;
                        }
                    });
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
        type: 'POST',
        url: baseURL + '/addChatMessage.view',
        data: { v: "1.6.0", c: applicationName, f: "json", message: msg },
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function () {
            updater.reset();
            //loadChatMessages();        
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
            url: baseURL + '/getNowPlaying.view?v=1.6.0&c=' + applicationName + '&f=json',
            method: 'GET',
            dataType: 'json',
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
                } else if (updaterNowPlayingData == $.param(data)) {
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
    if (content == "") {
        // Load Playlists
        $.ajax({
            url: baseURL + '/getPlaylists.view?v=1.6.0&c=' + applicationName + '&f=json',
            method: 'GET',
            dataType: 'json',
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function (data) {
                $.each(data["subsonic-response"].playlists.playlist, function (i, playlist) {
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
        url: baseURL + '/getPlaylists.view?v=1.6.0&c=' + applicationName + '&f=json',
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            $.each(data["subsonic-response"].playlists.playlist, function (i, playlist) {
                if (menu == 'submenu_AddCurrentToPlaylist') {
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
            url: baseURL + '/createPlaylist.view?v=1.6.0&c=' + applicationName + '&f=json&name=' + reply,
            method: 'GET',
            dataType: 'json',
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
        url: baseURL + '/deletePlaylist.view?v=1.6.0&c=' + applicationName + '&f=json&id=' + id,
        method: 'GET',
        dataType: 'json',
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
    if (from == 'current') {
        el = $('#CurrentPlaylist table.songlist tr.selected');
    } else {
        el = $('#Albums table.songlist tr.selected');
    }
    el.each(function (index) {
        selected.push($(this).attr('childid'));
    });
    if (selected.length > 0) {
        if (playlistid != 'new') { // Create new playlist from here, will implement in UI later
            // Get songs from playlist
            var currentsongs = [];
            $.ajax({
                url: baseURL + '/getPlaylist.view?v=1.6.0&c=' + applicationName + '&f=json&id=' + playlistid,
                method: 'GET',
                dataType: 'json',
                beforeSend: function (req) {
                    req.setRequestHeader('Authorization', auth);
                },
                success: function (data) {
                    // There is a bug in the API that doesn't return a JSON array for one artist
                    var children = [];
                    if (data["subsonic-response"].playlist.entry != undefined) {
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
                        if (jQuery.inArray(songid, currentsongs) == -1) {
                            currentsongs.push(songid);
                            count++;
                        }
                    });
                    if (count > 0) {
                        $.ajax({
                            type: 'POST',
                            url: baseURL + '/createPlaylist.view',
                            data: { v: "1.6.0", c: applicationName, f: "json", playlistId: playlistid, songId: currentsongs },
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
                type: 'POST',
                url: baseURL + '/createPlaylist.view',
                data: { v: "1.6.0", c: applicationName, f: "json", name: 'New Playlist', songId: selected },
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
    }
}
function addToCurrent() {
    var count = $('table.songlist tr.selected').length;
    $('table.songlist tr.selected').each(function (index) {
        $(this).clone().appendTo('#CurrentPlaylistContainer tbody');
        updateMessage(count + ' Song(s) Added');
    });
}
function savePlaylist(playlistid) {
    var songs = [];
    $('#TrackContainer tr.song').each(function (index) {
        songs.push($(this).attr('childid'));
    });
    if (songs.length > 0) {
        $.ajax({
            type: 'POST',
            url: baseURL + '/createPlaylist.view',
            data: { v: "1.6.0", c: applicationName, f: "json", playlistId: playlistid, songId: songs },
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
        url: baseURL + '/getPlaylist.view?v=1.6.0&c=' + applicationName + '&f=json&id=' + id,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].playlist.entry != undefined) {
                if (appendto == '#TrackContainer tbody') {
                    $(appendto).empty();
                    var header = generateSongHeaderHTML();
                    $("#TrackContainer thead").html(header);
                }
                if (action == 'autoplay') {
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
                    if (i % 2 == 0) {
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
                if (action == 'autoplay') {
                    autoPlay();
                }
            } else {
                if (appendto == '#TrackContainer tbody') {
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
        if (mapping.code == code) {
            keyFound = mapping.key;
        }
    });
    return keyFound;
}
function popOut() 
{
    window.open(hostURL, "External Player", "status = 1, height = 735, width = 840, resizable = 0")
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
    $('#messages').fadeIn()
    setTimeout(function () { $('#messages').fadeOut(); }, 5000);
}