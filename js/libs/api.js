function updateBaseParams() {
    baseURL = server + '/rest';
    baseParams = 'u=' + username + '&p=' + password + '&f=' + protocol + '&v=' + apiVersion + '&c=' + applicationName;
}
function ping() {
    $.ajax({
        url: baseURL + '/ping.view?' + baseParams,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            if (data["subsonic-response"].status == 'ok') {
                apiVersion = data["subsonic-response"].version;
                $('#SubsonicVersion').html(apiVersion);
                updateBaseParams();
            } else {
                if (typeof data["subsonic-response"].error != 'undefined') {
                    alert(data["subsonic-response"].error.message);
                }
            }
        },
        error: function () {
            alert('Bad Server');
        }
    });
}
function loadArtists(id, refresh) {
    if (debug) { console.log("LOAD ARTISTS"); }
    if (refresh) {
        $('#ArtistContainer').empty();
    }
    var url;
    if (id == "all") {
        url = baseURL + '/getIndexes.view?' + baseParams;
    } else if (id) {
        url = baseURL + '/getIndexes.view?' + baseParams + '&musicFolderId=' + id;
    } else {
        url = baseURL + '/getIndexes.view?' + baseParams;
    }
    if (debug) { console.log(url); }
    var content = $('#ArtistContainer').html();
    if (content === "") {
        // Load Artist List
        $.ajax({
            url: url,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            done: function () { if (debug) { console.log("DONE!"); } },
            error: function () { if (debug) { console.log("ERROR!"); } },
            success: function (data) {
                if (debug) { console.log("SUCCESS"); }
                if (data["subsonic-response"].status == 'ok') {
                    var indexlist, name;

                    if (typeof data["subsonic-response"].indexes != 'undefined') {
                        if (typeof data["subsonic-response"].indexes.shortcut != 'undefined') {
                            var shortcuts = [];
                            if (data["subsonic-response"].indexes.shortcut.length > 0) {
                                shortcuts = data["subsonic-response"].indexes.shortcut;
                            } else {
                                shortcuts[0] = data["subsonic-response"].indexes.shortcut;
                            }
                            var html = '<li class=\"index\" id=\"shortcuts\">Shortcuts</li>';
                            $(html).appendTo("#ArtistContainer");
                            $.each(shortcuts, function (i, item) {
                                if (item.name !== undefined) {
                                    var html = '<li id=\"' + item.id + '\" class=\"item\">';
                                    html += '<span>' + item.name + '</span>';
                                    html += '</li>';
                                    $(html).appendTo("#ArtistContainer");
                                }
                            });
                        }

                        var indexes = [];
                        if (typeof data["subsonic-response"].indexes != 'undefined') {
                            if (typeof data["subsonic-response"].indexes.index != 'undefined') {
                                if (data["subsonic-response"].indexes.index.length > 0) {
                                    indexes = data["subsonic-response"].indexes.index;
                                } else {
                                    indexes[0] = data["subsonic-response"].indexes.index;
                                }


                                $.each(indexes, function (i, index) {
                                    name = index.name;
                                    $('<li class=\"index\" id=\"index_' + name + '\" title=\"Scroll to Top\"><a name=\"index_' + name + '\">' + name + '</a><span class=\"floatright\">&uarr;</span></li>').appendTo("#ArtistContainer");
                                    indexlist += '<li><a href=\"#' + name + '\">' + name + '</a></li>';
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
                            }
                            var indexes = [];
                            if (data["subsonic-response"].indexes.child !== undefined) {
                                var rowcolor;
                                if (data["subsonic-response"].indexes.child.length > 0) {
                                    indexes = data["subsonic-response"].indexes.child;
                                } else {
                                    indexes[0] = data["subsonic-response"].indexes.child;
                                }
                                var appendto = '#AlbumContainer tbody';
                                $(appendto).empty();
                                $.each(indexes, function (i, child) {
                                    if (child.isVideo != true) {
                                        var html = generateRowHTML(child, appendto);
                                        $(html).appendTo(appendto);
                                    }
                                });
                                header = generateSongHeaderHTML();
                            }
                            if (smwidth) {
                                resizeSMSection(0);
                            }
                        }
                    } else {
                        var status = data["subsonic-response"].status;
                        if (status == 'ok') {
                            alert('Status: ' + status + ', but Subsonic is busy, wait and refresh...');
                        } else {
                            alert(msg);
                        }
                    }
                }
            }
        });
    }
}
function getMusicFolders() {
    $.ajax({
        url: baseURL + '/getMusicFolders.view?' + baseParams,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            if (data["subsonic-response"].musicFolders.musicFolder !== undefined) {
                var folders = [];
                if (data["subsonic-response"].musicFolders.musicFolder.length > 0) {
                    folders = data["subsonic-response"].musicFolders.musicFolder;
                } else {
                    folders[0] = data["subsonic-response"].musicFolders.musicFolder;
                }

                var savedMusicFolder = getCookie('MusicFolders') ? getCookie('MusicFolders') : null;
                var options = [];
                options.push('<option value="all">All Folders</option>');
                $.each(folders, function (i, folder) {
                    if (savedMusicFolder == folder.id && savedMusicFolder != null) {
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
function getGenres() {
    var genres = 'Acid Rock,Acoustic,Alt Country,Alt/Indie,Alternative & Punk,Alternative Metal,Alternative,AlternRock,Awesome,Bluegrass,Blues,Blues-Rock,Classic Hard Rock,Classic Rock,Comedy,Country,Country-Rock,Dance,Dance-Rock,Deep Funk,Easy Listening,Electronic,Electronica,Electronica/Dance,Folk,Folk/Rock,Funk,Grunge,Hard Rock,Heavy Metal,Holiday,House,Improg,Indie Rock,Indie,International,Irish,Jam Band,Jam,Jazz Fusion,Jazz,Latin,Live Albums,Metal,Music,Oldies,Other,Pop,Pop/Rock,Post Rock,Progressive Rock,Psychedelic Rock,Psychedelic,Punk,R&B,Rap & Hip-Hop,Reggae,Rock & Roll,Rock,Rock/Pop,Roots,Ska,Soft Rock,Soul,Southern Rock,Thrash Metal,Unknown,Vocal,World';
    var genresArr = genres.split(',');
    var options = [];
    options.push('<option value="">[Select Genre]</option>');
    $.each(genresArr, function (i, genre) {
        options.push('<option value="' + genre + '">' + genre + '</option>');
    });
    $('#Genres').html(options.join(''));
}
function loadAutoPlaylists(refresh) {
    if (debug) { console.log("LOAD AUTO PLAYLISTS"); }
    if (refresh) {
        $('#AutoPlaylistContainer').empty();
    }
    var content = $('#AutoPlaylistContainer').html();
    if (content == "") {
        var genres = getCookie('AutoPlaylists');
        var genresArr = [];
        if (genres) {
            genresArr = genres.split(',');
            genresArr.unshift('Random');
            genresArr.unshift('Starred');
        } else {
            genresArr.push('Starred');
            genresArr.push('Random');
        }
        $.each(genresArr, function (i, genre) {
            genre = genre.trim();
            if (genre != '') {
                var html = "";
                html += '<li class=\"item\" data-genre=\"' + genre + '\">';
                html += '<span>' + genre + '</span>';
                html += '<div class=\"floatright\"><a class=\"play\" href=\"\" data-genre=\"' + genre + '\" title=\"Play\"></a></div>';
                html += '<div class=\"floatright\"><a class=\"add\" href=\"\" data-genre=\"' + genre + '\" title=\"Add To Play Queue\"></a></div>';
                html += '</li>';
                $(html).appendTo("#AutoPlaylistContainer");
            }
        });
    }
}
function getMusicDirectory(id, action, appendto, artistid) {
    $.ajax({
        url: baseURL + '/getMusicDirectory.view?' + baseParams + '&id=' + id,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            if (action == '') {
                $('#AlbumContainer tbody').empty();
            }
            if (action === 'autoplay') {
                $('#CurrentPlaylistContainer tbody').empty();
            }
            if (action == 'link') {
                $('#AlbumContainer tbody').empty();
                $('#action_tabLibrary').trigger('click');
            }
            if (data["subsonic-response"].directory.child !== undefined) {
                var children = [];
                if (data["subsonic-response"].directory.child.length > 0) {
                    children = data["subsonic-response"].directory.child;
                } else {
                    children[0] = data["subsonic-response"].directory.child;
                }

                var isDir = false;
                var header, parentid, artist, album;
                $.each(children, function (i, child) {
                    var isVideo = false;
                    if (child.isDir == true) { isDir = true; }
                    if (child.isVideo == true) { isVideo = true; }
                    if (typeof child.parent != 'undefined') { parentid = child.parent; }
                    if (typeof child.artist != 'undefined') { artist = child.artist; }
                    if (typeof child.album != 'undefined') { album = child.album; }
                    //if (typeof child.artistId != 'undefined') { artistid = child.artistId; }
                    if (!isVideo) {
                        var html = generateRowHTML(child, appendto, artistid);
                        $(html).appendTo(appendto).hide().fadeIn('fast');
                    }
                });
                toggleAlbumListNextPrev('#status_Library', false, '', '');
                if (appendto == '#CurrentPlaylistContainer') {
                    updateMessage(children.length + ' Song(s) Added', true);
                }
                if (appendto == '#AlbumContainer tbody' && isDir == true) {
                    header = generateAlbumHeaderHTML();
                    $('#tabLibrary .subactions a.button').addClass('disabled');
                    $('#BreadCrumbs').html('<a href=\"\" parentid=\"' + parentid + '\">' + artist + '</a>');
                }
                if (appendto == '#AlbumContainer tbody' && isDir == false) {
                    header = generateSongHeaderHTML();
                    $('#tabLibrary .subactions a.button').removeClass('disabled');
                    var html;
                    if (typeof artistid == 'undefined' || artistid == '') {
                        html = '<span>' + artist + '</span> ><a href=\"\" albumid=\"' + parentid + '\">' + album + '</a>'
                    } else {
                        html = '<a href=\"\" parentid=\"' + artistid + '\">' + artist + '</a> ><a href=\"\" albumid=\"' + parentid + '\">' + album + '</a>'
                    }
                    $('#BreadCrumbs').html(html);
                }
                $("#AlbumContainer thead").html(header);
                if (action == 'autoplay') {
                    autoPlay();
                }
            }
        }
    });
}
/* Currently not being used */
function getArtist(id, action, appendto) {
    $.ajax({
        url: baseURL + '/getArtist.view?' + baseParams + '&id=' + id,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            if (action == '') {
                $('#AlbumContainer tbody').empty();
            }
            if (action === 'autoplay') {
                $('#CurrentPlaylistContainer tbody').empty();
            }
            if (action == 'link') {
                $('#AlbumContainer tbody').empty();
                $('#action_tabLibrary').trigger('click');
            }
            if (data["subsonic-response"].artist !== undefined) {
                var children = [];
                if (data["subsonic-response"].artist.album.length > 0) {
                    children = data["subsonic-response"].artist.album;
                } else {
                    children[0] = data["subsonic-response"].artist.album;
                }

                var header, starred, duration;
                $.each(children, function (i, child) {
                    if (typeof child.starred != 'undefined') { starred = true; } else { starred = false; }
                    if (typeof child.duration != 'undefined') { duration = child.duration; } else { duration = ''; }
                    var html = generateAlbumHTML(child.id, child.artistId, child.coverArt, child.name, child.artist, child.userRating, starred, child.created);
                    $(html).appendTo(appendto).hide().fadeIn('fast');
                });
                toggleAlbumListNextPrev('#status_Library', false, '', '');
                if (appendto == '#CurrentPlaylistContainer') {
                    updateMessage(children.length + ' Song(s) Added', true);
                }
                if (appendto == '#AlbumContainer tbody') {
                    header = generateAlbumHeaderHTML();
                    $('#tabLibrary .subactions a.button').addClass('disabled');
                }
                $("#AlbumContainer thead").html(header);
                if (action == 'autoplay') {
                    autoPlay();
                }
            }
        }
    });
}
function getAlbumListBy(id, offset) {
    var size, url;
    if (getCookie('AutoAlbumSize')) {
        size = getCookie('AutoAlbumSize');
    } else {
        size = 15;
    }
    if (offset > 0) {
        url = baseURL + '/getAlbumList.view?' + baseParams + '&size=' + size + '&type=' + id + '&offset=' + offset
    } else {
        url = baseURL + '/getAlbumList.view?' + baseParams + '&size=' + size + '&type=' + id
    }
    $.ajax({
        url: url,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            if (data["subsonic-response"].status != 'failed') {
                if (typeof data["subsonic-response"].albumList.album != "undefined") {
                    $("#AlbumContainer tbody").empty();
                    var header = generateAlbumHeaderHTML();
                    $("#AlbumContainer thead").html(header);
                    var albums = [];
                    if (data["subsonic-response"].albumList.album.length > 0) {
                        albums = data["subsonic-response"].albumList.album;
                    } else {
                        albums[0] = data["subsonic-response"].albumList.album;
                    }

                    var rowcolor;
                    var html;
                    $.each(albums, function (i, album) {
                        // Only show albums, not songs (Rated songs will also be returned in API call, trying to display them will break Back button, disabled for now)
                        var albumhtml, starred;
                        if (album.starred !== undefined) { starred = true; } else { starred = false; }
                        if (album.isDir === true) {
                            albumhtml = generateAlbumHTML(album.id, album.parent, album.coverArt, album.title, album.artist, album.userRating, starred, album.created);
                        }
                        $(albumhtml).appendTo("#AlbumContainer tbody").hide().fadeIn('fast');
                    });
                    $('#BreadCrumbs').empty();
                    $('#tabLibrary .subactions a.button').addClass('disabled');
                    toggleAlbumListNextPrev('#status_Library', true, id, offset);
                } else {
                    updateMessage('Albums failed to load, no music :(', true);
                    $('#AlbumContainer tbody').empty();
                }
            }
        }
    });
}
function toggleAlbumListNextPrev(el, on, type, offset) {
    if (el != '') {
        if (on) {
            $(el).addClass('on');
            $('#status_Library').data('type', type);
            if (offset === undefined) {
                $('#status_Library').data('offset', '0');
            } else {
                $('#status_Library').data('offset', offset);
            }
        } else {
            $(el).removeClass('on');
            $(el).stop().fadeOut();
            $('#status_Library').data('type', '');
            $('#status_Library').data('offset', '0');
        }
    }
}
function getRandomSongList(action, appendto, genre, folder) {
    if (debug) { console.log('action:' + action + ', appendto:' + appendto + ', genre:' + genre + ', folder:' + folder); }
    var size;
    if (getCookie('AutoPlaylistSize')) {
        size = getCookie('AutoPlaylistSize');
    } else {
        size = 25;
    }
    var genreParams = '';
    if (genre != '' && genre != 'Random') {
        genreParams = '&genre=' + genre;
    }
    folderParams = '';
    if (typeof folder == 'number' && folder == 0 && folder != 'all') {
        folderParams = '&musicFolderId=' + folder;
    } else if (folder != '' && folder != 'all') {
        folderParams = '&musicFolderId=' + folder;
    }
    if (genre == 'Starred') {
        getStarred(action, appendto, 'song');
    } else {
        $.ajax({
            url: baseURL + '/getRandomSongs.view?' + baseParams + '&size=' + size + genreParams + folderParams,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            success: function (data) {
                if (data["subsonic-response"].randomSongs.song !== undefined) {
                    if (appendto == '#TrackContainer tbody') {
                        $("#TrackContainer tbody").empty();
                        var header = generateSongHeaderHTML();
                        $("#TrackContainer thead").html(header);
                    }
                    if (action == 'autoplay') {
                        $("#TrackContainer tbody").empty();
                        $(appendto).empty();
                    }
                    var items = [];
                    if (data["subsonic-response"].randomSongs.song.length > 0) {
                        items = data["subsonic-response"].randomSongs.song;
                    } else {
                        items[0] = data["subsonic-response"].randomSongs.song;
                    }

                    var rowcolor;
                    var html;
                    $.each(items, function (i, item) {
                        var track, starred, duration;
                        if (item.starred !== undefined) { starred = true; } else { starred = false; }
                        if (item.track === undefined) { track = "&nbsp;"; } else { track = item.track; }
                        if (item.duration !== undefined) { duration = item.duration; } else { duration = ''; }
                        html = generateSongHTML(item.id, item.parent, '', track, item.title, '', item.artist, item.album, item.coverArt, item.userRating, starred, duration);
                        $(html).appendTo(appendto);
                    });
                    if (appendto === '#TrackContainer tbody') {
                        updateStatus('#status_Playlists', countCurrentPlaylist('#TrackContainer'));
                    }
                    if (appendto === '#CurrentPlaylistContainer tbody') {
                        updateMessage(items.length + ' Song(s) Added', true);
                        updateStatus('#status_Current', countCurrentPlaylist('#CurrentPlaylistContainer'));
                    }
                    if (action == 'autoplay' || action == 'autoplayappend') {
                        autoPlay();
                    }
                } else {
                    updateStatus('#status_Playlists', '');
                    $(appendto).empty();
                }
            }
        });
    }
}
function getStarred(action, appendto, type) {
    var size;
    if (getCookie('AutoPlaylistSize')) {
        size = getCookie('AutoPlaylistSize');
    } else {
        size = 25;
    }
    $.ajax({
        url: baseURL + '/getStarred.view?' + baseParams + '&size=' + size,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            if (data["subsonic-response"].starred !== undefined) {
                if (appendto === '#TrackContainer tbody') {
                    $("#TrackContainer tbody").empty();
                    var header = generateSongHeaderHTML();
                    $("#TrackContainer thead").html(header);
                }
                if (action === 'autoplay') {
                    $("#TrackContainer tbody").empty();
                    $(appendto).empty();
                }
                var items = [];
                switch (type) {
                    case 'artist':
                        if (data["subsonic-response"].starred.artist !== undefined) {
                            if (data["subsonic-response"].starred.artist.length > 0) {
                                items = data["subsonic-response"].starred.artist;
                            } else {
                                items[0] = data["subsonic-response"].starred.artist;
                            }
                        }
                        break;
                    case 'album':
                        if (data["subsonic-response"].starred.album !== undefined) {
                            if (data["subsonic-response"].starred.album.length > 0) {
                                items = data["subsonic-response"].starred.album;
                            } else {
                                items[0] = data["subsonic-response"].starred.album;
                            }
                        }
                        break;
                    case 'song':
                        if (data["subsonic-response"].starred.song !== undefined) {
                            if (data["subsonic-response"].starred.song.length > 0) {
                                items = data["subsonic-response"].starred.song;
                            } else {
                                items[0] = data["subsonic-response"].starred.song;
                            }
                        }
                        break;
                    default:
                        break;
                }

                var rowcolor;
                var html;
                $.each(items, function (i, item) {
                    var track, starred;
                    if (item.starred !== undefined) { starred = true; } else { starred = false; }
                    if (item.track === undefined) { track = "&nbsp;"; } else { track = item.track; }
                    var time = secondsToTime(item.duration);
                    switch (type) {
                        case 'artist':
                            break;
                        case 'album':
                            html = generateRowHTML(item, appendto);
                            break;
                        case 'song':
                            html = generateRowHTML(item, appendto);
                            break;
                        default:
                            break;
                    }
                    $(html).appendTo(appendto);
                });
                if (appendto == '#TrackContainer tbody') {
                    updateStatus('#status_Playlists', countCurrentPlaylist('#TrackContainer'));
                }
                if (appendto == '#CurrentPlaylistContainer tbody') {
                    updateMessage(items.length + ' Song(s) Added', true);
                }
                if (action == 'autoplay') {
                    autoPlay();
                }
            } else {
                $(appendto).empty();
            }
        }
    });
}
function previewStarredCoverArt() {
    $.ajax({
        url: baseURL + '/getStarred.view?' + baseParams + '&size=25',
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            var coverarts = [];
            if (data["subsonic-response"].starred !== undefined) {
                var items = [];
                if (data["subsonic-response"].starred.album !== undefined) {
                    if (data["subsonic-response"].starred.album.length > 0) {
                        items = data["subsonic-response"].starred.album;
                    } else {
                        items[0] = data["subsonic-response"].starred.album;
                    }
                }
                var html = "";
                $.each(items, function (i, item) {
                    if (typeof item.coverArt !== "undefined") {
                        var coverSrc = baseURL + '/getCoverArt.view?' + baseParams + '&id=' + item.coverArt;
                        var title = item.artist + ' - ' + item.album;
                        html += '<a class=\"fancyboxcoverart\" rel=\"gallery1\" href=\"' + coverSrc + '\" title=\"' + title + '\"><img src=\"' + coverSrc + '\"></a>';
                    }
                });
                $('#preview').html(html);
                $('#preview a').shuffle();
                //var pick = Math.floor(Math.random() * coverarts.length) + 1;
                //var href = baseURL + '/getCoverArt.view?' + baseParams + '&id=' + coverarts[pick];
                $('a.fancyboxcoverart').fancybox({
                    autoPlay: true,
                    playSpeed: 10000,
                    preload: 5,
                    hideOnContentClick: true,
                    type: 'image',
                    openEffect: 'none',
                    closeEffect: 'none',
                    openSpeed: 'normal',
                    closeSpeed: 'slow',
                    afterLoad: function () {
                        $('div.fancybox-inner').click(function () {
                            //alert("test");
                        });
                    }
                }).trigger('click');
                //setInterval($('#preview a').fancybox.next(), 2000);
            }
        }
    });
}
function previewCurrentCoverArt() {
        var href = $('#coverartimage').attr('href');
        var title = $('#songdetails_artist').html();
        $("a#preview").fancybox({
            hideOnContentClick: true,
            type: 'image',
            openEffect: 'none',
            closeEffect: 'none',
            href: href,
            title: title
        }).trigger('click');
}
var updaterNowPlaying;
var updaterNowPlayingIdList = [];
function updateNowPlaying(showPopup) {
    updaterNowPlaying = $.periodic({ period: 4000, decay: 1.5, max_period: 30000 }, function () {
        $.ajax({
            periodic: this,
            url: baseURL + '/getNowPlaying.view?' + baseParams,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            success: function (data) {
                if (data["subsonic-response"].nowPlaying.entry === undefined) {
                    this.periodic.increment();
                    $("#NowPlayingList").empty();
                    var chathtml = '<div class=\"msg\">';
                    chathtml += '<span class=\"user\">Nothing :(</span></br>';
                    chathtml += '</div>';
                    $(chathtml).appendTo("#NowPlayingList");
                } else {
                    this.periodic.increment();
                    if (debug) { console.log('NowPlaying Delay: ' + this.periodic.cur_period); }
                    $("#NowPlayingList").empty();
                    var msgs = [];
                    if (data["subsonic-response"].nowPlaying.entry.length > 0) {
                        msgs = data["subsonic-response"].nowPlaying.entry;
                    } else {
                        msgs[0] = data["subsonic-response"].nowPlaying.entry;
                    }
                    var sorted = msgs.sort(function (a, b) {
                        return a.minutesAgo - b.minutesAgo;
                    });
                    $.each(sorted, function (i, msg) {
                        if (!showPopup) {
                            var chathtml = '<div class=\"msg\">';
                            chathtml += '<span class=\"user\">' + msg.username + '</span></br>';
                            chathtml += '<span class=\"artist\">' + msg.artist + '</span> - <span class=\"title\">' + msg.title + '</span>';
                            chathtml += '</div>';
                            $(chathtml).appendTo("#NowPlayingList");
                        }
                        var coverartSrc;
                        if (msg.coverArt === undefined) {
                            coverartSrc = 'images/albumdefault_50.jpg';
                        } else {
                            coverartSrc = baseURL + '/getCoverArt.view?' + baseParams + '&size=50&id=' + msg.coverArt;
                        }
                        if (getCookie('Notification_NowPlaying')) {
                            var sid = msg.username + '-' + msg.id;
                            if (jQuery.inArray(sid, updaterNowPlayingIdList) === -1 && username != msg.username) {
                                showNotification(coverartSrc, toHTML.un(msg.username + ':' + msg.playerName), toHTML.un(msg.artist + ' - ' + msg.title), 'text', '');
                                updaterNowPlayingIdList.push(sid);
                            }
                        }
                    });
                }
            }
        });
    });
}
function stopUpdateNowPlaying() {
    updaterNowPlaying.cancel();
}

function search(type, query) {
    $.ajax({
        url: baseURL + '/search2.view?' + baseParams + '&query=' + query,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            $("#AlbumContainer tbody").empty();
            if (data["subsonic-response"].searchResult2 !== "") {
                var header;
                var children = [];
                if (type === 'song') {
                    if (data["subsonic-response"].searchResult2.song !== undefined) {
                        header = generateSongHeaderHTML();
                        if (data["subsonic-response"].searchResult2.song.length > 0) {
                            children = data["subsonic-response"].searchResult2.song;
                        } else {
                            children[0] = data["subsonic-response"].searchResult2.song;
                        }
                        $("#AlbumContainer thead").html(header);
                    }
                }
                if (type === 'album') {
                    if (data["subsonic-response"].searchResult2.album !== undefined) {
                        header = generateAlbumHeaderHTML();
                        if (data["subsonic-response"].searchResult2.album.length > 0) {
                            children = data["subsonic-response"].searchResult2.album;
                        } else {
                            children[0] = data["subsonic-response"].searchResult2.album;
                        }
                        $("#AlbumContainer thead").html(header);
                    }
                }
                $.each(children, function (i, child) {
                    var starred;
                    if (typeof child.starred != 'undefined') { starred = true; } else { starred = false; }
                    isDir = child.isDir;
                    if (isDir == true) {
                        albumhtml = generateAlbumHTML(child.id, child.parent, child.coverArt, child.title, child.artist, child.userRating, starred, child.created);
                    } else {
                        var track, starred, duration;
                        if (child.starred !== undefined) { starred = true; } else { starred = false; }
                        if (child.track === undefined) { track = "&nbsp;"; } else { track = child.track; }
                        if (child.duration !== undefined) { duration = child.duration; } else { duration = ''; }
                        albumhtml = generateSongHTML(child.id, child.parent, '', track, child.title, '', child.artist, child.album, child.coverArt, child.userRating, starred, duration);
                    }
                    $('#tabLibrary .subactions a.button').removeClass('disabled');
                    $(albumhtml).appendTo("#AlbumContainer tbody");
                    $('#action_tabLibrary').click();
                });
            }
        }
    });
}

function rescanLibrary() {
    $.ajax({
        url: baseURL + '/getUser.view?' + baseParams + '&username=' + getCookie('username'),
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            if (data["subsonic-response"].user.adminRole == true) {
                $.get(getCookie('Server') + '/musicFolderSettings.view?scanNow');
            } else {
                alert('You are not logged in as an admin user!');
            }
        }
    });

}
function loadFolders(refresh) {
    if (debug) { console.log("LOAD FOLDERS"); }
    if (refresh) {
        $('#FolderContainer').empty();
    }
    var content = $('#FolderContainer').html();
    if (content === "") {
        // Load Folders
        $.ajax({
            url: baseURL + '/getMusicFolders.view?' + baseParams,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            success: function (data) {
                var musicFolders = [];
                if (data["subsonic-response"].musicFolders.musicFolder.length > 0) {
                    musicFolders = data["subsonic-response"].musicFolders.musicFolder;
                } else {
                    musicFolders[0] = data["subsonic-response"].musicFolders.musicFolder;
                }
                $.each(musicFolders, function (i, musicFolder) {
                    var html = "";
                    html += '<li id=\"' + musicFolder.id + '\" class=\"item\" data-folder=\"' + musicFolder.id + '\">';
                    html += '<span>' + musicFolder.name + '</span>';
                    html += '<div class=\"floatright\"><a class=\"play\" href=\"\" data-folder=\"' + musicFolder.id + '\" title=\"Play\"></a></div>';
                    html += '<div class=\"floatright\"><a class=\"add\" href=\"\" data-folder=\"' + musicFolder.id + '\" title=\"Add To Play Queue\"></a></div>';
                    html += '</li>';
                    $(html).appendTo("#FolderContainer");
                });
            }
        });
    }
}
function loadPlaylists(refresh) {
    if (debug) { console.log("LOAD PLAYLISTS"); }
    if (refresh) {
        $('#PlaylistContainer').empty();
    }
    var content = $('#PlaylistContainer').html();
    if (content === "") {
        // Load Playlists
        $.ajax({
            url: baseURL + '/getPlaylists.view?' + baseParams,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            success: function (data) {
                var playlists = [];
                if (data["subsonic-response"].playlists.playlist !== undefined) {
                    if (data["subsonic-response"].playlists.playlist.length > 0) {
                        playlists = data["subsonic-response"].playlists.playlist;
                    } else {
                        playlists[0] = data["subsonic-response"].playlists.playlist;
                    }
                    $.each(playlists, function (i, playlist) {
                        var html = "";
                        html += '<li id=\"' + playlist.id + '\" class=\"item\">';
                        html += '<div class=\"floatright\"><a class=\"play\" href=\"\" title=\"Play\"></a></div>';
                        html += '<div class=\"floatright\"><a class=\"download\" href=\"\" title=\"Download\"></a></div>';
                        html += '<div class=\"floatright\"><a class=\"add\" href=\"\" title=\"Add To Play Queue\"></a></div>';
                        html += '<div class="name"><span>' + playlist.name + '</span></div>';
                        html += '</li>';
                        $(html).appendTo("#PlaylistContainer");
                    });
                    if (smwidth) {
                        resizeSMSection(0);
                    }
                }
            }
        });
    }
}
function savePlaylist(playlistid) {
    var songs = [];
    $('#TrackContainer tr.song').each(function (index) {
        songs.push($(this).attr('childid'));
    });
    if (songs.length > 0) {
        $.ajax({
            type: 'GET',
            url: baseURL + '/createPlaylist.view?' + baseParams,
            dataType: protocol,
            timeout: 10000,
            data: { playlistId: playlistid, songId: songs },
            success: function () {
                getPlaylist(playlistid);
                updateMessage('Playlist Updated!', true);
            },
            traditional: true // Fixes POST with an array in JQuery 1.4
        });
    }
}
function getPlaylist(id, action, appendto) {
    $.ajax({
        url: baseURL + '/getPlaylist.view?' + baseParams + '&id=' + id,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
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
                var children = [];
                var playlist = data["subsonic-response"].playlist;
                if (playlist.entry.length > 0) {
                    children = playlist.entry;
                } else {
                    children[0] = playlist.entry;
                }

                var rowcolor;
                var html;
                var count = children.length;
                $.each(children, function (i, child) {
                    var track, starred, duration;
                    if (child.starred !== undefined) { starred = true; } else { starred = false; }
                    if (child.track === undefined) { track = "&nbsp;"; } else { track = child.track; }
                    if (child.duration !== undefined) { duration = child.duration; } else { duration = ''; }
                    html = generateSongHTML(child.id, child.parent, child.artistId, track, child.title, '', child.artist, child.album, child.coverArt, child.userRating, starred, duration);
                    $(html).appendTo(appendto);
                });
                if (appendto === '#TrackContainer tbody') {
                    updateStatus('#status_Playlists', countCurrentPlaylist('#TrackContainer'));
                }
                if (appendto === '#CurrentPlaylistContainer tbody') {
                    updateMessage(children.length + ' Song(s) Added', true);
                }
                if (action === 'autoplay') {
                    autoPlay();
                }
            } else {
                if (appendto === '#TrackContainer tbody') {
                    $(appendto).empty();
                    updateStatus('#status_Playlists', '');
                }
            }
        }
    });
}
function loadPlaylistsForMenu(menu) {
    $('#' + menu).empty();
    $.ajax({
        url: baseURL + '/getPlaylists.view?' + baseParams,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            var playlists = [];
            if (data["subsonic-response"].playlists.playlist !== undefined) {
                if (data["subsonic-response"].playlists.playlist.length > 0) {
                    playlists = data["subsonic-response"].playlists.playlist;
                } else {
                    playlists[0] = data["subsonic-response"].playlists.playlist;
                }
            }
            $("<a href=\"#\" childid=\"new\">+ New</a><br />").appendTo("#" + menu);
            $.each(playlists, function (i, playlist) {
                $('<a href=\"#\" childid=\"' + playlist.id + '\">' + playlist.name + '</a><br />').appendTo("#" + menu);
            });
        }
    });
}
function newPlaylist() {
    var reply = prompt("Choose a name for your new playlist.", "");
    if (reply != 'null' && reply != null && reply != '') {
        $.ajax({
            url: baseURL + '/createPlaylist.view?' + baseParams + '&name=' + reply,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            success: function (data) {
                loadPlaylists(true);
            }
        });
    }
}
function deletePlaylist(id) {
    $.ajax({
        url: baseURL + '/deletePlaylist.view?' + baseParams + '&id=' + id,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
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
                url: baseURL + '/getPlaylist.view?' + baseParams + '&id=' + playlistid,
                method: 'GET',
                dataType: protocol,
                timeout: 10000,
                success: function (data) {
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
                        var runningVersion = parseVersionString(apiVersion);
                        var minimumVersion = parseVersionString('1.8.0');
                        if (checkVersion(runningVersion, minimumVersion)) { // is 1.8.0 or newer
                            $.ajax({
                                type: 'GET',
                                url: baseURL + '/updatePlaylist.view?' + baseParams,
                                dataType: protocol,
                                timeout: 10000,
                                data: { playlistId: playlistid, songIdToAdd: selected },
                                success: function (data) {
                                    // Add logic to show an error if the playlist update fails
                                    // if (data["subsonic-response"].playlist.entry !== undefined) { 
                                    $('table.songlist tr.song').each(function () {
                                        $(this).removeClass('selected');
                                    });
                                    updateMessage(count + ' Song(s) Added to Playlist', true);
                                },
                                traditional: true // Fixes POST with an array in JQuery 1.4
                            });
                        } else {
                            $.ajax({ // Depreciated: 11/5/2012
                                type: 'GET',
                                url: baseURL + '/createPlaylist.view?' + baseParams,
                                dataType: protocol,
                                timeout: 10000,
                                data: { playlistId: playlistid, songId: currentsongs },
                                success: function () {
                                    $('table.songlist tr.song').each(function () {
                                        $(this).removeClass('selected');
                                    });
                                    updateMessage(count + ' Song(s) Added to Playlist', true);
                                },
                                traditional: true // Fixes POST with an array in JQuery 1.4
                            });
                        }
                    }
                }
            });
        } else {
            var reply = prompt("Choose a name for your new playlist.", "");
            if (reply) {
                $.ajax({
                    type: 'GET',
                    url: baseURL + '/createPlaylist.view?' + baseParams,
                    dataType: protocol,
                    timeout: 10000,
                    data: { name: "" + reply + "", songId: selected },
                    success: function () {
                        $('table.songlist tr.song').each(function () {
                            $(this).removeClass('selected');
                        });
                        updateMessage('Playlist Created!', true);
                    },
                    traditional: true // Fixes POST with an array in JQuery 1.4
                });
            }
        }
        setTimeout(function () { $('div.submenu').fadeOut(); }, 100);
    }
}
function addToCurrent(addAll) {
    var count;
    if (addAll) {
        count = $('#AlbumContainer tr.song').length;
    } else {
        count = $('#AlbumContainer tr.selected').length;
    }
    if (count > 0) {
        if (addAll) {
            $('#AlbumContainer tr.song').each(function (index) {
                $(this).clone().appendTo('#CurrentPlaylistContainer tbody');
            });
        } else {
            $('#AlbumContainer tr.selected').each(function (index) {
                $(this).clone().appendTo('#CurrentPlaylistContainer tbody');
            });
        }
        $('#CurrentPlaylistContainer tbody tr.song').removeClass('selected');
        updateMessage(count + ' Song(s) Added', true);
    }
}
function countCurrentPlaylist(container) {
    var total = $(container + ' tbody tr.song').size();
    if (total > 0) {
        var time = 0;
        $(container + ' tr.song').each(function (index) {
            var duration = $(this).attr('duration');
            if (duration != '') {
                time += parseInt(duration);
            }
        });
        return total + ' song(s), ' + secondsToTime(time) + ' total time';
    } else {
        return '';
    }
}
function saveCurrentPlaylist() {
    if (browserStorageCheck) {
        var html = localStorage.getItem('CurrentPlaylist');
        var current = $('#CurrentPlaylistContainer tbody').html();
        if (current != '' && current != html) {
            try {
                localStorage.setItem('CurrentPlaylist', current);
                if (debug) { console.log('Saving Play Queue: ' + current.length + ' characters'); }
            } catch (e) {
                if (e == QUOTA_EXCEEDED_ERR) {
                    alert('Quota exceeded!');
                }
            }
        }
    } else {
        if (debug) { console.log('HTML5::loadStorage not supported on your browser' + html.length + ' characters'); }
    }
}
function deleteCurrentPlaylist() {
    if (browserStorageCheck) {
        localStorage.removeItem('CurrentPlaylist');
        setCookie('CurrentSong', null);
        if (debug) { console.log('Removing Play Queue'); }
    } else {
        if (debug) { console.log('HTML5::loadStorage not supported on your browser' + html.length + ' characters'); }
    }
}
function loadCurrentPlaylist() {
    if (browserStorageCheck) {
        var html = localStorage.getItem('CurrentPlaylist');
        if (html != '' && html !== undefined && html !== null) {
            $('#CurrentPlaylistContainer tbody').html(html);
            var songid = $('#CurrentPlaylistContainer tbody tr.playing').attr('childid');
            if (typeof songid != 'undefined') {
                $('#CurrentPlaylist').scrollTo($('#' + songid), 400);
            }
            if (debug) { console.log('Load Play Queue From localStorage: ' + html.length + ' characters'); }
        }
    } else {
        if (debug) { console.log('HTML5::loadStorage not supported on your browser' + html.length + ' characters'); }
    }
}
function saveAutoFilter() {
    if (browserStorageCheck) {
        var item = localStorage.getItem('AutoFilter');
        try {
            localStorage.setItem('AutoFilter', item);
            if (debug) { console.log('Saving Auto Filter: ' + item); }
        } catch (e) {
            if (e == QUOTA_EXCEEDED_ERR) {
                alert('Quota exceeded!');
            }
        }
    } else {
        if (debug) { console.log('HTML5::loadStorage not supported on your browser' + html.length + ' characters'); }
    }
}
function deleteAutoFilter() {
    if (browserStorageCheck) {
        localStorage.removeItem('AutoFilter');
        if (debug) { console.log('Removing Auto Filter'); }
    } else {
        if (debug) { console.log('HTML5::loadStorage not supported on your browser' + html.length + ' characters'); }
    }
}
function loadAutoFilter() {
    if (browserStorageCheck) {
        var item = localStorage.getItem('AutoFilter');
        if (item != '' && item !== undefined && item !== null) {
            var el = '#AutoFilter';
            $(el).val(item);
            if (debug) { console.log('Load Play Queue From localStorage: ' + item); }
        }
    } else {
        if (debug) { console.log('HTML5::loadStorage not supported on your browser' + html.length + ' characters'); }
    }
}
function saveTrackPosition() {
    var el = $('#songdetails_song');
    var songid = el.attr('childid');
    if (songid !== undefined) {
        var albumid = el.attr('parentid');
        var position = $("#playdeck").data("jPlayer").status.currentTime;
        if (position != null && position >= 5) {
            var currentSong = {
                songid: songid,
                albumid: albumid,
                position: position
            };
            $('#action_SaveProgress').show();
            setCookie('CurrentSong', JSON.stringify(currentSong));
            saveCurrentPlaylist();
        }
    }
    if (debug) { console.log('Saving Track Position: songid:' + songid + ', albumid:' + albumid + ', position:' + position); }
}
function downloadItem(id, type) {
    var url;
    if (type == 'item' && id) {
        reqDownload = 'id=' + id;
    }
    if (type == 'playlist' && id) {
        reqDownload = 'playlistUtf8Hex=' + id;
    }
    if (reqDownload) {
        url = baseURL + '/download.view?' + baseParams + '&' + reqDownload;
        window.location = url;
    }
}


