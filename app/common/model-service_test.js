describe("model service", function() {
	'use strict';

	var model;
	beforeEach(function() {
		module('jamstash.model');
		inject(function (_model_) {
			model = _model_;
		});
	});

	it("given a name and artist, when calling Index() then the model name and artist are changed", function() {
		model.Index("CoolAlbum", "HipArtist");
		expect(model.name).toBe("CoolAlbum");
		expect(model.artist).toBe("HipArtist");
	});

	it("given all the arguments, when calling Song() then the composite attributes are computed", function() {
		model.Song(21, 43, 3, "Know Your Enemy", "Yoko Kanno", "27", "Ghost in the Shell - Stand Alone Complex OST 3",
			"51", "cover.jpg", "big-cover.jpg", "385", "5", true, "mp3", "specs", "url", "0", "Awesome track");

		expect(model.selected).toBe(false);
		expect(model.playing).toBe(false);
		expect(model.time).toBe("06:25");
		expect(model.displayName).toBe("Know Your Enemy - Ghost in the Shell - Stand Alone Complex OST 3 - Yoko Kanno");
	});
});