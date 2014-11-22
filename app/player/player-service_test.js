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

    describe("nextTrack -", function() {

        it("Given that I have 3 songs in my playing queue and no song is playing, it plays the first song", function() {
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

            player.nextTrack();

            expect($rootScope.queue[0].playing).toBeTruthy();
        });
    });
});
