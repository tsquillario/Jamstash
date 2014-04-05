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
        var genres = getValue('AutoPlaylists');
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
                        if (getValue('Notification_NowPlaying')) {
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