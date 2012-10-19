function generateRowHTML(child, appendto, rowcolor) {
    var albumhtml, isDir, starred, duration, i;
    isDir = child.isDir;
    if (child.starred !== undefined) { starred = true; } else { starred = false; }
    if (child.duration !== undefined) { duration = child.duration; } else { duration = ''; }
    if (isDir === true) {
        albumhtml = generateAlbumHTML(rowcolor, child.id, child.parent, child.coverArt, child.title, child.artist, child.userRating, starred);
    } else {
        var track;
        if (child.track === undefined) { track = "&nbsp;"; } else { track = child.track; }
        albumhtml = generateSongHTML(rowcolor, child.id, child.parent, track, child.title, '', child.artist, child.album, child.coverArt, child.userRating, starred, duration);
    }
    return albumhtml;
}
function generateAlbumHeaderHTML() {
    var html;
    html = '<tr><th></th><th></th><th class=\"type-string\">Album</th><th class=\"type-string\">Artist</th></tr>';
    return html;
}
function generateAlbumHTML(rowcolor, childid, parentid, coverart, title, artist, rating, starred) {
    var html;
    html = '<tr class=\"album ' + rowcolor + '\" childid=\"' + childid + '\" parentid=\"' + parentid + '\" userrating=\"' + rating + '\">';
    html += '<td class=\"itemactions\"><a class=\"add\" href=\"\" title=\"Add To Current Playlist\"></a>';
    html += '<a class=\"play\" href=\"\" title=\"Play\"></a>';
    html += '<a class=\"download\" href=\"\" title=\"Download\"></a>';
    if (starred) {
        html += '<a class=\"favorite\" href=\"\" title=\"Favorite\"></a>';
    } else {
        html += '<a class=\"rate\" href=\"\" title=\"Add To Favorites\"></a>';
    }
    html += '</td>';
    if (coverart == undefined) {
        html += '<td class=\"albumart\"><img src=\"images/albumdefault_50.jpg\" /></td>';
    } else {
        html += '<td class=\"albumart\"><img src=\"' + baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=json&size=50&id=' + coverart + '\" /></td>';
    }
    html += '<td class=\"album\">' + title + '</td>';
    html += '<td class=\"artist\">' + artist + '</td>';
    html += '</tr>';
    return html;
}
function generateSongHeaderHTML() {
    var html;
    html = '<tr><th></th><th class=\"type-int\">Track</th><th class=\"type-string\">Title</th><th class=\"type-string\">Artist</th><th class=\"type-string\">Album</th><th class=\"alignright\">Time</th></tr>';
    return html;
}
function generateSongHTML(rowcolor, childid, parentid, track, title, description, artist, album, coverart, rating, starred, duration) {
    var time;
    if (duration == '') {
        time = '00:00'
    } else {
        time = secondsToTime(duration);    
    }
    var html;
    html = '<tr class=\"song ' + rowcolor + '\" id=\"' + childid + '\" childid=\"' + childid + '\" parentid=\"' + parentid + '\" duration=\"' + duration + '\" userrating=\"' + rating + '\">';
    html += '<td class=\"itemactions\"><a class=\"add\" href=\"\" title=\"Add To Current Playlist\"></a>';
    html += '<a class=\"remove\" href=\"\" title=\"Remove\"></a>';
    html += '<a class=\"play\" href=\"\" title=\"Play\"></a>';
    html += '<a class=\"download\" href=\"\" title=\"Download\"></a>';
    if (starred) {
        html += '<a class=\"favorite\" href=\"\" title=\"Favorite\"></a>';
    } else {
        html += '<a class=\"rate\" href=\"\" title=\"Add To Favorites\"></a>';
    }
    html += '</td>';
    html += '<td class=\"track\">' + track + '</td>';
    if (description != '' && description != null) {
        html += '<td class=\"title\" title=\"' + toHTML.on(description) + '\">' + title + '</td>';
    } else {
        html += '<td class=\"title\">' + title + '</td>';
    }
    html += '<td class=\"artist\">' + artist + '</td>';
    var coverartSrc;
    if (coverart == undefined) {
        coverartSrc = 'images/albumdefault_25.jpg';
    } else {
        coverartSrc = baseURL + '/getCoverArt.view?v=' + version + '&c=' + applicationName + '&f=json&size=25&id=' + coverart;
    }
    html += '<td class=\"album\" data-order-by=\"' + album + '\"><a href="#" class=\"albumlink\"><img src=\"' + coverartSrc + '\" />' + album + '</a></td>';
    html += '<td class=\"time\">' + time + '</td>';
    html += '</tr>';
    return html;
}
// Depreciated: 10/17/2012
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
