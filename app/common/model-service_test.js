describe("model service", function() {
	'use strict';

	var model, map;
	beforeEach(function() {
		module('jamstash.model');
		inject(function (_model_, _map_) {
			model = _model_;
            map = _map_;
		});
	});

	it("given all the arguments, when calling Song() then the composite attributes are computed", function() {
		model.Song(21, 43, 3, "Know Your Enemy", "Yoko Kanno", "27", "Ghost in the Shell - Stand Alone Complex OST 3",
			"51", "cover.jpg", "big-cover.jpg", "385", "5", true, "mp3", "specs", "url", "0", "Awesome track");

		expect(model.selected).toBe(false);
		expect(model.playing).toBe(false);
		expect(model.time).toBe("06:25");
		expect(model.displayName).toBe("Know Your Enemy - Ghost in the Shell - Stand Alone Complex OST 3 - Yoko Kanno");
	});

    it("Given multiple songs, when I map them, it calls mapSong for each song", function() {
        var songs = [
            {id: 2912},
            {id: 1450},
            {id: 6663}
        ];
        spyOn(map, 'mapSong').and.callFake(function (song) { return song; });

        var result = map.mapSongs(songs);
        expect(map.mapSong.calls.count()).toEqual(3);
        expect(map.mapSong).toHaveBeenCalledWith({id: 2912});
        expect(map.mapSong).toHaveBeenCalledWith({id: 1450});
        expect(map.mapSong).toHaveBeenCalledWith({id: 6663});
        expect(result).toEqual(songs);
    });
});
