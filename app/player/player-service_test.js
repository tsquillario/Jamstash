describe("Player service", function() {
    'use strict';

    var player;
    beforeEach(function() {
        module('jamstash.player.service');

        inject(function (_player_) {
            player = _player_;
        });
    });

    describe("Given that I have 3 songs in my playing queue", function() {

        beforeEach(function() {
            player.queue = [
                {
                    id: 6726,
                    name: 'Guarauno',
                    artist: 'Carlyn Pollack',
                    album: 'Arenig'
                }, {
                    id: 2452,
                    name: 'Michoacan',
                    artist: 'Lura Jeppsen',
                    album: 'dioptrical'
                }, {
                    id: 574,
                    name: 'Celtidaceae',
                    artist: 'Willard Steury',
                    album: 'redux'
                }
            ];

            spyOn(player, "play").and.stub();
        });

        describe("when I call nextTrack", function() {
            it("and no song is playing, it plays the first song", function() {
                player.nextTrack();

                expect(player.currentlyPlayingIndex).toBe(0);
                expect(player.play).toHaveBeenCalledWith(player.queue[0]);
            });

            it("and the first song is playing, it plays the second song", function() {
                player.currentlyPlayingIndex = 0;

                player.nextTrack();

                expect(player.currentlyPlayingIndex).toBe(1);
                expect(player.play).toHaveBeenCalledWith(player.queue[1]);
            });

            it("and the last song is playing, it does nothing", function() {
                player.currentlyPlayingIndex = 2;

                player.nextTrack();

                expect(player.currentlyPlayingIndex).toBe(2);
                expect(player.play).not.toHaveBeenCalled();
            });
        });

        describe("when I call previousTrack", function() {
            it("and no song is playing, it plays the first song", function() {
                player.previousTrack();

                expect(player.currentlyPlayingIndex).toBe(0);
                expect(player.play).toHaveBeenCalledWith(player.queue[0]);
            });

            it("and the first song is playing, it restarts the first song", function() {
                player.currentlyPlayingIndex = 0;

                player.previousTrack();

                expect(player.currentlyPlayingIndex).toBe(0);
                expect(player.play).toHaveBeenCalledWith(player.queue[0]);
            });

            it("and the last song is playing, it plays the second song", function() {
                player.currentlyPlayingIndex = 2;

                player.previousTrack();

                expect(player.currentlyPlayingIndex).toBe(1);
                expect(player.play).toHaveBeenCalledWith(player.queue[1]);
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

        it("when I play it, the song is marked as playing", function() {
            player.play(song);

            expect(song.playing).toBeTruthy();
        });

        it("when I restart playback, the song is still marked as playing", function() {
            song.playing = true;

            player.restart();

            expect(song.playing).toBeTruthy();
        });
    });

    describe("Given that there is no song in my playing queue", function() {

        beforeEach(function() {
            player.queue = [];
            player.currentlyPlayingIndex = -1;
            spyOn(player, "play").and.stub();
        });

        it("when I call nextTrack, it does nothing", function() {
            player.nextTrack();
            expect(player.play).not.toHaveBeenCalled();
            expect(player.currentlyPlayingIndex).toBe(-1);
        });

        it("when I call previousTrack, it does nothing", function() {
            player.previousTrack();
            expect(player.play).not.toHaveBeenCalled();
            expect(player.currentlyPlayingIndex).toBe(-1);
        });
    });
});
