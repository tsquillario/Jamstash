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
            BaseURL: function () {
                return 'http://demo.subsonic.com/rest';
            },
        };

        module('jamstash.subsonic.service', function ($provide) {
            $provide.value('globals', mockGlobals);
            // Mock the model service
            $provide.decorator('map', function ($delegate) {
                $delegate.mapSong = function (argument) {
                    return argument;
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

    describe("subsonicRequest -", function() {
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
            mockBackend.expectJSONP(missingPasswordUrl).respond(200, JSON.stringify(errorResponse));

            var promise = subsonic.subsonicRequest(partialUrl);
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'Error when contacting the Subsonic server.', subsonicError: {code: 10, message:'Required parameter is missing.'}});
        });

        it("Given a partialUrl that does not start with '/', it adds '/' before it and makes a correct request", function() {
            partialUrl = 'getStarred.view';
            mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

            subsonic.subsonicRequest(partialUrl);
            mockBackend.flush();
        });

        it("Given $http config params, it does not overwrite them", function() {
            partialUrl = 'scrobble.view';
            url ='http://demo.subsonic.com/rest/scrobble.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&id=75&p=enc:cGFzc3dvcmQ%3D&submission=false&u=Hyzual&v=1.10.2';
            mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

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
            mockBackend.expectGET(getUrl).respond(200, JSON.stringify(response));

            var promise = subsonic.subsonicRequest(partialUrl);
            mockBackend.flush();

            expect(promise).toBeResolvedWith({status: "ok", version: "1.10.2"});
        });
    });

    it("ping - when I ping Subsonic, it returns Subsonic's response, containing its REST API version", function() {
        var url = 'http://demo.subsonic.com/rest/ping.view?'+
            'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';
        mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

        var promise = subsonic.ping();
        mockBackend.flush();

        expect(promise).toBeResolvedWith({status: "ok", version: "1.10.2"});
    });

    it("scrobble - Given a song, when I scrobble it, it returns true if there was no error", function() {
        var song = { id: 45872 };
        var url = 'http://demo.subsonic.com/rest/scrobble.view?' +
            'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&id=45872&p=enc:cGFzc3dvcmQ%3D&submisssion=true&u=Hyzual&v=1.10.2';

        mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

        var promise = subsonic.scrobble(song);
        mockBackend.flush();

        expect(promise).toBeResolvedWith(true);
    });

    describe("getStarred -", function() {
        var url = 'http://demo.subsonic.com/rest/getStarred.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';

        it("Given that I have 2 starred albums, 1 starred artist and 3 starred songs in my library, when getting everything starred, it returns them all", function() {
            response["subsonic-response"].starred = {
                artist: [{id: 2245}],
                album: [{id: 1799},{id: 20987}],
                song: [{id: 2478},{id: 14726},{id: 742}]
            };
            mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

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
            mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

            var promise = subsonic.getStarred();
            mockBackend.flush();

            expect(promise).toBeRejectedWith({reason: 'Nothing is starred on the Subsonic server.'});
        });
    });

    describe("getRandomStarredSongs -", function() {
        var url = 'http://demo.subsonic.com/rest/getStarred.view?'+
                'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&u=Hyzual&v=1.10.2';

        describe("Given that the global setting AutoPlaylist Size is 3", function() {
            it("and given that I have more than 3 starred songs in my library, when getting random starred songs, it returns 3 starred songs", function() {
                var library = [
                    {id: 11841},{id: 12061},{id: 17322},{id: 1547},{id: 14785}
                ];
                response["subsonic-response"].starred = {song: library};
                mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

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
                mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

                var promise = subsonic.getRandomStarredSongs();
                mockBackend.flush();

                expect(promise).toBeResolvedWith([{id: 11841}]);
            });

            it("and given that I don't have any starred song in my library, when getting random starred songs, it returns an error object with a message", function() {
                response["subsonic-response"].starred = {song: []};
                mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

                var promise = subsonic.getRandomStarredSongs();
                mockBackend.flush();

                expect(promise).toBeRejectedWith({reason: 'No starred songs found on the Subsonic server.'});
            });
        });
    });

    describe("getRandomSongs -", function() {
        var url = 'http://demo.subsonic.com/rest/getRandomSongs.view?'+
            'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&p=enc:cGFzc3dvcmQ%3D&size=3&u=Hyzual&v=1.10.2';

        describe("Given that the global setting AutoPlaylist Size is 3", function() {
            it("and given that I have more than 3 songs in my library, when getting random songs, it returns 3 songs", function() {
                var library = [
                    {id: 1143},{id: 5864},{id: 7407},{id: 6471},{id: 59}
                ];
                response["subsonic-response"].randomSongs = {song: library};
                mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

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
                mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

                var promise = subsonic.getRandomSongs();
                mockBackend.flush();

                expect(promise).toBeResolvedWith([{id: 7793}]);
            });

            it("and given that I don't have any song in my library, when getting random songs, it returns an error object with a message", function() {
                response["subsonic-response"].randomSongs = {song: []};
                mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

                var promise = subsonic.getRandomSongs();
                mockBackend.flush();

                expect(promise).toBeRejectedWith({reason: 'No songs found on the Subsonic server.'});
            });

            it("and given a genre, when getting random songs, it returns 3 songs from the given genre", function() {
                url = 'http://demo.subsonic.com/rest/getRandomSongs.view?'+
                    'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&genre=Rock&p=enc:cGFzc3dvcmQ%3D&size=3&u=Hyzual&v=1.10.2';
                var library = [
                    {id: 9408},{id: 9470},{id: 6932}
                ];
                response["subsonic-response"].randomSongs = {song: library};
                mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

                var promise = subsonic.getRandomSongs('Rock');
                mockBackend.flush();

                expect(promise).toBeResolvedWith([{id: 9408},{id: 9470},{id: 6932}]);
            });

            it("and given a folder id, when getting random songs, it returns 3 songs from the given folder", function() {
                url = 'http://demo.subsonic.com/rest/getRandomSongs.view?'+
                    'c=Jamstash&callback=JSON_CALLBACK&f=jsonp&musicFolderId=2&p=enc:cGFzc3dvcmQ%3D&size=3&u=Hyzual&v=1.10.2';
                var library = [
                    {id: 9232},{id: 3720},{id: 8139}
                ];
                response["subsonic-response"].randomSongs = {song: library};
                mockBackend.expectJSONP(url).respond(200, JSON.stringify(response));

                var promise = subsonic.getRandomSongs('', 2);
                mockBackend.flush();

                expect(promise).toBeResolvedWith([{id: 9232},{id: 3720},{id: 8139}]);
            });
        });
    });
});
