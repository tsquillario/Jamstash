describe("Persistence service", function() {
    'use strict';

    var persistence, player, notifications, locker, json,
        song, fakeStorage, fakeVersionChangesets;
    beforeEach(function() {
        fakeVersionChangesets = {versions: []};
        module('jamstash.persistence', function ($provide) {
            // Mock locker
            $provide.decorator('locker', function () {
                return jasmine.createSpyObj("locker", ["get", "put", "forget"]);
            });
            $provide.value("jamstashVersionChangesets", fakeVersionChangesets);

            $provide.decorator('notifications', function () {
                return jasmine.createSpyObj("notifications", ["updateMessage"]);
            });

            $provide.decorator('player', function () {
                var fakePlayer = jasmine.createSpyObj("player", ["load", "addSongs"]);
                fakePlayer.queue = [];
                return fakePlayer;
            });

            $provide.decorator('json', function () {
                return jasmine.createSpyObj("json", ["getChangeLog"]);
            });
        });

        inject(function (_persistence_, _player_, _notifications_, _locker_, _json_) {
            persistence = _persistence_;
            player = _player_;
            notifications = _notifications_;
            locker = _locker_;
            json = _json_;
        });

        song = {
            id: 8626,
            name: 'Pectinatodenticulate',
            artist: 'Isiah Hosfield',
            album: 'Tammanyize'
        };
        fakeStorage = {};

        locker.get.and.callFake(function(key) {
            return fakeStorage[key];
        });
        locker.put.and.callFake(function(key, value) {
            fakeStorage[key] = value;
        });
    });

    describe("loadTrackPosition() -", function() {
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
            player.addSongs.and.callFake(function (songs) {
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

        it("Given that no volume value was previously saved in local storage, it will return 1.0 and set it in local storage", function() {
            var volume = persistence.getVolume();

            expect(locker.get).toHaveBeenCalledWith('Volume');
            expect(volume).toBe(1.0);
            expect(locker.put).toHaveBeenCalledWith('Volume', 1.0);
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
        beforeEach(function() {
            spyOn(persistence, 'upgradeVersion');
            json.getChangeLog.and.callFake(function (callback) {
                callback([
                    {version: '1.0.1'}
                ]);
            });
            fakeStorage.JamstashVersion = '1.0.1';
        });

        it("Given previously saved user settings in local storage, a promise will be resovled with the user settings", function() {
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

        it("Given that the previously stored Jamstash version was '1.0.0' and given the latest version in changelog.json was '1.0.1', when I get the settings, then upgradeVersion will be called", function() {
            fakeStorage.JamstashVersion = '1.0.0';

            persistence.getSettings();

            expect(persistence.upgradeVersion).toHaveBeenCalledWith('1.0.0', '1.0.1');
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

    describe("getVersion() -", function() {
        it("Given a previously saved Jamstash version in local storage, it retrieves it", function() {
            fakeStorage = { 'JamstashVersion': '1.2.5' };

            var version = persistence.getVersion();

            expect(locker.get).toHaveBeenCalledWith('JamstashVersion');
            expect(version).toBe('1.2.5');
        });

        it("Given that no Jamstash version was previously saved in local storage, it returns undefined", function() {
            var version = persistence.getVersion();

            expect(locker.get).toHaveBeenCalledWith('JamstashVersion');
            expect(version).toBeUndefined();
        });
    });

    describe("upgradeVersion() -", function() {
        it("Given that Jamstash version '1.0.0' was previously stored in local storage, when I upgrade the storage version to '1.0.1', Jamstash version '1.0.1' will be in local storage and the user will be notified", function() {
            fakeStorage.JamstashVersion = '1.0.0';

            persistence.upgradeVersion('1.0.0', '1.0.1');

            expect(locker.put).toHaveBeenCalledWith('JamstashVersion', '1.0.1');
            expect(notifications.updateMessage).toHaveBeenCalledWith('Version 1.0.0 to 1.0.1', true);
        });

        describe("Given that changesets for versions '1.0.1' and '1.0.2' were defined,", function() {
            beforeEach(function() {
                fakeVersionChangesets.versions = [
                    {
                        version: '1.0.1',
                        changeset: function (settings) {
                            settings.DefaultSearchType = 0;
                        }
                    },
                    {
                        version: '1.0.2',
                        changeset:  function (settings) {
                            settings.DefaultAlbumSort = 0;
                        }
                    }
                ];
                fakeStorage = {
                    Settings: {
                        DefaultSearchType: {
                            id: "song",
                            name: "Song"
                        },
                        DefaultAlbumSort: {
                            id: "default",
                            name: "Default Sort"
                        },
                        Username: "Hedrix",
                        AutoPlay: true
                    }
                };
            });

            it("when I upgrade the storage version from '1.0.0' to '1.0.2', both changesets have been applied", function() {
                persistence.upgradeVersion('1.0.0', '1.0.2');
                expect(locker.put).toHaveBeenCalledWith('Settings', {
                    DefaultSearchType: 0,
                    DefaultAlbumSort: 0,
                    Username: "Hedrix",
                    AutoPlay: true
                });
            });

            it("when I upgrade the storage version from '1.0.0' to '1.0.1', only the '1.0.1' changeset has been applied", function() {
                persistence.upgradeVersion('1.0.0', '1.0.1');
                expect(locker.put).toHaveBeenCalledWith('Settings', {
                    DefaultSearchType: 0,
                    DefaultAlbumSort: {
                        id: "default",
                        name: "Default Sort"
                    },
                    Username: "Hedrix",
                    AutoPlay: true
                });
            });

            it("when I upgrade the storage version from '1.0.1' to '1.0.2', only the '1.0.2' changeset has been applied", function() {
                persistence.upgradeVersion('1.0.1', '1.0.2');
                expect(locker.put).toHaveBeenCalledWith('Settings', {
                    DefaultSearchType: {
                        id: "song",
                        name: "Song"
                    },
                    DefaultAlbumSort: 0,
                    Username: "Hedrix",
                    AutoPlay: true
                });
            });
        });
    });
});
