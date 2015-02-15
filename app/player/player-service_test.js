describe("Player service -", function() {
    'use strict';

    var player, mockGlobals, firstSong, secondSong, thirdSong, newSong;
    beforeEach(function() {
        // We redefine globals because in some tests we need to alter the settings
        mockGlobals = {
            settings: {
                Repeat: false,
                LoopQueue: false
            }
        };
        module('jamstash.player.service', function ($provide) {
            $provide.value('globals', mockGlobals);
        });
        inject(function (_player_) {
            player = _player_;
        });
    });

    describe("Given that I have 3 songs in my playing queue,", function() {

        beforeEach(function() {
            firstSong = {
                id: 6726,
                name: 'Guarauno',
                artist: 'Carlyn Pollack',
                album: 'Arenig'
            };
            secondSong = {
                id: 2452,
                name: 'Michoacan',
                artist: 'Lura Jeppsen',
                album: 'dioptrical'
            };
            thirdSong = {
                id: 574,
                name: 'Celtidaceae',
                artist: 'Willard Steury',
                album: 'redux'
            };
            player.queue = [firstSong, secondSong, thirdSong];
            newSong = {
                id: 3573,
                name: 'Tritopatores',
                artist: 'Alysha Rocher',
                album: 'uncombinably'
            };
        });

        describe("when I call nextTrack", function() {
            beforeEach(function() {
                spyOn(player, "play");
            });

            it("and no song is playing, it plays the first song", function() {
                player.nextTrack();

                expect(player._playingIndex).toBe(0);
                expect(player.play).toHaveBeenCalledWith(player.queue[0]);
            });

            it("and the first song is playing, it plays the second song", function() {
                player._playingIndex = 0;
                player._playingSong = firstSong;

                player.nextTrack();

                expect(player._playingIndex).toBe(1);
                expect(player.play).toHaveBeenCalledWith(player.queue[1]);
            });

            it("and the last song is playing, it does nothing", function() {
                player._playingIndex = 2;
                player._playingSong = thirdSong;

                player.nextTrack();

                expect(player._playingIndex).toBe(2);
                expect(player.play).not.toHaveBeenCalled();
            });
        });

        describe("when I call previousTrack", function() {
            beforeEach(function() {
                spyOn(player, "play");
            });

            it("and no song is playing, it plays the first song", function() {
                player.previousTrack();

                expect(player._playingIndex).toBe(0);
                expect(player.play).toHaveBeenCalledWith(player.queue[0]);
            });

            it("and the first song is playing, it restarts the first song", function() {
                player._playingIndex = 0;
                player._playingSong = firstSong;

                player.previousTrack();

                expect(player._playingIndex).toBe(0);
                expect(player.play).toHaveBeenCalledWith(player.queue[0]);
            });

            it("and the last song is playing, it plays the second song", function() {
                player._playingIndex = 2;
                player._playingSong = thirdSong;

                player.previousTrack();

                expect(player._playingIndex).toBe(1);
                expect(player.play).toHaveBeenCalledWith(player.queue[1]);
            });
        });

        it("when I call playFirstSong, it plays the first song and updates the playing index", function() {
            spyOn(player, "play");

            player.playFirstSong();

            expect(player._playingIndex).toBe(0);
            expect(player.play).toHaveBeenCalledWith(player.queue[0]);
        });

        it("when I play the second song, it finds its index in the playing queue and updates the playing index", function() {
            player.play(secondSong);
            expect(player._playingIndex).toBe(1);
        });

        it("when I play a song that isn't in the playing queue, the next song will be the first song of the playing queue", function() {
            player.play(newSong);
            expect(player._playingIndex).toBe(-1);
        });

        it("when I call emptyQueue, it empties the playing queue", function() {
            player.emptyQueue();
            expect(player.queue).toEqual([]);
        });

        it("when I get the index of the first song, it returns 0", function() {
            expect(player.indexOfSong(firstSong)).toBe(0);
        });

        it("when I get the index of a song that isn't in the playing queue, it returns undefined", function() {
            expect(player.indexOfSong(newSong)).toBeUndefined();
        });

        it("when I add a song to the queue, it is appended to the end of the playing queue", function() {
            player.addSong(newSong);
            expect(player.queue).toEqual([firstSong, secondSong, thirdSong, newSong]);
        });

        it("when I add 3 songs to the queue, they are appended to the end of the playing queue", function() {
            var secondNewSong = {id: 6338, name: 'Preconquest', artist: 'France Wisley', album: 'Unmix'};
            var thirdNewSong = {id: 3696, name: 'Cetene', artist: 'Hilario Masley', album: 'Gonapophysal'};
            player.addSongs([newSong, secondNewSong, thirdNewSong]);
            expect(player.queue).toEqual([firstSong, secondSong, thirdSong, newSong, secondNewSong, thirdNewSong]);
        });

        it("when I remove the second song, the playing queue is now only the first and third song", function() {
            player.removeSong(secondSong);
            expect(player.queue).toEqual([firstSong, thirdSong]);
        });

        it("when I remove the first and third songs, the playing queue is now only the second song", function() {
            player.removeSongs([firstSong, thirdSong]);
            expect(player.queue).toEqual([secondSong]);
        });

        it("when the first song is playing, isLastSongPlaying returns false", function() {
            player._playingIndex = 0;
            expect(player.isLastSongPlaying()).toBeFalsy();
        });

        it("when the third song is playing, isLastSongPlaying returns true", function() {
            player._playingIndex = 2;
            expect(player.isLastSongPlaying()).toBeTruthy();
        });

        it("and the current song is not the last, when the current song ends, it plays the next song in queue", function() {
            spyOn(player, "nextTrack");
            player._playingIndex = 0;

            player.songEnded();

            expect(player.nextTrack).toHaveBeenCalled();
        });

        it("and that the 'Repeat song' setting is true, when the current song ends, it restarts it", function() {
            spyOn(player, "restart");
            mockGlobals.settings.Repeat = true;

            player.songEnded();

            expect(player.restart).toHaveBeenCalled();
        });

        describe("and the current song is the last of the queue, when the current song ends,", function() {
            beforeEach(function() {
                player._playingIndex = 2;
            });

            it("if the 'Repeat queue' setting is true, it plays the first song of the queue", function() {
                spyOn(player, "playFirstSong");
                mockGlobals.settings.LoopQueue = true;

                player.songEnded();

                expect(player.playFirstSong).toHaveBeenCalled();
            });

            it("it does not play anything", function() {
                spyOn(player, "nextTrack").and.callThrough();
                player.songEnded();

                expect(player._playingIndex).toBe(2);
                expect(player.nextTrack).not.toHaveBeenCalled();
            });
        });
    });

    describe("Given a song", function() {

        var song;
        beforeEach(function() {
            song = {
                id: 6726,
                name: 'Guarauno',
                artist: 'Carlyn Pollack',
                album: 'Arenig',
                playing: false
            };
        });

        it("when the song was playing and I play it again, it restarts the current song", function() {
            spyOn(player, "restart");

            player.play(song);
            player.play(song);

            expect(player.restart).toHaveBeenCalled();
        });

        it("when I restart the current song, the flag for the directive is set", function() {
            player.restart();
            expect(player.restartSong).toBeTruthy();
        });

        it("when I load the song, the flag for the directive is set", function() {
            spyOn(player, "play");

            player.load(song);

            expect(player.loadSong).toBeTruthy();
            expect(player.play).toHaveBeenCalledWith(song);
        });
    });

    describe("Given that my playing queue is empty", function() {

        beforeEach(function() {
            player.queue = [];
            player._playingIndex = -1;
            spyOn(player, "play");
        });

        it("when I call nextTrack, it does nothing", function() {
            player.nextTrack();
            expect(player.play).not.toHaveBeenCalled();
            expect(player._playingIndex).toBe(-1);
        });

        it("when I call previousTrack, it does nothing", function() {
            player.previousTrack();
            expect(player.play).not.toHaveBeenCalled();
            expect(player._playingIndex).toBe(-1);
        });
    });

    describe("When I turn the volume up,", function() {
        it("it sets the player's volume up by 10%", function() {
            player.setVolume(0.5);
            player.turnVolumeUp();
            expect(player.getVolume()).toBe(0.6);
        });

        it("if the player's resulting volume won't be between 0 and 1, it sets it to 1", function() {
            player.setVolume(5.91488);
            player.turnVolumeUp();
            expect(player.getVolume()).toBe(1.0);
        });
    });

    describe("When I turn the volume down,", function() {
        it("it sets the player's volume down by 10%", function() {
            player.setVolume(0.5);
            player.turnVolumeDown();
            expect(player.getVolume()).toBe(0.4);
        });

        it("if the player's resulting volume won't be between 0 and 1, it sets it to 0", function() {
            player.setVolume(0.05);
            player.turnVolumeDown();
            expect(player.getVolume()).toBe(0);
        });
    });
});
