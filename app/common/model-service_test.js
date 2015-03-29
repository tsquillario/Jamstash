describe("model service", function() {
    'use strict';

    var model, map, utils;
    beforeEach(function() {
        module('jamstash.model', function ($provide) {
            $provide.decorator('utils', function ($delegate) {
                $delegate.formatDate = jasmine.createSpy("formatDate");
                return $delegate;
            });
        });
        inject(function (_model_, _map_, _utils_) {
            model = _model_;
            map = _map_;
            utils = _utils_;
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

    it("Given multiple songs, when I map them, then mapSong is called for each song", function() {
        var songs = [
            { id: 2912 },
            { id: 1450 },
            { id: 6663 }
        ];
        spyOn(map, 'mapSong').and.callFake(function (song) { return song; });

        var result = map.mapSongs(songs);
        expect(map.mapSong.calls.count()).toEqual(3);
        expect(map.mapSong).toHaveBeenCalledWith({id: 2912});
        expect(map.mapSong).toHaveBeenCalledWith({id: 1450});
        expect(map.mapSong).toHaveBeenCalledWith({id: 6663});
        expect(result).toEqual(songs);
    });

    it("Given multiple podcast episodes, when I map them, then mapPodcast is called for each episode", function() {
        var episodes = [
            { id: 63 },
            { id: 24 },
            { id: 80 }
        ];
        spyOn(map, 'mapPodcast').and.callFake(function (episode) { return episode; });

        var result = map.mapPodcasts(episodes);
        expect(map.mapPodcast.calls.count()).toEqual(3);
        expect(map.mapPodcast).toHaveBeenCalledWith({ id: 63 });
        expect(map.mapPodcast).toHaveBeenCalledWith({ id: 24 });
        expect(map.mapPodcast).toHaveBeenCalledWith({ id: 80 });
        expect(result).toEqual(episodes);
    });

    it("Given album data without artist info, when I map it to an Album, an Album with an empty artist name will be returned", function() {
        var albumData = {
            id: 584,
            artist: undefined,
            created: "2015-03-28T16:51:28.000Z"
        };

        var result = map.mapAlbum(albumData);
        expect(result.artist).toEqual('');
    });

    it("Given multiple albums, when I map them, then mapAlbum is called for each album", function() {
        var albums = [
            { id: 941 },
            { id: 967 },
            { id: 545 }
        ];
        spyOn(map, 'mapAlbum').and.callFake(function (album) { return album; });

        var result = map.mapAlbums(albums);
        expect(map.mapAlbum.calls.count()).toEqual(3);
        expect(map.mapAlbum).toHaveBeenCalledWith({ id: 941 });
        expect(map.mapAlbum).toHaveBeenCalledWith({ id: 967 });
        expect(map.mapAlbum).toHaveBeenCalledWith({ id: 545 });
        expect(result).toEqual(albums);
    });
});
