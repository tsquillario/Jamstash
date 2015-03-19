describe("Subsonic service -", function() {
    'use strict';

    var subsonic, mockBackend, mockGlobals;
    var response;
    beforeEach(function() {
        // We redefine it because in some tests we need to alter the settings
        mockGlobals = {
            settings: {
                AutoPlaylistSize: 3,
                Username: "Hyzual",
                Password: "enc:cGFzc3dvcmQ=",
                Protocol: "jsonp",
                ApiVersion: "1.10.2",
                ApplicationName: "Jamstash",
                Timeout: 20000
            },
            // TODO: Hyz: Remove it when everything is refactored
            BaseURL: function () {
                return 'http://demo.subsonic.com/rest';
            }
        };

        module('jamstash.subsonic.service', function ($provide) {
            $provide.value('globals', mockGlobals);
            // Mock the model service
            $provide.decorator('map', function ($delegate) {
                $delegate.mapSong = function (argument) {
                    return argument;
                };
                $delegate.mapPodcast = function (argument) {
                    return argument;
                };
                $delegate.mapAlbum = function (argument) {
                    return argument;
                };
                return $delegate;
            });
            // Mock utils.getValue
            $provide.decorator('utils', function ($delegate) {
                $delegate.getValue = function () {
                    return undefined;
                };
                return $delegate;
            });
        });

        inject(function (_subsonic_, $httpBackend) {
            subsonic = _subsonic_;
            mockBackend = $httpBackend;
        });
        response = {"subsonic-response": {status: "ok", version: "1.10.2"}};
    });

    afterEach(function() {
        mockBackend.verifyNoOutstandingExpectation();
        mockBackend.verifyNoOutstandingRequest();
    });

    describe("subsonicRequest() -", function() {
        var partialUrl, url;
        beforeEach(function() {
            partialUrl = '/getStarred.view';
            url ='http://demo.subsonic.com/rest/getStarred.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        });

        it("Given that the Subsonic server is not responding, when I make a request to Subsonic it returns an error object with a message", function() {
            mockBackend.expectJSONP(url).respond(503, 'Service Unavailable');

            var promise = subsonic.subsonicRequest(partialUrl);
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'Error when contacting the Subsonic server.', httpError: 503});
        });

        it("Given a missing parameter, when I make a request to Subsonic it returns an error object with a message", function() {
            delete mockGlobals.settings.Password;
            var missingPasswordUrl = 'http://demo.subsonic.com/rest/getStarred.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&u=Hyzual&v=1.10.2';
            var errorResponse = {"subsonic-response" : {
                "status" : "failed",
                "version" : "1.10.2",
                "error" : {"code" : 10,"message" : "Required parameter is missing."}
            }};
            mockBackend.expectJSONP(missingPasswordUrl).respond(JSON.stringify(errorResponse));

            var promise = subsonic.subsonicRequest(partialUrl);
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'Error when contacting the Subsonic server.', subsonicError: {code: 10, message:'Required parameter is missing.'}});
        });

        it("Given a partialUrl that does not start with '/', it adds '/' before it and makes a correct request", function() {
            partialUrl = 'getStarred.view';
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            subsonic.subsonicRequest(partialUrl);
            mockBackend.flush();
        });

        it("Given $http config params, it does not overwrite them", function() {
            partialUrl = 'scrobble.view';
            url ='http://demo.subsonic.com/rest/scrobble.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&id=75&p=enc:cGFzc3dvcmQ%3D&submission=false&u=Hyzual&v=1.10.2';
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            subsonic.subsonicRequest(partialUrl, {
                params: {
                    id: 75,
                    submission: false
                }
            });
            mockBackend.flush();
        });

        it("Given that the global protocol setting is 'json', when I make a request to Subsonic it uses GET and does not use the JSON_CALLBACK parameter", function() {
            mockGlobals.settings.Protocol = 'json';
            var getUrl = 'http://demo.subsonic.com/rest/getStarred.view?'+
                'c=Jamstash&f=json&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
            mockBackend.expectGET(getUrl).respond(JSON.stringify(response));

            var promise = subsonic.subsonicRequest(partialUrl);
            mockBackend.flush();

            expect(promise).toBeResolvedWith({status: "ok", version: "1.10.2"});
        });
    });

    describe("getStarred() -", function() {
        var url;
        beforeEach(function() {
            url = 'http://demo.subsonic.com/rest/getStarred.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        });

        it("Given that I have 2 starred albums, 1 starred artist and 3 starred songs in my library, when getting everything starred, it returns them all", function() {
            response["subsonic-response"].starred = {
                artist: [{id: 2245}],
                album: [{id: 1799},{id: 20987}],
                song: [{id: 2478},{id: 14726},{id: 742}]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getStarred();
            mockBackend.flush();

            expect(promise).toBeResolvedWith({
                artist: [{id: 2245}],
                album: [{id: 1799},{id: 20987}],
                song: [{id: 2478},{id: 14726},{id: 742}]
            });
        });

        it("Given that there is absolutely nothing starred in my library, when getting everything starred, it returns an error object with a message", function() {
            response["subsonic-response"].starred = {};
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getStarred();
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'Nothing is starred on the Subsonic server.'});
        });
    });

    describe("getRandomStarredSongs() -", function() {
        var url;
        beforeEach(function() {
            url = 'http://demo.subsonic.com/rest/getStarred.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        });

        describe("Given that the global setting AutoPlaylist Size is 3", function() {
            it("and given that I have more than 3 starred songs in my library, when getting random starred songs, it returns 3 starred songs", function() {
                var library = [
                    {id: 11841},{id: 12061},{id: 17322},{id: 1547},{id: 14785}
                ];
                response["subsonic-response"].starred = {song: library};
                mockBackend.expectJSONP(url).respond(JSON.stringify(response));

                var promise = subsonic.getRandomStarredSongs();
                // We create a spy in order to get the results of the promise
                var success = jasmine.createSpy("success");
                promise.then(success);

                mockBackend.flush();

                expect(promise).toBeResolved();
                expect(success).toHaveBeenCalled();
                var randomlyPickedSongs = success.calls.mostRecent().args[0];
                for (var i = 0; i < randomlyPickedSongs.length; i++) {
                    expect(library).toContain(randomlyPickedSongs[i]);
                }
            });

            it("and given that I have only 1 starred song in my library, when getting random starred songs, it returns my starred song", function() {
                response["subsonic-response"].starred = {song: [{id: 11841}]};
                mockBackend.expectJSONP(url).respond(JSON.stringify(response));

                var promise = subsonic.getRandomStarredSongs();
                mockBackend.flush();

                expect(promise).toBeResolvedWith([{id: 11841}]);
            });

            it("and given that I don't have any starred song in my library, when getting random starred songs, it returns an error object with a message", function() {
                response["subsonic-response"].starred = {song: []};
                mockBackend.expectJSONP(url).respond(JSON.stringify(response));

                var promise = subsonic.getRandomStarredSongs();
                mockBackend.flush();

                expect(promise).toBeRejectedWith({reason: 'No starred songs found on the Subsonic server.'});
            });
        });
    });

    describe("getRandomSongs() -", function() {
        var url;
        beforeEach(function() {
            url = 'http://demo.subsonic.com/rest/getRandomSongs.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D'+'&size=3'+'&u=Hyzual&v=1.10.2';
        });

        describe("Given that the global setting AutoPlaylist Size is 3", function() {
            it("and given that I have more than 3 songs in my library, when getting random songs, it returns 3 songs", function() {
                var library = [
                    {id: 1143},{id: 5864},{id: 7407},{id: 6471},{id: 59}
                ];
                response["subsonic-response"].randomSongs = {song: library};
                mockBackend.expectJSONP(url).respond(JSON.stringify(response));

                var promise = subsonic.getRandomSongs();
                // We create a spy in order to get the results of the promise
                var success = jasmine.createSpy("success");
                promise.then(success);

                mockBackend.flush();

                expect(promise).toBeResolved();
                expect(success).toHaveBeenCalled();
                var randomlyPickedSongs = success.calls.mostRecent().args[0];
                for (var i = 0; i < randomlyPickedSongs.length; i++) {
                    expect(library).toContain(randomlyPickedSongs[i]);
                }
            });

            it("and given that I have only 1 song in my library, when getting random songs, it returns that song", function() {
                response["subsonic-response"].randomSongs = {song: [{id: 7793}]};
                mockBackend.expectJSONP(url).respond(JSON.stringify(response));

                var promise = subsonic.getRandomSongs();
                mockBackend.flush();

                expect(promise).toBeResolvedWith([{id: 7793}]);
            });

            it("and given that I don't have any song in my library, when getting random songs, it returns an error object with a message", function() {
                response["subsonic-response"].randomSongs = {song: []};
                mockBackend.expectJSONP(url).respond(JSON.stringify(response));

                var promise = subsonic.getRandomSongs();
                mockBackend.flush();

                expect(promise).toBeRejectedWith({reason: 'No songs found on the Subsonic server.'});
            });

            it("and given a genre, when getting random songs, it returns 3 songs from the given genre", function() {
                url = 'http://demo.subsonic.com/rest/getRandomSongs.view?'+
                    'c=Jamstash&callback=JSON_CALLBACK&f=jsonp'+'&genre=Rock'+'&p=enc:cGFzc3dvcmQ%3D'+'&size=3'+'&u=Hyzual&v=1.10.2';
                var library = [
                    {id: 9408},{id: 9470},{id: 6932}
                ];
                response["subsonic-response"].randomSongs = {song: library};
                mockBackend.expectJSONP(url).respond(JSON.stringify(response));

                var promise = subsonic.getRandomSongs('Rock');
                mockBackend.flush();

                expect(promise).toBeResolvedWith([{id: 9408},{id: 9470},{id: 6932}]);
            });

            it("and given a folder id, when getting random songs, it returns 3 songs from the given folder", function() {
                url = 'http://demo.subsonic.com/rest/getRandomSongs.view?'+
                    'c=Jamstash&callback=JSON_CALLBACK&f=jsonp'+'&musicFolderId=2'+'&p=enc:cGFzc3dvcmQ%3D'+'&size=3'+'&u=Hyzual&v=1.10.2';
                var library = [
                    {id: 9232},{id: 3720},{id: 8139}
                ];
                response["subsonic-response"].randomSongs = {song: library};
                mockBackend.expectJSONP(url).respond(JSON.stringify(response));

                var promise = subsonic.getRandomSongs('', 2);
                mockBackend.flush();

                expect(promise).toBeResolvedWith([{id: 9232},{id: 3720},{id: 8139}]);
            });
        });
    });

    it("ping() - when I ping Subsonic, it returns Subsonic's response, containing its REST API version", function() {
        var url = 'http://demo.subsonic.com/rest/ping.view?'+
            'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        mockBackend.expectJSONP(url).respond(JSON.stringify(response));

        var promise = subsonic.ping();
        mockBackend.flush();

        expect(promise).toBeResolvedWith({status: "ok", version: "1.10.2"});
    });

    it("scrobble() - Given a song, when I scrobble it, it returns true if there was no error", function() {
        var song = { id: 45872 };
        var url = 'http://demo.subsonic.com/rest/scrobble.view?' +
            'c=Jamstash&callback=JSON_CALLBACK&f=jsonp'+'&id=45872'+'&p=enc:cGFzc3dvcmQ%3D'+'&submisssion=true'+'&u=Hyzual&v=1.10.2';
        mockBackend.expectJSONP(url).respond(JSON.stringify(response));

        var promise = subsonic.scrobble(song);
        mockBackend.flush();

        expect(promise).toBeResolvedWith(true);
    });

    describe("getArtists() -", function() {
        var url;
        beforeEach(function() {
            url = 'http://demo.subsonic.com/rest/getIndexes.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        });

        it("Given that I have 2 artists at the top level, when I get the artists, it returns those 2 artists", function() {
            response["subsonic-response"].indexes = {
                shortcut: [
                    {
                        id: "8534",
                        name: "Podcast"
                    }
                ],
                index: [
                    {
                        name : "R",
                        artist: [
                            {
                                id: "5493",
                                name: "Ricki Perish"
                            }
                        ]
                    },
                    {
                        name : "T",
                        artist: [
                            {
                                id: "4934",
                                name: "Terese Hoth"
                            }
                        ]
                    }
                ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getArtists();
            mockBackend.flush();

            expect(promise).toBeResolvedWith(response["subsonic-response"].indexes);
        });

        it("When I get the artists of a given folder, it builds the correct url", function() {
            var url = 'http://demo.subsonic.com/rest/getIndexes.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp'+'&musicFolderId=42'+'&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            subsonic.getArtists(42);
            mockBackend.flush();
        });

        it("Given that I don't have any artist or shortcut in my library (empty server), when I get the artists, it returns an error object with a message", function() {
            response["subsonic-response"].indexes = {};
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getArtists();
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'No artist found on the Subsonic server.'});
        });
    });

    describe("getPlaylists() -", function() {
        var url, myPlaylist, publicPlaylist;
        beforeEach(function() {
            url = 'http://demo.subsonic.com/rest/getPlaylists.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
            publicPlaylist = {
                id: "563",
                owner: "Rima Zentz"
            };
            myPlaylist = {
                id: "829",
                owner: "Hyzual"
            };
        });

        it("Given that there is 1 public playlist and 1 playlist that I own in my library, when I get the playlists, it returns them separated between my playlists and public playlists", function() {
            response["subsonic-response"].playlists = {
                playlist: [ publicPlaylist, myPlaylist ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPlaylists();
            mockBackend.flush();

            expect(promise).toBeResolvedWith({
                playlists: [ myPlaylist ],
                playlistsPublic: [ publicPlaylist ]
            });
        });

        it("Given that there is only 1 playlist in my library and that I own it, when I get the playlists, it returns my playlist and an empty array for public playlists", function() {
            response["subsonic-response"].playlists = {
                playlist: [ myPlaylist ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPlaylists();
            mockBackend.flush();

            expect(promise).toBeResolvedWith({
                playlists: [ myPlaylist ],
                playlistsPublic: []
            });
        });

        it("Given that there is only 1 public playlist in my library and that I don't own it, when I get the playlists, it returns an empty array and the public playlist", function() {
            response["subsonic-response"].playlists = {
                playlist: [ publicPlaylist ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPlaylists();
            mockBackend.flush();

            expect(promise).toBeResolvedWith({
                playlists: [],
                playlistsPublic: [ publicPlaylist ]
            });
        });

        it("Given that I don't have any playlist in my library, when I get the playlists, it returns an error object with a message", function() {
            response["subsonic-response"].playlists = {};
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPlaylists();
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'No playlist found on the Subsonic server.'});
        });
    });

    describe("getPlaylist() -", function() {
        var url;
        beforeEach(function() {
            url = 'http://demo.subsonic.com/rest/getPlaylist.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        });

        it("Given a playlist with 2 songs in it, when I get it, it returns the 2 songs of the playlist", function() {
            url = 'http://demo.subsonic.com/rest/getPlaylist.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp'+'&id=9123'+'&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
            response["subsonic-response"].playlist = {
                id: 9123,
                entry: [
                    { id: 2860 },
                    { id: 4762 }
                ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPlaylist(9123);
            mockBackend.flush();

            expect(promise).toBeResolvedWith([
                { id: 2860 },
                { id: 4762 }
            ]);
        });

        it("Given that the playlist I want to get is empty (0 songs in it), when I get it, it returns an error object with a message", function() {
            response["subsonic-response"].playlist = {};
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPlaylist();
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'This playlist is empty.'});
        });
    });

    it("newPlaylist() - Given a name, when I create a new playlist, an empty resolved promise will be returned", function() {
        var url = 'http://demo.subsonic.com/rest/createPlaylist.view?'+
            'c=Jamstash&callback=JSON_CALLBACK&f=jsonp'+'&name=Apolloship'+'&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        mockBackend.expectJSONP(url).respond(JSON.stringify(response));

        var promise = subsonic.newPlaylist('Apolloship');
        mockBackend.flush();

        expect(promise).toBeResolved();
    });

    it("deletePlaylist() - Given a playlist id, when I delete that playlist, an empty resolved promise will be returned", function() {
        var url = 'http://demo.subsonic.com/rest/deletePlaylist.view?'+
            'c=Jamstash&callback=JSON_CALLBACK&f=jsonp'+'&id=7579'+'&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        mockBackend.expectJSONP(url).respond(JSON.stringify(response));

        var promise = subsonic.deletePlaylist(7579);
        mockBackend.flush();

        expect(promise).toBeResolved();
    });

    it("savePlaylist() - Given an array of songs and a playlist id, when I save that playlist, an empty resolved promise will be returned", function() {
        var url = 'http://demo.subsonic.com/rest/createPlaylist.view?'+
            'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D'+'&playlistId=7071'+
            '&songId=2801&songId=1002&songId=6612'+
            '&u=Hyzual&v=1.10.2';
        mockBackend.expectJSONP(url).respond(JSON.stringify(response));

        var songs = [
            { id: 2801 },
            { id: 1002 },
            { id: 6612 }
        ];
        var promise = subsonic.savePlaylist(7071, songs);
        mockBackend.flush();

        expect(promise).toBeResolved();
    });

    describe("getPodcasts() -", function() {
        var url;
        beforeEach(function() {
            url = 'http://demo.subsonic.com/rest/getPodcasts.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp'+'&includeEpisodes=false'+'&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        });

        it("Given that there were podcasts in the library, when I load the podcasts, then a promise will be resolved with an array of podcasts", function() {
            response["subsonic-response"].podcasts = {
                channel: [
                    { id: 7820 },
                    { id: 5174 },
                    { id: 2404 }
                ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPodcasts();
            mockBackend.flush();

            expect(promise).toBeResolvedWith([
                { id: 7820 },
                { id: 5174 },
                { id: 2404 }
            ]);
        });

        it("Given that there weren't any podcast in the library, when I load the podcasts, then a promise will be rejected with an error message", function() {
            response["subsonic-response"].podcasts = {};
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPodcasts();
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'No podcast found on the Subsonic server.'});
        });
    });

    describe("getPodcast() -", function() {
        var url;
        beforeEach(function() {
            url = 'http://demo.subsonic.com/rest/getPodcasts.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp'+'&id=2695&includeEpisodes=true'+'&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        });

        it("Given a podcast id, when I load that podcast, then a promise will be resolved with an array of songs from all the non-skipped episodes of that podcast", function() {
            response["subsonic-response"].podcasts = {
                channel: [
                    {
                        id: 2695,
                        episode: [
                            {
                                id: 691,
                                status: "completed"
                            }, {
                                id: 771,
                                status: "skipped"
                            }, {
                                id: 227,
                                status: "completed"
                            }
                        ]
                    }
                ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPodcast(2695);
            mockBackend.flush();

            expect(promise).toBeResolvedWith([
                {
                    id: 691,
                    status: "completed"
                }, {
                    id: 227,
                    status: "completed"
                }
            ]);
        });

        it("Given that the podcast I wanted to get didn't exist in the library, when I load that podcast, then a promise will be rejected with an error message", function() {
            response["subsonic-response"].podcasts = {};
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPodcast(2695);
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'This podcast was not found on the Subsonic server.'});
        });

        it("Given that the podcast I wanted to get was empty (0 non-skipped episode in it), when I load that podcast, then a promise will be rejected with an error message", function() {
            response["subsonic-response"].podcasts = {
                channel: [
                    {
                        id: 2695,
                        episode: [
                            {
                                id: 678,
                                status: "skipped"
                            },
                            {
                                id: 972,
                                status: "skipped"
                            }
                        ]
                    }
                ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.getPodcast(2695);
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'No downloaded episode found for this podcast. Please check the podcast settings.'});
        });
    });

    describe("search() -", function() {
        var url;
        beforeEach(function() {
            url = 'http://demo.subsonic.com/rest/search2.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D'+'&query=unintersetingly'+'&u=Hyzual&v=1.10.2';
        });

        it("Given that songs containing 'unintersetingly' existed in my library, when I search for a song that contains 'unintersetingly', then a promise will be resolved with an array of songs", function() {
            response["subsonic-response"].searchResult2 = {
                song: [
                    {
                        id: 2916,
                        name: "unintersetingly sleepyhead"
                    }, {
                        id: 489,
                        name: "unintersetingly Labyrinthula"
                    }
                ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.search("unintersetingly", 0);
            mockBackend.flush();

            expect(promise).toBeResolvedWith([
                {
                    id: 2916,
                    name: "unintersetingly sleepyhead"
                }, {
                    id: 489,
                    name: "unintersetingly Labyrinthula"
                }
            ]);
        });

        it("Given that no songs containing 'unintersetingly' existed in my library, when I search for a song that contains 'unintersetingly', then a promise will be rejected with an error message", function() {
            response["subsonic-response"].searchResult2 = {
                album: []
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.search("unintersetingly", 0);
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: "No results."});
        });

        it("Given that albums containing 'unintersetingly' existed in my library, when I search for an album that contains 'unintersetingly', then a promise will be resolved with an array of albums", function() {
            response["subsonic-response"].searchResult2 = {
                album: [
                    {
                        id: 434,
                        name: "Microtomical unintersetingly"
                    }, {
                        id: 150,
                        name: "unintersetingly assurance"
                    }
                ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.search("unintersetingly", 1);
            mockBackend.flush();

            expect(promise).toBeResolvedWith([
                {
                    id: 434,
                    name: "Microtomical unintersetingly"
                }, {
                    id: 150,
                    name: "unintersetingly assurance"
                }
            ]);
        });

        it("Given that no albums containing 'unintersetingly' existed in my library, when I search for an album that contains 'unintersetingly', then a promise will be rejected with an error message", function() {
            response["subsonic-response"].searchResult2 = {
                song: []
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.search("unintersetingly", 1);
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: "No results."});
        });

        it("Given that artists containing 'unintersetingly' existed in my library, when I search for an artist that contains 'unintersetingly', then a promise will be resolved with an array of artists", function () {
            response["subsonic-response"].searchResult2 = {
                artist: [
                    {
                        id: 52,
                        name: "unintersetingly overlaxly"
                    }, {
                        id: 77,
                        name: "Waybread unintersetingly"
                    }
                ]
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.search("unintersetingly", 2);
            mockBackend.flush();

            expect(promise).toBeResolvedWith([
                {
                    id: 52,
                    name: "unintersetingly overlaxly"
                }, {
                    id: 77,
                    name: "Waybread unintersetingly"
                }
            ]);
        });

        it("Given that no artists containing 'unintersetingly' existed in my library, when I search for an artist that contains 'unintersetingly', then a promise will be rejected with an error message", function() {
            response["subsonic-response"].searchResult2 = {
                song: []
            };
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.search("unintersetingly", 2);
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: "No results."});
        });

        it("Given that the library didn't contain anything containing 'unintersetingly', when I search for anything that contains 'unintersetingly', then a promise will be rejected with an error message", function() {
            response["subsonic-response"].searchResult2 = {};
            mockBackend.expectJSONP(url).respond(JSON.stringify(response));

            var promise = subsonic.search("unintersetingly", 0);
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: "No results."});
        });

        it("Given a search type that isn't 0 or 1 or 2, when I search for anything, Subsonic's API won't be called and a promise will be rejected with an error message", function() {
            var promise = subsonic.search("fading", 35);

            expect(promise).toBeRejectedWith({reason: "Wrong search type."});
        });
    });
});
