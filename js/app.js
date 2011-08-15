// Global Variables
var hostURL = location.href;
var baseURL = 'http://' + location.host + '/rest';
var username = $.cookie('username');
var password = $.cookie('password');
var auth = makeBaseAuth(username, password);

function loadTabContent(tab) {
    switch (tab) {
        case '#tabLibrary':
            loadArtists();
            // Load Albums Click Event
            $('ul#ArtistContainer li.item').live('click', function () {
                $('ul#ArtistContainer li').removeClass('selected');
                $(this).addClass('selected');
                getAlbums($(this).attr("id"));
            });
            // Load in a track on click
            $('#Albums li.song').live('dblclick', function (e) {
                e.preventDefault();
                $(this).addClass('playing').siblings().removeClass('playing');
                var songid = $(this).attr('childid');
                var albumid = $(this).attr('parentid');
                playSong(songid, albumid);
            });
            break;
        case '#tabPlaylists':
            loadPlaylists();
            // Load Playlist Click Event
            $('ul#PlaylistContainer li.item').live('click', function () {
                $('ul#PlaylistContainer li').removeClass('selected');
                $(this).addClass('selected');
                getPlaylist($(this).attr("id"));
            });
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
            url: baseURL + '/getIndexes.view?v=1.5.0&c=subweb&f=json',
            method: 'GET',
            dataType: 'json',
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function (data) {
                $.each(data["subsonic-response"].indexes.index, function (i, index) {
                    $('<li class=\"index\" id=\"index_' + index.name + '\">' + index.name + '</li>').appendTo("#ArtistContainer");
                        $.each(index.artist, function (i, artist) {
                            if (artist.name != undefined) {
                                var html = "";
                                html += '<li id=\"' + artist.id + '\" class=\"item\">';
                                html += '<span>' + artist.name + '</span>';
                                html += '</li>';
                                $(html).appendTo("#ArtistContainer");
                            }
                    });
                });
            }
        });
    }
}
function getAlbums(id) {
    $.ajax({
        url: baseURL + '/getMusicDirectory.view?v=1.5.0&c=subweb&f=json&id=' + id,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            $("#AlbumContainer").empty();
            // There is a bug in the API that doesn't return a JSON array for one artist
            var children = [];
            if (data["subsonic-response"].directory.child.length > 0) {
                children = data["subsonic-response"].directory.child;
            } else {
                children[0] = data["subsonic-response"].directory.child;
            }

            var rowcolor;
            var albumhtml;
            $.each(children, function (i, child) {
                if (i % 2 == 0) {
                    rowcolor = 'even';
                } else {
                    rowcolor = 'odd';
                }

                if (child.isDir == true) {
                    albumhtml = '<li class=\"album ' + rowcolor + '\">';
                    albumhtml += '<div class=\"albumart\"><img class=\"floatleft\" src=\"' + baseURL + '/getCoverArt.view?v=1.5.0&c=subweb&f=json&size=50&id=' + child.coverArt + '\" /></div>';
                    albumhtml += '<a href=\"#\" onclick=\"javascript:getAlbums(\'' + child.id + '\'); return false;\">' + child.title + '</a>';
                    albumhtml += '</li>';
                    $(albumhtml).appendTo("#AlbumContainer");
                } else {
                    var track;
                    if (child.track === undefined) { track = "&nbsp;"; } else { track = child.track; }
                    var time = secondsToTime(child.duration);
                    albumhtml = '<li class=\"song ' + rowcolor + '\" childid=\"' + child.id + '\" parentid=\"' + child.parent + '\">';
                    albumhtml += '<span class=\"track\">' + track + '</span> ';
                    albumhtml += child.title;
                    albumhtml += ' <small>' + time['m'] + ':' + time['s'] + '</small>';
                    albumhtml += '</li>';
                    $(albumhtml).appendTo("#AlbumContainer");
                }
            });
        }
    });
}
function playSong(songid, albumid) {
    $.ajax({
        url: baseURL + '/getMusicDirectory.view?v=1.5.0&c=subweb&f=json&id=' + albumid,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].directory.child.length > 0) {
                $.each(data["subsonic-response"].directory.child, function (i, child) {
                    if (child.id == songid) {
                        $('#songdetails_song').html(child.title);
                        $('#songdetails_artist').html(child.artist);
                        $('#songdetails_album').html(child.album);
                    }
                });
            } else {

            }
            audio.load(baseURL + '/stream.view?v=1.5.0&c=subweb&f=json&id=' + songid);
            audio.play();
            $('#coverartimage').attr('src', baseURL + '/getCoverArt.view?v=1.5.0&c=subweb&f=json&size=120&id=' + songid);
        }
    });
}

