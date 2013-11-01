JamStash.controller('ArchiveCtrl',
function ArchiveCtrl($scope, $rootScope, $location, $routeParams, $http, utils, globals, model, notifications, player, json) {
    $("#LayoutContainer").layout($scope.layoutThreeCol);

    $scope.settings = globals.settings;
    $scope.itemType = 'archive';
    $rootScope.song = [];
    $scope.Protocol = 'jsonp';
    $scope.artist = [];
    $scope.album = [];
    $scope.selectedArtist;
    $scope.selectedAlbum;
    $scope.selectedSongs = [];
    $scope.SavedCollections = globals.SavedCollections;
    $scope.AllCollections = [];
    $scope.loadedCollection = false;
    json.getCollections(function (data) {
        $scope.AllCollections = data;
        $scope.loadedCollection = true;
    });
    $scope.writeSavedCollection = function () {
        utils.setValue('SavedCollections', $scope.SavedCollections.join(), false);
        /*
        $scope.$apply(function () {
        });
        */
        globals.SavedCollections = $scope.SavedCollections;
    }
    $scope.addSavedCollection = function (newValue) {
        if ($scope.SavedCollections.indexOf(newValue) == -1) {
            $scope.SavedCollections.push(newValue);
            $scope.writeSavedCollection();
        }
    }
    $scope.deleteSavedCollection = function (index) {
        $scope.SavedCollections.splice(index, 1);
        $scope.writeSavedCollection();
    }
    $scope.selectedCollection;
    $scope.$watch("selectedCollection", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.addSavedCollection(newValue);
        }
    });
    $scope.setupDemoCollections = function () {
        var demo = ["YonderMountainStringBand", "GreenskyBluegrass"];
        angular.forEach(demo, function (item, key) {
            if ($scope.SavedCollections.indexOf(item) == -1) {
                $scope.SavedCollections.push(item);
            }
        });
    }
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
            $scope.getAlbums('', '');
        }
    }
    /* End Filter */

    /*
    $scope.getArtists = function (data) {
    var map = function (data) {
    return new model.Artist('', data);
    };
    angular.forEach($scope.SavedCollections, function (item, key) {
    $scope.artist.push(map(item));
    });
    };
    */
    $scope.getAlbums = function (name, identifier) {
        var url = $scope.archiveUrl + 'advancedsearch.php?q=';
        if (name != '') {
            $scope.selectedArtist = name;
            url += 'collection:(' + name + ') AND format:(MP3)';
        } else if ($scope.selectedArtist) {
            url += 'collection:(' + $scope.selectedArtist + ') AND format:(MP3)';
        } else {
            url += 'identifier:(' + identifier + ')';
        }
        var map = function (data) {
            var song = data;
            var coverartthumb, coverartfull, starred;
            var url = $scope.archiveUrl + 'details/' + song.identifier;
            coverartthumb = 'images/albumdefault_50.jpg';
            coverartfull = 'images/albumdefault_160.jpg';
            if (parseInt(song.avg_rating) == 5) { starred = true; } else { starred = false; }
            //var description = '<b>Details</b><br />';
            var description = '<b>Source</b>: ' + song.source + '<br />';
            description += '<b>Date</b>: ' + song.date + '<br />';
            description += typeof song.publisher != 'undefined' ? '<b>Transferer</b>: ' + song.publisher + '<br />' : '';
            description += typeof song.avg_rating != 'undefined' ? '<b>Rating</b>: ' + song.avg_rating + '<br />' : '';
            description += typeof song.downloads != 'undefined' ? '<b>Downloads</b>: ' + song.downloads + '<br />' : '';
            return new model.Album(song.identifier, null, song.title, song.collection[0], coverartthumb, coverartfull, $.format.date(new Date(song.publicdate), "yyyy-MM-dd h:mm a"), starred, description, url);
        }
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
                    notifications.updateMessage($scope.album.length, true);
                } else {
                    notifications.updateMessage("Sorry :(", true);
                }
            },
            error: function () {
                alert('Archive.org service down :(');
            }
        });
    };
    $scope.mapSong = function (key, song, server, dir, identifier, coverart) {
        var url, time, track, title, rating, starred, contenttype, suffix;
        var specs = ''
        if (song.format == 'VBR MP3') {
            url = 'http://' + server + dir + key;
            if (typeof song.bitrate == 'undefined' || typeof song.format == 'undefined') { specs = '&nbsp;'; } else { specs = song.bitrate + 'kbps, ' + song.format.toLowerCase(); }
            if (typeof song.track == 'undefined') { track = '&nbsp;'; } else { track = song.track; }
            if (typeof song.title == 'undefined') { title = '&nbsp;'; } else { title = song.title; }
            if (typeof song.length == 'undefined') { time = '&nbsp;'; } else { time = utils.timeToSeconds(song.length); }
            return new model.Song(song.md5, identifier, song.track, title, song.creator, '', song.album, '', coverart, coverart, time, '', '', 'mp3', specs, url, 0, '');
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
                var identifier = data.metadata.identifier[0];
                if (typeof data.misc.image != 'undefined') {
                    coverart = data.misc.image;
                }
                var items = data.files;
                if (action == 'add') {
                    angular.forEach(items, function (item, key) {
                        var song = $scope.mapSong(key, item, server, dir, identifier, coverart);
                        if (song) {
                            $rootScope.queue.push(song);
                        }
                    });
                    $('body').layout().open('south'); 
                    notifications.updateMessage(Object.keys(items).length + ' Song(s) Added to Queue', true);
                    $scope.$apply();
                } else if (action == 'play') {
                    $rootScope.queue = [];
                    angular.forEach(items, function (item, key) {
                        var song = $scope.mapSong(key, item, server, dir, identifier, coverart);
                        if (song) {
                            $rootScope.queue.push(song);
                        }
                    });
                    var next = $rootScope.queue[0];
                    $scope.$apply(function () {
                        $rootScope.playSong(false, next);
                    });
                    $('body').layout().open('south');
                    notifications.updateMessage(Object.keys(items).length + ' Song(s) Added to Queue', true);
                } else {
                    $rootScope.song = [];
                    angular.forEach(items, function (item, key) {
                        var song = $scope.mapSong(key, item, server, dir, identifier, coverart);
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
        if ($scope.selectedSongs.length > 0) {
            angular.forEach($scope.selectedSongs, function (item, key) {
                $scope.queue.push(item);
                item.selected = false;
            });
            $('body').layout().open('south');
            notifications.updateMessage($scope.selectedSongs.length + ' Song(s) Added to Queue', true);
        }
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

    /* Launch on Startup */
    if ($routeParams.artist) {
        if ($routeParams.album) {
            //collection:(GreenskyBluegrass) AND format:(MP3) AND identifier:(gsbg2013-09-20.flac16)
            $scope.getAlbums('', $routeParams.album);
        } else {
            $scope.getAlbums($routeParams.artist, '');
        }
        $scope.addSavedCollection($routeParams.artist);
    }
    /* End Startup */
});