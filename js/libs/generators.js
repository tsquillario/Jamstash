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
    if (coverart == undefined) {
        html += '<td class=\"albumart\"><img src=\"images/albumdefault_50.jpg\" /></td>';
    } else {
        html += '<td class=\"albumart\"><img src=\"' + baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=jsonp&size=50&id=' + coverart + '\" /></td>';
    }
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
    html += '<a class=\"download\" href=\"\" title=\"Download\"></a>';
    if (rating === 5) {
        html += '<a class=\"favorite\" href=\"\" title=\"Favorite\"></a>';
    } else {
        html += '<a class=\"rate\" href=\"\" title=\"Add To Favorites\"></a>';
    }
    html += '</td>';
    html += '<td class=\"track\">' + track + '</td>';
    html += '<td class=\"title\">' + title + '</td>';
    html += '<td class=\"artist\">' + artist + '</td>';
    var coverartSrc;
    if (coverart == undefined) {
        coverartSrc = 'images/albumdefault_25.jpg';
    } else {
        coverartSrc = baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=jsonp&size=25&id=' + coverart;
    }
    html += '<td class=\"album\"><a href="javascript:getAlbums(\'' + parentid + '\',\'\',\'#AlbumRows\')">' + album + '<img src=\"' + coverartSrc + '\" /></a></td>';
    html += '<td class=\"time\">' + m + ':' + s + '</td>';
    html += '</tr>';
    return html;
}

function refreshRowColor(el) {
    $.each($(el + ' tr.song'), function (i) {
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
