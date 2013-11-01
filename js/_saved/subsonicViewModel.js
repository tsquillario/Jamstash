define(['knockout', 'postbox', 'mapping', 'global', 'utils', 'model', 'player', 'subsonic', 'jquery.scrollTo', 'jquery.layout', 'jquery.dateFormat'], function (ko, postbox, mapping, global, utils, model, player, subsonic) {
    return function () {
        var self = this;
       

        self.settings = global.settings;
        self.queue = ko.observableArray([]).syncWith("queue", true);
        //self.layoutSubsonic = ko.observable().syncWith("layoutSubsonic");
        //self.layoutArchive = ko.observable().syncWith("layoutArchive");
        
        
        self.addFromPlayedToQueue = function (data, event) {
            var i = self.song.indexOf(this);
            var count = 0;
            ko.utils.arrayForEach(self.song.slice(i, self.song().length), function (item) {
                self.queue.push(item);
                //item.selected(true);
                count++;
            });
            player.nextTrack();
            //self.selectedSongs([]);
            //self.selectNone();
            utils.updateMessage(count + ' Song(s) Added to Queue', true);
        }

        
        self.albumMapping = {
            create: function (options) {
                var album = options.data;
                var coverart, starred;
                if (typeof album.coverArt != 'undefined') {
                    coverart = self.settings.BaseURL() + '/getCoverArt.view?' + self.settings.BaseParams() + '&size=50&id=' + album.coverArt;
                }
                if (typeof album.starred !== 'undefined') { starred = true; } else { starred = false; }
                return new model.Album(album.id, album.parent, album.album, album.artist, coverart, $.format.date(new Date(album.created), "yyyy-MM-dd h:mm a"), starred, '', '');
            }
        }
        
        self.getAlbumsByTag = function (data, Event) { // Gets albums by ID3 tag
            var id = event.currentTarget.id;
            $('#AutoAlbumContainer li').removeClass('selected');
            $('#ArtistContainer li').removeClass('selected');
            $(this).addClass('selected');
            var map = {
                create: function (options) {
                    var album = options.data;
                    var coverart, starred;
                    if (typeof album.coverArt != 'undefined') {
                        coverart = self.settings.BaseURL() + '/getCoverArt.view?' + self.settings.BaseParams() + '&size=50&id=' + album.coverArt;
                    }
                    if (typeof album.starred !== 'undefined') { starred = true; } else { starred = false; }
                    return new model.Album(album.id, album.parent, album.name, album.artist, coverart, album.created, starred, '', '');
                }
            }
            $.ajax({
                url: self.settings.BaseURL() + '/getArtist.view?' + self.settings.BaseParams() + '&id=' + id,
                method: 'GET',
                dataType: self.settings.Protocol(),
                timeout: 10000,
                success: function (data) {
                    if (data["subsonic-response"].artist !== undefined) {
                        var children = [];
                        if (data["subsonic-response"].artist.album.length > 0) {
                            children = data["subsonic-response"].artist.album;
                        } else {
                            children[0] = data["subsonic-response"].artist.album;
                        }
                        self.album.removeAll();
                        self.templateToUse('album-template');
                        mapping.fromJS(children, map, self.album);
                    }
                }
            });
        }
        
        self.getSongsByTag = function (data, event) { // Gets songs by ID3 tag
            var id = event.currentTarget.id;
            $.ajax({
                url: self.settings.BaseURL() + '/getAlbum.view?' + self.settings.BaseParams() + '&id=' + id,
                method: 'GET',
                dataType: self.settings.Protocol(),
                timeout: 10000,
                success: function (data) {
                    if (data["subsonic-response"].album !== undefined) {
                        var children = [];
                        if (data["subsonic-response"].album.song.length > 0) {
                            children = data["subsonic-response"].album.song;
                        } else {
                            children[0] = data["subsonic-response"].album.song;
                        }
                        self.song.removeAll();
                        mapping.fromJS(children, self.songMapping, self.song);
                    }
                }
            });
        };

        // Referenced Functions
        self.getRandomSongs = function (action, genre, folder) { return subsonic.getRandomSongs(action, genre, folder); }
        self.updateFavorite = function (data, event) { return subsonic.updateFavorite(data, event); }

        
        /* Start Archive.org */
        self.getArchiveArtists = function (data) {
            var map = {
                create: function (options) {
                    //return new model.Artist('', options.data);
                    return new model.Album(options.data, null, options.data, null, '', null, false, '', '');
                }
            };
            mapping.fromJS(self.settings.SavedCollections().split(","), map, self.album);
        };
        self.getArchiveAlbums = function (from) {
            var id, name;
            if (from == 'collection') {
                self.selectedArtist(this);
                id = this.id();
                name = this.name();
            } else {
                id = self.selectedArtist().id();
                name = self.selectedArtist().name();
            }
            var map = {
                create: function (options) {
                    var song = options.data;
                    var coverart, starred;
                    var url = self.archiveUrl + 'details/' + song.identifier;
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
            }
            //var url = self.settings.BaseURL() + 'advancedsearch.php?q=collection%3A%28GreenskyBluegrass%29%20AND%20format%3A%28mp3%29&fl%5B%5D=avg_rating&fl%5B%5D=collection&fl%5B%5D=date&fl%5B%5D=description&fl%5B%5D=downloads&fl%5B%5D=headerImage&fl%5B%5D=identifier&fl%5B%5D=publicdate&fl%5B%5D=source&fl%5B%5D=subject&fl%5B%5D=title&format=mp3&sort%5B%5D=addeddate+desc&rows=50&page=1&output=json';
            var url = self.archiveUrl + 'advancedsearch.php?q=collection:(' + name + ') AND format:(MP3)';
            if (self.selectedSource()) {
                url += ' AND source:(' + self.selectedSource() + ')';
            }
            if (self.selectedYear()) {
                if (parseInt(self.selectedYear())) {
                    url += ' AND year:(' + self.selectedYear() + ')';
                }
            }
            if (self.selectedDescription()) {
                url += ' AND description:(' + self.selectedDescription() + ')';
            }
            url += '&fl[]=avg_rating,collection,date,description,downloads,headerImage,identifier,publisher,publicdate,source,subject,title,year';
            if (self.selectedArchiveAlbumSort()) {
                url += '&sort[]=' + self.selectedArchiveAlbumSort()
            }
            url += '&rows=50&page=1&output=json';
            $.ajax({
                url: url,
                method: 'GET',
                dataType: self.protocol,
                timeout: 10000,
                success: function (data) {
                    var items = [];
                    if (data["response"].docs.length > 0) {
                        items = data["response"].docs;
                        //alert(JSON.stringify(data["response"]));
                        mapping.fromJS(items, map, self.album);
                    } else {
                        utils.updateMessage("0 records returned", true);
                    }
                },
                error: function () {
                    alert('Archive.org service down :(');
                }
            });
        };

        






        // Init for page load
        if (utils.getValue('SubsonicAccordion')) {
            var id = utils.getValue('SubsonicAccordion');
            self.toggleAccordion(id);
        }
        if (settings.Server() != '' && settings.Username() != '' && settings.Password() != '') {
            self.ping();
            self.getMusicFolders();
            self.getArtists();
        }

        return {
            index: self.index,
            shortcut: self.shortcut,
            album: self.album,
            song: self.song,
            templateToUse: self.templateToUse,
            selectedArtist: self.selectedArtist,
            selectedAlbum: self.selectedAlbum,
            selectedPlaylist: self.selectedPlaylist,
            selectedSongs: self.selectedSongs,
            selectSong: self.selectSong,
            addSongsToQueue: self.addSongsToQueue,
            addFromPlayedToQueue: self.addFromPlayedToQueue,
            getArtists: self.getArtists,
            AutoAlbums: self.AutoAlbums,
            selectedAutoAlbum: self.selectedAutoAlbum,
            getAlbums: self.getAlbums,
            offset: self.offset,
            getAlbumListBy: self.getAlbumListBy,
            getSongs: self.getSongs,
            getRandomSongs: self.getRandomSongs,
            search: self.search,
            updateFavorite: self.updateFavorite,
            MusicFolders: self.MusicFolders,
            selectedMusicFolders: self.selectedMusicFolders,
            getMusicFolders: self.getMusicFolders,
            scrollToTop: self.scrollToTop,
            scrollToIndex: self.scrollToIndex,
            selectAll: self.selectAll,
            selectNone: self.selectNone,
            rescanLibrary: self.rescanLibrary,
            toggleAZ: self.toggleAZ,
            selectedSubsonicAlbumSort: self.selectedSubsonicAlbumSort,
            SubsonicAlbumSort: self.SubsonicAlbumSort,
            getPodcasts: self.getPodcasts,
            getPodcast: self.getPodcast,
            getPlaylists: self.getPlaylists,
            getPlaylist: self.getPlaylist,
            addSongsToPlaylist: self.addSongsToPlaylist,
            newPlaylist: self.newPlaylist,
            savePlaylist: self.savePlaylist,
            deletePlaylist: self.deletePlaylist,
            addToPlaylist: self.addToPlaylist,
            playlistMenu: self.playlistMenu,
            removeSelectedSongs: self.removeSelectedSongs,
            toggleAccordion: self.toggleAccordion
        };
    }
});