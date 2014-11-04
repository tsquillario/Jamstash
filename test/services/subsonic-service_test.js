describe("subsonic service -", function() {
	'use strict';

	var subsonic, mockBackend;

	describe("Given that the global setting AutoPlaylist Size is 3", function() {
		var mockGlobals = {
			settings: {
				AutoPlaylistSize: 3,
				protocol: 'jsonp'
			},
			BaseURL: function () {
				return 'http://subsonic.furinax.com/rest';
			},
			BaseParams: function () {
				return 'u=Hyzual&p=enc:7375622e6461726b353079306432&v=1.10.2&c=Jamstash&f=jsonp';
			}
		};

		beforeEach(function() {
			module('JamStash', function ($provide) {
				$provide.value('globals', mockGlobals);
			});

			inject(function (_subsonic_, $httpBackend) {
				subsonic = _subsonic_;
				mockBackend = $httpBackend;
			});
		});

		afterEach(function() {
			mockBackend.verifyNoOutstandingExpectation();
			mockBackend.verifyNoOutstandingRequest();
		});

		it("and given that I have more than 3 starred songs in my library, when getting the starred artists, the result should be limited to 3 starred artists", function() {

			var url = 'http://subsonic.furinax.com/rest/getStarred.view?'+
				'callback=JSON_CALLBACK&u=Hyzual&p=enc:7375622e6461726b353079306432&v=1.10.2&c=Jamstash&f=jsonp';
			var response = '{"subsonic-response": {"status": "ok","version": "1.10.2","starred": {"song": [{"id": "11841"},{"id": "12061"},{"id": "17322"},{"id": "1547"}]}}}';

			var limitedStarred = [{id: "11841"},{id: "12061"},{id: "17322"}];
			mockBackend.whenJSONP(url).respond(200, response);
			var success = jasmine.createSpy('success');

			subsonic.getStarred().then(success);
			mockBackend.flush();
			expect(success).toHaveBeenCalledWith(limitedStarred);
		});
	});
});