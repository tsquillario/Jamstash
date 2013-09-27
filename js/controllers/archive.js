JamStash.controller('ArchiveCtrl',
function ArchiveCtrl($scope, $rootScope, $location, $http, utils, globals, model, notifications, player, json) {
    $("#LayoutContainer").layout($scope.layoutThreeCol);

    $rootScope.song = [];
    $scope.Protocol = 'jsonp';
    $scope.artist = [];
    $scope.album = [];
    $scope.selectedArtist;
    $scope.selectedAlbum;
    $scope.selectedSongs = [];
    $scope.AllCollections = [];
    json.getCollections(function (data) {
        $scope.AllCollections = data;
    });
    $scope.selectedCollection;
    $scope.$watch("selectedCollection", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            if (globals.SavedCollections.length > 0) {
                globals.SavedCollections.push(newValue);
            }
            $scope.artist.push(new model.Artist('', newValue));
            utils.setValue('SavedCollections', globals.SavedCollections.join(), false);
        }
    });
    $scope.archiveUrl = 'https://archive.org/';

    /* Filter */
    $scope.selectedArchiveAlbumSort = "date desc";
    $scope.ArchiveAlbumSort = [
        'addeddate desc',
        'addeddate asc',
        'avg_rating desc',
        'avg_rating asc',
        'createdate desc',
        'createdate asc',
        'date desc',
        'date asc',
        'downloads desc',
        'downloads asc',
        'num_reviews desc',
        'num_reviews asc',
        'publicdate desc',
        'publicdate asc',
        'stars desc',
        'stars asc'
        ],
    $scope.$watch("selectedArchiveAlbumSort", function (newValue, oldValue) {
        if (utils.getValue('AlbumSort') != newValue) {
            if (typeof newValue != 'undefined') {
                utils.setValue('AlbumSort', newValue, true);
            } else {
                utils.setValue('AlbumSort', null, true);
            }
            //alert(newValue);
            $scope.getAlbums('');
        }
    });
    $scope.getYears = function (startYear) {
        var currentYear = new Date().getFullYear(), years = [];
        startYear = startYear || 1950;
        while (startYear <= currentYear) {
            years.push(startYear++);
        }
        return years;
    }
    $scope.Years = $scope.getYears(),
    $scope.filter = {
        Year: "",
        Source: "",
        Description: ""
    };
    $scope.filterSave = function () {
        if ($scope.selectedArtist) {
            $scope.getAlbums('');
        }
    }
    /* End Filter */

    $scope.getArtists = function (data) {
        var map = function (data) {
            return new model.Artist('', data);
        };
        angular.forEach(globals.SavedCollections, function (item, key) {
            $scope.artist.push(map(item));
        });
    };
    $scope.getAlbums = function (name) {
        if (name != '') {
            $scope.selectedArtist = name;
        }
        var map = function (data) {
            var song = data;
            var coverart, starred;
            var url = $scope.archiveUrl + 'details/' + song.identifier;
            coverart = 'images/albumdefault_50.jpg';
            if (parseInt(song.avg_rating) == 5) { starred = true; } else { starred = false; }
            //var description = '<b>Details</b><br />';
            var description = '<b>Source</b>: ' + song.source + '<br />';
            description += '<b>Date</b>: ' + song.date + '<br />';
            description += typeof song.publisher != 'undefined' ? '<b>Transferer</b>: ' + song.publisher + '<br />' : '';
            description += typeof song.avg_rating != 'undefined' ? '<b>Rating</b>: ' + song.avg_rating + '<br />' : '';
            description += '<b>Downloads</b>: ' + song.downloads + '<br />';
            //description += typeof song.description == 'undefined' ? '' : song.description.replace("\n", "<br />");
            return new model.Album(song.identifier, null, song.title, null, coverart, $.format.date(new Date(song.publicdate), "yyyy-MM-dd h:mm a"), starred, description, url);
        }
        var url = $scope.archiveUrl + 'advancedsearch.php?q=collection:(' + $scope.selectedArtist + ') AND format:(MP3)';
        if ($scope.filter.Source) {
            url += ' AND source:(' + $scope.filter.Source + ')';
        }
        if ($scope.filter.Year) {
            if (parseInt($scope.filter.Year)) {
                url += ' AND year:(' + $scope.filter.Year + ')';
            }
        }
        if ($scope.filter.Description) {
            url += ' AND description:(' + $scope.filter.Description + ')';
        }
        if ($scope.selectedArchiveAlbumSort) {
            url += '&sort[]=' + $scope.selectedArchiveAlbumSort;
        }
        url += '&fl[]=avg_rating,collection,date,description,downloads,headerImage,identifier,publisher,publicdate,source,subject,title,year';
        url += '&rows=50&page=1&output=json';
        $.ajax({
            url: url,
            method: 'GET',
            dataType: $scope.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                var items = [];
                if (data["response"].docs.length > 0) {
                    items = data["response"].docs;
                    //alert(JSON.stringify(data["response"]));
                    $scope.album = [];
                    angular.forEach(items, function (item, key) {
                        $scope.album.push(map(item));
                    });
                    $scope.$apply();
                } else {
                    notifications.updateMessage("0 records returned", true);
                }
            },
            error: function () {
                alert('Archive.org service down :(');
            }
        });
    };
    $scope.mapSong = function (key, song, server, dir, coverart) {
        var url, time, track, title, rating, starred, contenttype, suffix;
        var specs = ''
        if (song.format == 'VBR MP3') {
            url = 'http://' + server + dir + key;
            specs = song.bitrate + 'kbps, ' + song.format.toLowerCase();
            if (typeof song.track == 'undefined') { track = '&nbsp;'; } else { track = song.track; }
            if (typeof song.title == 'undefined') { title = '&nbsp;'; } else { title = song.title; }
            if (typeof song.length == 'undefined') { time = '&nbsp;'; } else { time = utils.timeToSeconds(song.length); }
            return new model.Song(song.md5, song.album, song.track, title, song.creator, '', song.album, '', coverart, coverart, time, '', '', 'mp3', specs, url, 0, '');
        }
    };
    $scope.getSongs = function (id, action) {
        $scope.selectedAlbum = id;
        var url = $scope.archiveUrl + 'details/' + id + '?output=json';
        $.ajax({
            url: url,
            method: 'GET',
            dataType: $scope.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                var coverart = '';
                var server = data.server;
                var dir = data.dir;
                if (typeof data.misc.image != 'undefined') {
                    coverart = data.misc.image;
                }
                var items = data.files;
                if (action == 'add') {
                    angular.forEach(items, function (item, key) {
                        var song = $scope.mapSong(key, item, server, dir, coverart);
                        if (song) {
                            $rootScope.queue.push(song);
                        }
                    });
                    $scope.$apply();
                    $('body').layout().open('south');
                    notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                } else if (action == 'play') {
                    $rootScope.queue = [];
                    angular.forEach(items, function (item, key) {
                        var song = $scope.mapSong(key, item, server, dir, coverart);
                        if (song) {
                            $rootScope.queue.push(song);
                        }
                    });
                    var next = $rootScope.queue[0];
                    $scope.$apply(function () {
                        $rootScope.playSong(false, next);
                    });
                    $('body').layout().open('south');
                    notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                } else {
                    $rootScope.song = [];
                    angular.forEach(items, function (item, key) {
                        var song = $scope.mapSong(key, item, server, dir, coverart);
                        if (song) {
                            $rootScope.song.push(song);
                        }
                    });
                    $scope.$apply();
                }
            }
        });
    };
    $scope.addSongsToQueue = function () {
        angular.forEach($scope.selectedSongs, function (item, key) {
            $scope.queue.push(item);
            item.selected = false;
        });
        $('body').layout().open('south');
        notifications.updateMessage($scope.selectedSongs.length + ' Song(s) Added to Queue', true);
    }
    $scope.scrollToTop = function () {
        $('#Artists').stop().scrollTo('#auto', 400);
    }
    $scope.selectAll = function () {
        angular.forEach($rootScope.song, function (item, key) {
            $scope.selectedSongs.push(item);
            item.selected = true;
        });
    }
    $scope.selectNone = function () {
        angular.forEach($rootScope.song, function (item, key) {
            $scope.selectedSongs = [];
            item.selected = false;
        });
    }
    $scope.setupDemoCollections = function () {
        if (globals.SavedCollections.length == 0) {
            globals.SavedCollections = ["YonderMountainStringBand", "GreenskyBluegrass"];
            $scope.getArtists();
        }
    }



    /* Launch on Startup */
    $scope.getArtists();
    /* End Startup */
});