function search(type, query) {
    $.ajax({
        url: baseURL + '/search2.view?v=1.5.0&c=subweb&f=json&query=' + query,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].searchResult2 != "") {
                $("#AlbumContainer").empty();
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
                    albumhtml = '<li class=\"song ' + rowcolor + '\" childid=\"' + child.id + '\" parentid=\"' + child.parent + '\">';
                    albumhtml += '<span class=\"track\">' + track + '</span> ';
                    albumhtml += child.title;
                    albumhtml += '</li>';
                    $(albumhtml).appendTo("#AlbumContainer");
                });
            }
        }
    });
}

function loadPlaylists(refresh) {
    if (refresh) {
        $('#PlaylistContainer').empty();
    }
    var content = $('#PlaylistContainer').html();
    if (content == "") {
        // Load Playlists
        $.ajax({
            url: baseURL + '/getPlaylists.view?v=1.5.0&c=subweb&f=json',
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
                    html += '</li>';
                    $(html).appendTo("#PlaylistContainer");
                });
            }
        });
    }
}
function loadPlaylistsForMenu() {
    $('#submenu').empty();
    $.ajax({
        url: baseURL + '/getPlaylists.view?v=1.5.0&c=subweb&f=json',
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            $.each(data["subsonic-response"].playlists.playlist, function (i, playlist) {
                $("<a href=\"#\" onclick=\"javascript:addToPlaylist('" + playlist.id + "'); return false;\">" + playlist.name + "</a><br />").appendTo("#submenu");
            });
            //$("<a href=\"#\" onclick=\"javascript:addToPlaylist('new'); return false;\">+ New Playlist</a><br />").appendTo("#submenu");
        }
    });
}
function newPlaylist() {
    var reply = prompt("Choose a name for your new playlist.", "");
    if (reply != "") {
        $.ajax({
            url: baseURL + '/createPlaylist.view?v=1.5.0&c=subweb&f=json&name=' + reply,
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
        url: baseURL + '/deletePlaylist.view?v=1.5.0&c=subweb&f=json&id=' + id,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            loadPlaylists(true);
            $('ul#TrackContainer').empty();
        }
    });
}
function addToPlaylist(playlistid) {
    var selected = [];
    $('ul.songlist li.selected').each(function (index) {
        selected.push($(this).attr('childid'));
    });
    if (selected.length > 0) {
        if (playlistid != 'new') { // Create new playlist from here, will implement in UI later
            // Get songs from playlist
            var currentsongs = [];
            $.ajax({
                url: baseURL + '/getPlaylist.view?v=1.5.0&c=subweb&f=json&id=' + playlistid,
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
                            data: { v: "1.5.0", c: "subweb", f: "json", playlistId: playlistid, songId: currentsongs },
                            beforeSend: function (req) {
                                req.setRequestHeader('Authorization', auth);
                            },
                            success: function () {
                                $('ul.songlist li.song').each(function () {
                                    $(this).removeClass('selected');
                                });
                                alert('Playlist Updated!');
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
                data: { v: "1.5.0", c: "subweb", f: "json", name: 'New Playlist', songId: selected },
                beforeSend: function (req) {
                    req.setRequestHeader('Authorization', auth);
                },
                success: function () {
                    $('ul.songlist li.song').each(function () {
                        $(this).removeClass('selected');
                    });
                    alert('Playlist Created!');
                },
                traditional: true // Fixes POST with an array in JQuery 1.4
            });
        }
    }
}
function savePlaylist(playlistid) {
    var songs = [];
    $('ul#TrackContainer li.song').each(function (index) {
        songs.push($(this).attr('childid'));
    });
    if (songs.length > 0) {
        $.ajax({
            type: 'POST',
            url: baseURL + '/createPlaylist.view',
            data: { v: "1.5.0", c: "subweb", f: "json", playlistId: playlistid, songId: songs },
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function () {
                getPlaylist(playlistid);
                alert('Playlist Updated!');
            },
            traditional: true // Fixes POST with an array in JQuery 1.4
        });
    }
}
function getPlaylist(id) {
    $.ajax({
        url: baseURL + '/getPlaylist.view?v=1.5.0&c=subweb&f=json&id=' + id,
        method: 'GET',
        dataType: 'json',
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function (data) {
            if (data["subsonic-response"].playlist.entry != undefined) {
                $("#TrackContainer").empty();
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
                    html = '<li class=\"song ' + rowcolor + '\" childid=\"' + child.id + '\" parentid=\"' + child.parent + '\">';
                    html += '<span class=\"track\">' + track + '</span> ';
                    html += child.title;
                    html += '</li>';
                    $(html).appendTo("#TrackContainer");
                });
            } else {
                $('ul#TrackContainer').empty();
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