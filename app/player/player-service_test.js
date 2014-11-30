describe("Player service", function() {
    'use strict';

    var player, $rootScope;
    beforeEach(function() {
        module('jamstash.player.service');

        inject(function (_player_, _$rootScope_) {
            player = _player_;
            $rootScope = _$rootScope_;
        });
    });

    describe("Given that I have 3 songs in my playing queue", function() {

        beforeEach(function() {
            $rootScope.queue = [
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
            spyOn(player, "playSong").and.stub();
            spyOn(player, "restartSong").and.stub();
        });

        describe("when I call nextTrack", function() {
            it("and no song is playing, it plays the first song", function() {
                player.nextTrack();

                expect(player.playSong).toHaveBeenCalled();
            });

            it("and the first song is playing, it plays the second song", function() {
                $rootScope.queue[0].playing = true;

                player.nextTrack();

                expect(player.playSong).toHaveBeenCalled();
            });

            it("and the last song is playing, it does nothing", function() {
                $rootScope.queue[2].playing = true;

                player.nextTrack();

                expect(player.playSong).not.toHaveBeenCalled();
            });
        });

        describe("when I call previousTrack", function() {
            it("and no song is playing, it plays the first song", function() {
                player.previousTrack();

                expect(player.restartSong).toHaveBeenCalled();
            });

            it("and the first song is playing, it restarts the first song", function() {
                $rootScope.queue[0].playing = true;

                player.previousTrack();

                expect(player.restartSong).toHaveBeenCalled();
            });

            it("and the last song is playing, it plays the seconde song", function() {
                $rootScope.queue[2].playing = true;

                player.previousTrack();

                expect(player.playSong).toHaveBeenCalled();
            });
        });
    });
});