function loadPodcasts(refresh) {
    if (debug) { console.log("LOAD PODCASTS"); }
    if (refresh) {
        $('#ChannelsContainer').empty();
    }
    var content = $('#ChannelsContainer').html();
    if (content === "") {
        // Load Podcasts
        $.ajax({
            url: baseURL + '/getPodcasts.view?' + baseParams,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            success: function (data) {
                var podcasts = [];
                if (data["subsonic-response"].podcasts.channel !== undefined) {
                    if (data["subsonic-response"].podcasts.channel.length > 0) {
                        podcasts = data["subsonic-response"].podcasts.channel;
                    } else {
                        podcasts[0] = data["subsonic-response"].podcasts.channel;
                    }
                    $.each(podcasts, function (i, podcast) {
                        var albumId = (podcast.episode === undefined || podcast.episode.length <= 0) ? "0" : podcast.episode[0].parent;

                        var html = "";
                        html += '<li id=\"' + podcast.id + '\" albumid=\"' + albumId + '\" class=\"item\">';
                        html += '<div class=\"floatright\"><a class=\"play\" href=\"\" title=\"Play\"></a></div>';
                        html += '<div class=\"floatright\"><a class=\"download\" href=\"\" title=\"Download\"></a></div>';
                        html += '<div class=\"floatright\"><a class=\"add\" href=\"\" title=\"Add To Play Queue\"></a></div>';
                        html += '<div class=\"name\"><span>' + podcast.title + '</span></div>';
                        html += '</li>';
                        $(html).appendTo("#ChannelsContainer");
                    });
                    if (smwidth) {
                        resizeSMSection(0);
                    }
                }
            }
        });
    }
}
function getPodcast(id, action, appendto) {
    $.ajax({
        url: baseURL + '/getPodcasts.view?' + baseParams,
        method: 'GET',
        dataType: protocol,
        timeout: 10000,
        success: function (data) {
            var podcasts = [];
            if (data["subsonic-response"].podcasts.channel.length > 0) {
                podcasts = data["subsonic-response"].podcasts.channel;
            } else {
                podcasts[0] = data["subsonic-response"].podcasts.channel;
            }
            var channel = [];
            $.each(podcasts, function (i, podcast) {
                if (podcast.id == id) {
                    channel = podcast;
                }
            });

            if (channel.episode !== undefined) {
                if (appendto === '#PodcastContainer tbody') {
                    $(appendto).empty();
                    var header = generateSongHeaderHTML;
                    $("#PodcastContainer thead").html(header);
                }
                if (action === 'autoplay') {
                    $(appendto).empty();
                }

                var children = channel.episode;

                var rowcolor;
                var html;
                var count = 0;
                $.each(children, function (i, child) {
                    if (child.status == "skipped") return; // Skip podcasts that are not yet downloaded
                    var date = parseDate(child.publishDate);
                    var description = 'Published: ' + date + '\n\n';
                    description += child.description;

                    var starred, duration, publishdate;
                    if (child.starred !== undefined) { starred = true; } else { starred = false; }
                    if (child.duration !== undefined) { duration = child.duration; } else { duration = ''; }
                    if (child.publishDate !== undefined) { publishdate = child.publishDate.substring(0, child.publishDate.indexOf(" ")); } else { publishdate = ''; }
                    html = generateSongHTML(child.streamId, child.parent, '', publishdate, child.title, description, child.artist, child.album, child.coverArt, child.userRating, starred, duration);
                    $(html).appendTo(appendto);
                    count++;
                });
                if (appendto === '#PodcastContainer tbody') {
                    updateStatus('#status_Podcasts', countCurrentPlaylist('#PodcastContainer'));
                }
                if (appendto === '#CurrentPlaylistContainer tbody') {
                    updateMessage(count + ' Song(s) Added', true);
                }
                if (action === 'autoplay') {
                    autoPlay();
                }
            } else {
                if (appendto === '#PodcastContainer tbody') {
                    $(appendto).empty();
                }
            }
        }
    });
}
function loadVideos(refresh) {
    if (debug) { console.log("LOAD VIDEOS"); }
    if (refresh) {
        $('#VideosContainer').empty();
    }
    var content = $('#VideosContainer').html();
    if (content == "") {
        // Load Videos
        $.ajax({
            url: baseURL + '/getVideos.view?' + baseParams,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            success: function (data) {
                if (data["subsonic-response"].videos != '') {
                    var videos = [];
                    if (data["subsonic-response"].videos.video.length > 0) {
                        videos = data["subsonic-response"].videos.video;
                    } else {
                        videos[0] = data["subsonic-response"].videos.video;
                    }
                    var rowcolor;
                    $.each(videos, function (i, video) {
                        var html;
                        if (i % 2 === 0) {
                            rowcolor = 'even';
                        } else {
                            rowcolor = 'odd';
                        }
                        var videoURL = baseURL + '/stream.view?' + baseParams + '&id=' + video.id;
                        html = '<tr class=\"row video\" childid=\"' + video.id + '\" parentid=\"' + video.parent + '\" bitrate=\"' + video.bitRate + '\" userrating=\"\">';
                        html += '<td class=\"itemactions\">';
                        //html += '<a class=\"add\" href=\"\" title=\"Add To Play Queue\"></a>';
                        //html += '<a class=\"remove\" href=\"\" title=\"Remove\"></a>';
                        html += '<a class=\"play\" href=\"' + videoURL + '\" title=\"Play (Opens In New Window)\" target=\"_blank\"></a>';
                        //html += '<a class=\"download\" href=\"\" title=\"Download\"></a>';
                        html += '</td>';
                        html += '<td class=\"track\"></td>';
                        html += '<td class=\"title\">' + video.title + '</td>';
                        html += '<td class=\"artist\"></td>';
                        var coverartSrc;
                        if (video.coverArt === undefined) {
                            coverartSrc = 'images/albumdefault_25.jpg';
                        } else {
                            coverartSrc = baseURL + '/getCoverArt.view?' + baseParams + '&size=25&id=' + video.coverArt;
                        }
                        var time = secondsToTime(video.duration);
                        html += '<td class=\"album\"><img src=\"' + coverartSrc + '\" />' + video.album + '</td>';
                        html += '<td class=\"time\">' + time + '</td>';
                        html += '</tr>';
                        $(html).appendTo("#VideosContainer");
                    });
                }
            }
        });
    }
}