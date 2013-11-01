JamStash.service('player', function ($rootScope, $window, utils, globals, model, notifications) {
    var player1 = '#playdeck_1';
    var player2 = '#playdeck_2';
    var scrobbled = false;
    var timerid = 0;

    $rootScope.defaultPlay = function (data, event) {
        if (typeof $(player1).data("jPlayer") == 'undefined') {
            $rootScope.nextTrack();
        }
    }
    $rootScope.nextTrack = function () {
        var next = getNextSong();
        if (next) {
            $rootScope.playSong(false, next);
        }
        //$(player1).jPlayer("stop");
        //$(player2).jPlayer("play");
    }
    $rootScope.previousTrack = function () {
        var next = getNextSong(true);
        if (next) {
            $rootScope.playSong(false, next);
        }
    }
    getNextSong = function (previous) {
        var song;
        if (globals.settings.Debug) { console.log('Getting Next Song > ' + 'Queue length: ' + $rootScope.queue.length); }
        if ($rootScope.queue.length > 0) {
            angular.forEach($rootScope.queue, function(item, key) {
                if (item.playing === true) {
                    song = item;
                }
            });
            var index = $rootScope.queue.indexOf(song);
            var next;
            if (previous) {
                next = $rootScope.queue[index - 1];
            } else {
                next = $rootScope.queue[index + 1];
            }
            if (typeof next != 'undefined') {
                if (globals.settings.Debug) { console.log('Next Song: ' + next.id); }
                return next;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    this.startSaveTrackPosition = function () {
        if (globals.settings.SaveTrackPosition) {
            if (timerid != 0) {
                clearInterval(timerid);
            }
            timerid = $window.setInterval(function () {
                if (globals.settings.SaveTrackPosition) {
                    saveTrackPosition();
                }
            }, 30000);
        }
    }
    saveTrackPosition = function () {
        //var audio = typeof $(player1).data("jPlayer") != 'undefined' ? true : false;
        var audio = $(player1).data("jPlayer");
        if (typeof audio != 'undefined') {
            if (audio.status.currentTime > 0 && audio.status.paused == false) {
                var song;
                angular.forEach($rootScope.queue, function(item, key) {
                    if (item.playing === true) {
                        song = item;
                    }
                });
                if (song) {
                    var position = audio.status.currentTime;
                    if (position != null) {
                        $('#action_SaveProgress').fadeOut("slow").delay(500).fadeIn("slow").delay(500).fadeOut("slow").delay(500).fadeIn("slow");
                        song.position = position;
                        // Save Queue
                        if (utils.browserStorageCheck()) {
                            try {
                                var songStr = angular.toJson(song);
                                localStorage.setItem('CurrentSong', songStr);
                                if (globals.settings.Debug) { console.log('Saving Current Position: ' + songStr); }
                                var html = localStorage.getItem('CurrentQueue');
                                if ($rootScope.queue.length > 0) {
                                    var current = $rootScope.queue;
                                    if (current != html) {
                                        localStorage.setItem('CurrentQueue', angular.toJson(current));
                                        if (globals.settings.Debug) { console.log('Saving Queue: ' + current.length + ' characters'); }
                                    }
                                }
                            } catch (e) {
                                if (e == QUOTA_EXCEEDED_ERR) {
                                    alert('Quota exceeded!');
                                }
                            }
                        } else {
                            if (globals.settings.Debug) { console.log('HTML5::loadStorage not supported on your browser'); }
                        }
                    }
                }
            }
        }
    }
    this.loadTrackPosition = function () {
        if (utils.browserStorageCheck()) {
            // Load Saved Song
            var song = angular.fromJson(localStorage.getItem('CurrentSong'));
            if (song) {
                $rootScope.playSong(true, song);
                // Load Saved Queue
                var items = angular.fromJson(localStorage.getItem('CurrentQueue'));
                if (items) {
                    //$rootScope.queue = [];
                    $rootScope.queue = items;
                    if ($rootScope.queue.length > 0) {
                        //$('body').layout().open('south');
                        notifications.updateMessage($rootScope.queue.length + ' Saved Song(s)', true);
                    }
                    if (globals.settings.Debug) { console.log('Play Queue Loaded From localStorage: ' + $rootScope.queue.length + ' song(s)'); }
                }
            }
        } else {
            if (globals.settings.Debug) { console.log('HTML5::loadStorage not supported on your browser'); }
        }
    }
    deleteCurrentQueue = function (data) {
        if (utils.browserStorageCheck()) {
            localStorage.removeItem('CurrentQueue');
            utils.setValue('CurrentSong', null, false);
            if (globals.settings.Debug) { console.log('Removing Play Queue'); }
        } else {
            if (globals.settings.Debug) { console.log('HTML5::loadStorage not supported on your browser, ' + html.length + ' characters'); }
        }
    }
    $rootScope.playSong = function (loadonly, data) {
        if (globals.settings.Debug) { console.log('Play: ' + JSON.stringify(data, null, 2)); }
        angular.forEach($rootScope.queue, function(item, key) {
            item.playing = false;        
        });
        data.playing = true;
        data.selected = false;
        $rootScope.playingSong = data;

        var id = data.id;
        var url = data.url;
        var position = data.position;
        var title = data.name;
        var album = data.album;
        var artist = data.artist;
        var suffix = data.suffix;
        var specs = data.specs;
        var coverartthumb = data.coverartthumb;
        var coverartfull = data.coverartfull;
        var starred = data.starred;
        $('#playermiddle').css('visibility', 'visible');
        $('#songdetails').css('visibility', 'visible');

        $rootScope.loadjPlayer(player1, url, suffix, loadonly, position);
        if (!loadonly) {
            // Sway.fm UnityShim
            var playerState = {
                playing: true,
                title: title,
                artist: artist,
                favorite: false,
                albumArt: coverartfull
            }
            if ($rootScope.unity) {
                $rootScope.unity.sendState(playerState);
            }
            // End UnityShim
        }
        $('#Queue').stop().scrollTo('#' + id, 400);
        $('#QueuePreviewList').stop().scrollTo('#' + id, 400);
        var spechtml = '';
        var data = $(player1).data().jPlayer;
        for (i = 0; i < data.solutions.length; i++) {
            var solution = data.solutions[i];
            if (data[solution].used) {
                spechtml += "<strong class=\"codesyntax\">" + solution + "</strong> is";
                spechtml += " currently being used with<strong>";
                for (format in data[solution].support) {
                    if (data[solution].support[format]) {
                        spechtml += " <strong class=\"codesyntax\">" + format + "</strong>";
                    }
                }
                spechtml += "</strong> support";
            }
        }
        $('#SMStats').html(spechtml);
        scrobbleSong(false);
        scrobbled = false;

        if (globals.settings.NotificationSong && !loadonly) {
            notifications.showNotification(coverartthumb, utils.toHTML.un(title), utils.toHTML.un(artist + ' - ' + album), 'text', '#NextTrack');
        }
        if (globals.settings.ScrollTitle) {
            var title = utils.toHTML.un(artist) + ' - ' + utils.toHTML.un(title);
            utils.scrollTitle(title);
        } else {
            utils.setTitle(utils.toHTML.un(artist) + ' - ' + utils.toHTML.un(title));
        }
        //utils.safeApply();
        if(!$rootScope.$root.$$phase) {
            $rootScope.$apply();
        }
    };
    $rootScope.loadjPlayer = function (el, url, suffix, loadonly, position) {
        // jPlayer Setup
        var volume = 1;
        if (utils.getValue('Volume')) {
            volume = parseFloat(utils.getValue('Volume'));
        }
        var audioSolution = "html,flash";
        if (utils.getValue('ForceFlash')) {
            audioSolution = "flash,html";
        }
        //var salt = Math.floor(Math.random() * 100000);
        //url += '&salt=' + salt;
        $(el).jPlayer("destroy");
        $.jPlayer.timeFormat.showHour = true; 
        $(el).jPlayer({
            swfPath: "js/plugins/jplayer",
            wmode: "window",
            solution: audioSolution,
            supplied: suffix,
            volume: volume,
            errorAlerts: false,
            warningAlerts: false,
            cssSelectorAncestor: "#player",
            cssSelector: {
                play: "#PlayTrack",
                pause: "#PauseTrack",
                seekBar: "#audiocontainer .scrubber",
                playBar: "#audiocontainer .progress",
                mute: "#action_Mute",
                unmute: "#action_UnMute",
                volumeMax: "#action_VolumeMax",
                currentTime: "#played",
                duration: "#duration"
            },
            ready: function () {
                if (suffix == 'oga') {
                    $(this).jPlayer("setMedia", {
                        oga: url,
                    });
                } else if (suffix == 'mp3') {
                    $(this).jPlayer("setMedia", {
                        mp3: url,
                    });
                }
                if (!loadonly) { // Start playing
                    $(this).jPlayer("play");
                } else { // Loadonly
                    //$('#' + songid).addClass('playing');
                    $(this).jPlayer("pause", position);
                }
                if (globals.settings.Debug) {
                    console.log('[jPlayer Version Info]');
                    utils.logObjectProperties($(el).data("jPlayer").version);
                    console.log('[HTML5 Debug Info]');
                    utils.logObjectProperties($(el).data("jPlayer").html);
                    console.log('[Flash Debug Info]');
                    utils.logObjectProperties($(el).data("jPlayer").flash);
                    console.log('[jPlayer Options Info]');
                    utils.logObjectProperties($(el).data("jPlayer").options);
                }
		    },
            timeupdate: function(event) {
                // Scrobble song once percentage is reached
                var p = event.jPlayer.status.currentPercentAbsolute;
                if (!scrobbled && p > 30) {
                    if (globals.settings.Debug) { console.log('LAST.FM SCROBBLE - Percent Played: ' + p); }
                    scrobbleSong(true);
                }
            },
            volumechange: function(event) {
                utils.setValue('Volume', event.jPlayer.options.volume, true);
            },
            ended: function(event) {
                if (globals.settings.Repeat) { // Repeat current track if enabled
                    $(this).jPlayer("play");
                } else {
                    if (!getNextSong()) { // Action if we are at the last song in queue
                        if (globals.settings.LoopQueue) { // Loop to first track in queue if enabled
                            var next = $rootScope.queue[0];
                            $rootScope.playSong(false, next);                
                        } else if (globals.settings.AutoPlay) { // Load more tracks if enabled
                            $rootScope.getRandomSongs('play', '', '');
                            notifications.updateMessage('Auto Play Activated...', true);
                        }
                    } else {
                        $rootScope.nextTrack();
                    }
                }
            },
            error: function(event) {
                var time = $(player1).data("jPlayer").status.currentTime;
                $(player1).jPlayer("play", time);
                if (globals.settings.Debug) { 
                    console.log("Error Type: " + event.jPlayer.error.type); 
                    console.log("Error Context: " + event.jPlayer.error.context); 
                    console.log("Error Message: " + event.jPlayer.error.message); 
                    console.log("Stream interrupted, retrying from position: " + time);
                }
            }
        });
        return;
    }
    this.playPauseSong = function () {
        if (typeof $(player1).data("jPlayer") != 'undefined') {
            if ($(player1).data("jPlayer").status.paused) {
                $(player1).jPlayer("play");
            } else {
                $(player1).jPlayer("pause");
            }
        } 
    }
    playVideo = function (id, bitrate) {
        var w, h;
        bitrate = parseInt(bitrate);
        if (bitrate <= 600) { 
            w = 320; h = 240; 
        } else if (bitrate <= 1000) { 
            w = 480; h = 360; 
        } else { 
            w = 640; h = 480; 
        } 
        //$("#jPlayerSelector").jPlayer("option", "fullScreen", true);
        $("#videodeck").jPlayer({
		    ready: function () {
                /*
                $.fancybox({
                    autoSize: false,
                    width: w + 10,
                    height: h + 10,
                    content: $('#videodeck')
                });
                */
			    $(this).jPlayer("setMedia", {
				    m4v: 'https://&id=' + id + '&salt=83132'
			    }).jPlayer("play");
                $('#videooverlay').show();
		    },
		    swfPath: "js/jplayer",
		    solution: "html, flash",
		    supplied: "m4v"
	    });
    }
    
    scrobbleSong = function (submission) {
        var songid = $('#songdetails li.song').attr('id');
        if (typeof songid != 'undefined' && globals.settings.Username != '' && globals.settings.Server != '') {
            if (globals.settings.Debug) { console.log('Scrobble Song: ' + songid); }
            $.ajax({
                url: globals.BaseURL() + '/scrobble.view?' + globals.BaseParams() + '&id=' + songid + "&submission=" + submission,
                method: 'GET',
                dataType: globals.settings.Protocol,
                timeout: 10000,
                success: function () {
                    if (submission) {
                        scrobbled = true;
                    }
                }
            });
        } else {
            if (submission) {
                scrobbled = true;
            }
        }
    }
    rateSong = function (songid, rating) {
        $.ajax({
            url: baseURL + '/setRating.view?' + baseParams + '&id=' + songid + "&rating=" + rating,
            method: 'GET',
            dataType: protocol,
            timeout: 10000,
            success: function () {
                updateMessage('Rating Updated!', true);
            }
        });
    }
});