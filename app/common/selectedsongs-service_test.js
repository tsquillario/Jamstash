// jscs:disable validateQuoteMarks
describe("SelectedSongs service -", function () {
    'use strict';

    var SelectedSongs;
    beforeEach(function () {
        module('jamstash.selectedsongs');

        inject(function (_SelectedSongs_) {
            SelectedSongs = _SelectedSongs_;
        });
    });

    describe("add() -", function () {
        it("Given that there weren't any selected songs and given a song, when I add it to the selected songs, then the song's selected property will be true and the service itself will be returned to allow chaining", function () {
            var song = { id: 237 };

            var result = SelectedSongs.add(song);

            expect(SelectedSongs.get()).toEqual([
                { id: 237, selected: true }
            ]);
            expect(result).toBe(SelectedSongs);
        });

        it("Given that there were already 2 selected songs and given a different song, when I add it then the third song will be appended to the end of the selected songs", function () {
            var firstSong  = { id: 6162 },
                secondSong = { id: 479 },
                thirdSong  = { id: 25 };
            SelectedSongs.add(firstSong).add(secondSong);

            SelectedSongs.add(thirdSong);

            expect(SelectedSongs.get()).toEqual([
                { id: 6162, selected: true },
                { id: 479, selected: true },
                { id: 25, selected: true }
            ]);
        });

        it("Given that I already added 2 songs, when I try to add again the first song to the selected songs, then the new duplicate song won't be added and the selected songs will only contain the first 2 songs", function () {
            var firstSong  = { id: 8146 },
                secondSong = { id: 4883 };
            SelectedSongs.add(firstSong).add(secondSong);

            SelectedSongs.add(firstSong);

            expect(SelectedSongs.get()).toEqual([
                { id: 8146, selected: true },
                { id: 4883, selected: true }
            ]);
        });
    });

    describe("addSongs() -", function () {
        it("Given that there weren't any selected songs and given an array of 2 songs, when I add them, then the songs will be added to the selected songs, each song's selected property will be true and the service itself will be returned to allow chaining", function () {
            var songs = [
                { id: 4236 },
                { id: 8816 }
            ];

            var result = SelectedSongs.addSongs(songs);

            expect(SelectedSongs.get()).toEqual([
                { id: 4236, selected: true },
                { id: 8816, selected: true }
            ]);
            expect(result).toBe(SelectedSongs);
        });

        it("Given that there were already 2 selected songs and given 2 different songs, when I add them, then the songs will be appended to the end of the selected songs", function () {
            var firstSongs = [
                { id: 9539 },
                { id: 8253 }
            ];
            SelectedSongs.addSongs(firstSongs);

            SelectedSongs.addSongs([
                { id: 9130 },
                { id: 6491 }
            ]);

            expect(SelectedSongs.get()).toEqual([
                { id: 9539, selected: true },
                { id: 8253, selected: true },
                { id: 9130, selected: true },
                { id: 6491, selected: true }
            ]);
        });

        it("Given that there were already 2 selected songs and given the same 2 songs, when I try to add them again, then the two duplicate songs won't be added and the selected songs will only contain the first 2 songs", function () {
            var firstSongs = [
                { id: 954 },
                { id: 3526 }
            ];
            SelectedSongs.addSongs(firstSongs);

            SelectedSongs.addSongs(firstSongs);

            expect(SelectedSongs.get()).toEqual([
                { id: 954, selected: true },
                { id: 3526, selected: true }
            ]);
        });
    });

    describe("remove() -", function () {
        it("Given that there were 2 selected songs, when I remove the second song, then the remove song's selected property will be false, the selected songs will be an array containing the first song and the service itself will be returned to allow chaining", function () {
            var firstSong  = { id: 833 },
                secondSong = { id: 8775 };
            SelectedSongs.add(firstSong, secondSong);

            var result = SelectedSongs.remove(secondSong);

            expect(SelectedSongs.get()).toEqual([
                { id: 833, selected: true }
            ]);
            expect(secondSong.selected).toBeFalsy();
            expect(result).toBe(SelectedSongs);
        });

        it("Given that there was only 1 selected song, when I remove it, then the selected songs will be an empty array", function () {
            var song = { id: 347 };
            SelectedSongs.add(song);

            SelectedSongs.remove(song);

            expect(song.selected).toBeFalsy();
            expect(SelectedSongs.get()).toEqual([]);
        });
    });

    describe("toggle() - ", function () {
        it("Given a selected song, when I toggle its selection, then the song will no longer be selected and the service itself will be returned to allow chaining", function () {
            var song = { id: 1998, selected: true };
            SelectedSongs.add(song);

            var result = SelectedSongs.toggle(song);

            expect(SelectedSongs.get()).toEqual([]);
            expect(song.selected).toBeFalsy();
            expect(result).toBe(SelectedSongs);
        });

        it("Given a song that isn't selected, when I toggle its selection, then the song will be selected", function () {
            var song = { id: 6210 };

            SelectedSongs.toggle(song);

            expect(SelectedSongs.get()).toEqual([
                { id: 6210, selected: true }
            ]);
        });
    });

    describe("reset() -", function () {
        it("Given that there were 2 selected songs, when I reset the selected songs, then each song's selected property will be false, the selected songs will be an empty array and the service itself will be returned to allow chaining", function () {
            var firstSong  = { id: 8825 },
                secondSong = { id: 6034 };
            SelectedSongs.add(firstSong).add(secondSong);

            var result = SelectedSongs.reset();

            expect(SelectedSongs.get()).toEqual([]);
            expect(firstSong.selected).toBeFalsy();
            expect(secondSong.selected).toBeFalsy();
            expect(result).toBe(SelectedSongs);
        });

        it("Given that there weren't any selected songs, when I reset thems, then the selected songs will be an empty array", function () {
            SelectedSongs.reset();

            expect(SelectedSongs.get()).toEqual([]);
        });
    });
});
