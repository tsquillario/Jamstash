function generateRowHTML(child, appendto) {
    var html, isDir, starred, duration, artist, i;
    isDir = child.isDir;
    if (child.starred !== undefined) { starred = true; } else { starred = false; }
    if (child.duration !== undefined) { duration = child.duration; } else { duration = ''; }
    if (child.artist !== undefined) { artist = child.artist; } else { artist = ''; }
    if (isDir === true) {
        html = generateAlbumHTML(child.id, child.parent, child.coverArt, child.title, artist, child.userRating, starred, child.created);
    } else {
        var track;
        if (child.track === undefined) { track = "&nbsp;"; } else { track = child.track; }
        html = generateSongHTML(child.id, child.parent, track, child.title, '', artist, child.album, child.coverArt, child.userRating, starred, duration);
    }
    return html;
}
function generateAlbumHeaderHTML() {
    var html;
    html = '<tr><th></th><th></th><th class=\"type-string\">Album</th><th class=\"type-string\">Artist</th><th class=\"type-string\">Created</th></tr>';
    return html;
}
function generateAlbumHTML(childid, parentid, coverart, title, artist, rating, starred, created) {
    var html;
    html = '<tr class=\"album\" childid=\"' + childid + '\" parentid=\"' + parentid + '\" userrating=\"' + rating + '\">';
    html += '<td class=\"itemactions\"><a class=\"add\" href=\"\" title=\"Add To Play Queue\"></a>';
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
        html += '<td class=\"albumart\"><img src=\"' + baseURL + '/getCoverArt.view?u=' + username + '&p=' + password + '&v=' + apiVersion + '&c=' + applicationName + '&f=json&size=50&id=' + coverart + '\" /></td>';
    }
    html += '<td class=\"album\">' + title + '</td>';
    html += '<td class=\"artist\">' + artist + '</td>';
    html += '<td class=\"date\">' + $.format.date(new Date(created), "yyyy-MM-dd h:mm a") + '</td>';
    html += '</tr>';
    return html;
}
function generateSongHeaderHTML() {
    var html;
    html = '<tr><th></th><th class=\"type-int\">Track</th><th class=\"type-string\">Title</th><th class=\"type-string\">Artist</th><th class=\"type-string\">Album</th><th class=\"alignright\">Time</th></tr>';
    return html;
}
function generateSongHTML(childid, parentid, track, title, description, artist, album, coverart, rating, starred, duration) {
    var time;
    if (duration == '') {
        time = '00:00'
    } else {
        time = secondsToTime(duration);    
    }
    var html;
    html = '<tr class=\"row song\" id=\"' + childid + '\" childid=\"' + childid + '\" parentid=\"' + parentid + '\" duration=\"' + duration + '\" userrating=\"' + rating + '\">';
    html += '<td class=\"itemactions\"><a class=\"add\" href=\"\" title=\"Add To Play Queue\"></a>';
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
        coverartSrc = baseURL + '/getCoverArt.view?u=' + username + '&p=' + password + '&v=' + apiVersion + '&c=' + applicationName + '&f=json&size=25&id=' + coverart;
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
