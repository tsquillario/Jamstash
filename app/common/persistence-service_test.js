describe("Persistence service", function() {
    'use strict';

    var persistence, player, notifications, locker,
        song, fakeStorage;
    beforeEach(function() {
        module('jamstash.persistence', function ($provide) {
            // Mock locker
            $provide.decorator('locker', function () {
                return jasmine.createSpyObj("locker", ["get", "put", "forget"]);
            });
            $provide.constant("jamstashVersion", "1.0.1");
        });

        inject(function (_persistence_, _player_, _notifications_, _locker_) {
            persistence = _persistence_;
            player = _player_;
            notifications = _notifications_;
            locker = _locker_;
        });

        song = {
            id: 8626,
            name: 'Pectinatodenticulate',
            artist: 'Isiah Hosfield',
            album: 'Tammanyize'
        };
        player.queue = [];

        fakeStorage = {};

        locker.get.and.callFake(function(key) {
            return fakeStorage[key];
        });
    });

    describe("loadTrackPosition() -", function() {
        beforeEach(function() {
            spyOn(player, "load");
        });

        it("Given a previously saved song in local storage, when I load the song, the player will load it", function() {
            fakeStorage = { 'CurrentSong': song };

            persistence.loadTrackPosition();

            expect(locker.get).toHaveBeenCalledWith('CurrentSong');
            expect(player.load).toHaveBeenCalledWith(song);
        });

        it("Given that no song was previously saved in local storage, it doesn't do anything", function() {
            persistence.loadTrackPosition();
            expect(locker.get).toHaveBeenCalledWith('CurrentSong');
            expect(player.load).not.toHaveBeenCalled();
        });
    });

    it("saveTrackPosition() - saves the current track's position in local storage", function() {
        persistence.saveTrackPosition(song);
        expect(locker.put).toHaveBeenCalledWith('CurrentSong', song);
    });

    it("deleteTrackPosition() - deletes the current track from local storage", function() {
        persistence.deleteTrackPosition();
        expect(locker.forget).toHaveBeenCalledWith('CurrentSong');
    });

    describe("loadQueue() -", function() {
        beforeEach(function() {
            spyOn(notifications, "updateMessage");
            spyOn(player, "addSongs").and.callFake(function (songs) {
                // Update the queue length so that notifications work
                player.queue.length += songs.length;
            });
        });

        it("Given a previously saved queue in local storage, when I load the queue, the player's queue will be filled with the retrieved queue and the user will be notified", function() {
            var queue = [
                { id: 8705 },
                { id: 1617 },
                { id: 9812 }
            ];
            fakeStorage = { 'CurrentQueue': queue };

            persistence.loadQueue();

            expect(locker.get).toHaveBeenCalledWith('CurrentQueue');
            expect(player.addSongs).toHaveBeenCalledWith(queue);
            expect(notifications.updateMessage).toHaveBeenCalledWith('3 Saved Song(s)', true);
        });

        it("Given that no queue was previously saved in local storage, when I load the queue, the player's queue will stay the same and no notification will be displayed", function() {
            persistence.loadQueue();

            expect(locker.get).toHaveBeenCalledWith('CurrentQueue');
            expect(player.addSongs).not.toHaveBeenCalled();
            expect(notifications.updateMessage).not.toHaveBeenCalled();
        });
    });

    it("saveQueue() - saves the playing queue in local storage", function() {
        player.queue = [
            { id: 1245 },
            { id: 7465 },
            { id: 948 }
        ];
        persistence.saveQueue();
        expect(locker.put).toHaveBeenCalledWith('CurrentQueue', player.queue);
    });

    it("deleteQueue() - deletes the saved playing queue from local storage", function() {
        persistence.deleteQueue();
        expect(locker.forget).toHaveBeenCalledWith('CurrentQueue');
    });

    describe("getVolume() -", function() {
        it("Given a previously saved volume value in local storage, it retrieves it", function() {
            fakeStorage = { 'Volume': 0.46582 };

            var volume = persistence.getVolume();

            expect(locker.get).toHaveBeenCalledWith('Volume');
            expect(volume).toBe(0.46582);
        });

        it("Given that no volume value was previously saved in local storage, it returns undefined", function() {
            var volume = persistence.getVolume();

            expect(locker.get).toHaveBeenCalledWith('Volume');
            expect(volume).toBeUndefined();
        });
    });

    it("saveVolume() - given a volume, it will be saved in local storage", function() {
        persistence.saveVolume(0.05167);
        expect(locker.put).toHaveBeenCalledWith('Volume', 0.05167);
    });

    it("deleteVolume() - deletes the saved volume from local storage", function() {
        persistence.deleteVolume();
        expect(locker.forget).toHaveBeenCalledWith('Volume');
    });

    describe("getSettings() -", function() {
        it("Given previously saved user settings in local storage, it retrieves them", function() {
            fakeStorage = {
                "Settings": {
                    "url": "https://headed.com/aleurodidae/taistrel?a=roquet&b=trichophoric#cathole",
                    "Username": "Haupert"
                }
            };

            var settings = persistence.getSettings();

            expect(locker.get).toHaveBeenCalledWith('Settings');
            expect(settings).toEqual({
                "url": "https://headed.com/aleurodidae/taistrel?a=roquet&b=trichophoric#cathole",
                "Username": "Haupert"
            });
        });

        it("Given that the previously stored Jamstash version was '1.0.0' and given the current constant jamstash.version was '1.0.1', when I get the settings, then upgradeToVersion will be called", function() {
            spyOn(persistence, 'upgradeToVersion');

            persistence.getSettings();

            expect(persistence.upgradeToVersion).toHaveBeenCalledWith('1.0.1');
        });

        it("Given that no user settings had been saved in local storage, it returns undefined", function() {
            var settings = persistence.getSettings();

            expect(locker.get).toHaveBeenCalledWith('Settings');
            expect(settings).toBeUndefined();
        });
    });

    it("saveSettings() - given a user settings object, it will be saved in local storage", function() {
        persistence.saveSettings({
            "url": "http://crotalic.com/cabernet/coelenteron?a=dayshine&b=pantaletless#sus",
            "Username": "Herrig"
        });
        expect(locker.put).toHaveBeenCalledWith('Settings', {
            "url": "http://crotalic.com/cabernet/coelenteron?a=dayshine&b=pantaletless#sus",
            "Username": "Herrig"
        });
    });

    it("deleteSettings() - deletes the saved user settings from local storage", function() {
        persistence.deleteSettings();
        expect(locker.forget).toHaveBeenCalledWith('Settings');
    });

    describe("upgradeToVersion() -", function() {
        describe("Given that Jamstash version '1.0.0' was previously stored in local storage,", function() {
            beforeEach(function() {
                fakeStorage.version = '1.0.0';
            });

            it("when I upgrade the storage version to '1.0.1', Jamstash version '1.0.1' will be in local storage", function() {
                persistence.upgradeToVersion('1.0.1');
                expect(locker.put).toHaveBeenCalledWith('version', '1.0.1');
            });

            it("that settings.DefaultSearchType was stored as an object and that a changeset for version '4.4.5' was defined that changes it to an int, when I upgrade the storage version to '4.4.5', settings.DefaultSearch will be stored as an int", function() {
                fakeStorage = {
                    Settings: {
                        DefaultSearchType: {
                            id: "song",
                            name: "Song"
                        }
                    }
                };
                persistence.upgradeToVersion('4.4.5');
                expect(locker.put).toHaveBeenCalledWith('Settings', {
                    DefaultSearchType: 0
                });
            });
        });
    });
});
