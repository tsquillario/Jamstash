JamStash.controller('PodcastCtrl',
function PodcastCtrl($scope, $rootScope, $location, utils, globals, model, notifications) {
    $("#LayoutContainer").layout($scope.layoutTwoCol);

    $rootScope.song = [];
    $scope.podcasts = [];
    $scope.selectedPodcast;
    $scope.getPodcasts = function (refresh) {
        if (globals.settings.Debug) { console.log("LOAD PODCASTS"); }
        $.ajax({
            url: globals.BaseURL() + '/getPodcasts.view?' + globals.BaseParams(),
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (data["subsonic-response"].podcasts.channel !== undefined) {
                    var items = [];
                    if (data["subsonic-response"].podcasts.channel.length > 0) {
                        items = data["subsonic-response"].podcasts.channel;
                    } else {
                        items[0] = data["subsonic-response"].podcasts.channel;
                    }
                    $scope.podcasts = items;
                    $scope.$apply();
                }
            }
        });
    }
    $scope.getPodcast = function (id, action) {
        $scope.selectedPodcast = id;
        var map = function (data) {
            var song = data;
            var url, track, rating, starred, contenttype, suffix, description;
            var specs = '', coverartthumb = '', coverartfull = '';
            if (typeof song.coverArt != 'undefined') {
                coverartthumb = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=60&id=' + song.coverArt;
                coverartfull = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&id=' + song.coverArt;
            }
            if (typeof song.description == 'undefined') { description = ''; } else { description = song.description; }
            if (typeof song.track == 'undefined') { track = '&nbsp;'; } else { track = song.track; }
            if (typeof song.starred !== 'undefined') { starred = true; } else { starred = false; }
            if (song.bitRate !== undefined) { specs += song.bitRate + ' Kbps'; }
            if (song.transcodedSuffix !== undefined) { specs += ', transcoding:' + song.suffix + ' > ' + song.transcodedSuffix; } else { specs += ', ' + song.suffix; }
            if (song.transcodedSuffix !== undefined) { suffix = song.transcodedSuffix; } else { suffix = song.suffix; }
            if (suffix == 'ogg') { suffix = 'oga'; }
            var salt = Math.floor(Math.random() * 100000);
            url = globals.BaseURL() + '/stream.view?' + globals.BaseParams() + '&id=' + song.streamId + '&salt=' + salt;
            return new model.Song(song.streamId, song.parent, track, song.title, song.artist, song.artistId, song.album, song.albumId, coverartthumb, coverartfull, song.duration, song.userRating, starred, suffix, specs, url, 0, description);
        }
        $.ajax({
            url: globals.BaseURL() + '/getPodcasts.view?' + globals.BaseParams(),
            method: 'GET',
            dataType: globals.settings.Protocol,
            timeout: globals.settings.Timeout,
            success: function (data) {
                if (data["subsonic-response"].podcasts.channel !== undefined) {
                    var podcasts = [];
                    if (data["subsonic-response"].podcasts.channel.length > 0) {
                        podcasts = data["subsonic-response"].podcasts.channel;
                    } else {
                        podcasts[0] = data["subsonic-response"].podcasts.channel;
                    }
                    var items = [];
                    $.each(podcasts, function (i, item) {
                        if (item.id == id) {
                            items = item.episode;
                        }
                    });

                    if (typeof items != 'undefined') {
                        if (action == 'add') {
                            angular.forEach(items, function (item, key) {
                                if (item.status != "skipped") {
                                    $rootScope.queue.push(map(item));
                                }
                            });
                            $scope.$apply();
                            $('body').layout().open('south');
                            notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
                        } else if (action == 'play') {
                            $rootScope.queue = [];
                            angular.forEach(items, function (item, key) {
                                if (item.status != "skipped") {
                                    $rootScope.queue.push(map(item));
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
                                if (item.status != "skipped") {
                                    $rootScope.song.push(map(item));
                                }
                            });
                            $scope.$apply();
                        }
                    }
                }
            }
        });
    }

    /* Launch on Startup */
    $scope.getPodcasts();
    /* End Startup */
});