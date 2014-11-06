describe("Subsonic service -", function() {
	'use strict';

	var subsonic, mockBackend, mockGlobals;
	var response;
	// Spies
	var success, failure;

	var url = 'http://demo.subsonic.com/rest/getStarred.view?'+
			'callback=JSON_CALLBACK&u=Hyzual&p=enc:cGFzc3dvcmQ=&v=1.10.2&c=Jamstash&f=jsonp';

	beforeEach(function() {
		// We redefine it because in some tests we need to alter the settings
		mockGlobals = {
			settings: {
				AutoPlaylistSize: 3,
				Protocol: 'jsonp'
			},
			BaseURL: function () {
				return 'http://demo.subsonic.com/rest';
			},
			BaseParams: function () {
				return 'u=Hyzual&p=enc:cGFzc3dvcmQ=&v=1.10.2&c=Jamstash&f=jsonp';
			}
		};

		module('jamstash.subsonic.service', function ($provide) {
			$provide.value('globals', mockGlobals);
		});

		inject(function (_subsonic_, $httpBackend) {
			subsonic = _subsonic_;
			mockBackend = $httpBackend;
		});
		success = jasmine.createSpy('success');
		failure = jasmine.createSpy('failure');
		response = {"subsonic-response": {status: "ok", version: "1.10.2"}};
	});

	afterEach(function() {
		mockBackend.verifyNoOutstandingExpectation();
		mockBackend.verifyNoOutstandingRequest();
	});

	describe("getStarred -", function() {

		it("Given that I have 2 starred albums, 1 starred artist and 3 starred songs in my library, when getting everything starred, it returns them all", function() {
			response["subsonic-response"].starred = {artist: [{id: 2245}], album: [{id: 1799},{id: 20987}], song: [{id: 2478},{id: 14726},{id: 742}]};
			mockBackend.whenJSONP(url).respond(200, JSON.stringify(response));

			subsonic.getStarred().then(success);
			mockBackend.flush();

			expect(success).toHaveBeenCalledWith({artist: [{id: 2245}], album: [{id: 1799},{id: 20987}], song: [{id: 2478},{id: 14726},{id: 742}]});
		});

		it("Given that the global protocol setting is 'json' and given that I have 3 starred songs in my library, when getting everything starred, it uses GET and returns 3 starred songs", function() {
			mockGlobals.settings.Protocol = 'json';
			mockGlobals.BaseParams = function() { return 'u=Hyzual&p=enc:cGFzc3dvcmQ=&v=1.10.2&c=Jamstash&f=json'; };
			var getUrl = 'http://demo.subsonic.com/rest/getStarred.view?' +
				'u=Hyzual&p=enc:cGFzc3dvcmQ=&v=1.10.2&c=Jamstash&f=json';
			response["subsonic-response"].starred = {song: [{id: "2147"},{id:"9847"},{id:"214"}]};
			mockBackend.expectGET(getUrl).respond(200, JSON.stringify(response));

			subsonic.getStarred().then(success);
			mockBackend.flush();

			expect(success).toHaveBeenCalledWith({song: [{id: "2147"},{id:"9847"},{id:"214"}]});
		});

		it("Given that there is absolutely nothing starred in my library, when getting everything starred, it returns an error object with a message", function() {
			response["subsonic-response"].starred = {};
			mockBackend.whenJSONP(url).respond(200, JSON.stringify(response));

			subsonic.getStarred().then(success, failure);
			mockBackend.flush();

			expect(success).not.toHaveBeenCalled();
			expect(failure).toHaveBeenCalledWith({reason: 'Nothing is starred on the Subsonic server.'});
		});

		it("Given that the Subsonic server is not responding, when getting everything starred, it returns an error object with a message", function() {
			mockBackend.whenJSONP(url).respond(503, 'Service Unavailable');

			subsonic.getStarred().then(success, failure);
			mockBackend.flush();

			expect(success).not.toHaveBeenCalled();
			expect(failure).toHaveBeenCalledWith({reason: 'Error when contacting the Subsonic server.', httpError: 503});
		});

		it("Given a missing parameter, when getting the starred songs, it returns an error object with a message", function() {
			mockGlobals.BaseParams = function() { return 'u=Hyzual&v=1.10.2&c=Jamstash&f=jsonp';};
			var missingPasswordUrl = 'http://demo.subsonic.com/rest/getStarred.view?'+
				'callback=JSON_CALLBACK&u=Hyzual&v=1.10.2&c=Jamstash&f=jsonp';
			var errorResponse = {"subsonic-response" : {"status" : "failed","version" : "1.10.2","error" : {"code" : 10,"message" : "Required parameter is missing."}}};
			mockBackend.whenJSONP(missingPasswordUrl).respond(200, errorResponse);

			subsonic.getStarred().then(success, failure);
			mockBackend.flush();

			expect(success).not.toHaveBeenCalled();
			expect(failure).toHaveBeenCalledWith({reason: 'Error when contacting the Subsonic server.', subsonicError: {code: 10, message:'Required parameter is missing.'}});
		});
	}); //end getStarred

	describe("getRandomStarredSongs -", function() {
		describe("Given that the global setting AutoPlaylist Size is 3", function() {

			it("and given that I have more than 3 starred songs in my library, when getting random starred songs, the result should be limited to 3 starred songs", function() {
				var library = [{id: "11841"},{id: "12061"},{id: "17322"},{id: "1547"},{id: "14785"}];
				response["subsonic-response"].starred = {song: library};
				mockBackend.whenJSONP(url).respond(200, JSON.stringify(response));

				subsonic.getRandomStarredSongs().then(success);
				mockBackend.flush();

				expect(success).toHaveBeenCalled();
				var randomlyPickedSongs = success.calls.mostRecent().args[0];
				for (var i = 0; i < randomlyPickedSongs.length; i++) {
					expect(library).toContain(randomlyPickedSongs[i]);
				}
			});

			it("and given that I have only 1 starred song in my library, when getting random starred songs, it returns my starred song", function() {
				response["subsonic-response"].starred = {song: [{id: "11841"}]};
				mockBackend.whenJSONP(url).respond(200, JSON.stringify(response));

				subsonic.getRandomStarredSongs().then(success);
				mockBackend.flush();

				expect(success).toHaveBeenCalledWith([{id: "11841"}]);
			});

			it("and given that I don't have any starred song in my library, when getting random starred songs, it returns an error object with a message", function() {
				response["subsonic-response"].starred = {song: []};
				mockBackend.whenJSONP(url).respond(200, JSON.stringify(response));

				subsonic.getRandomStarredSongs().then(success, failure);
				mockBackend.flush();

				expect(success).not.toHaveBeenCalled();
				expect(failure).toHaveBeenCalledWith({reason: 'No starred songs found on the Subsonic server.'});
			});
		});
	});
});