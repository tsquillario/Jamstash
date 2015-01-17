describe("Persistence service", function() {
    'use strict';

    var persistence, player, notifications, locker;
    var song;
    beforeEach(function() {
        module('jamstash.persistence');

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
    });

    describe("load from localStorage -", function() {
        var fakeStorage;
        beforeEach(function() {
            fakeStorage = {};

            spyOn(locker, "get").and.callFake(function(key) {
                return fakeStorage[key];
            });
        });

        describe("loadTrackPosition -", function() {
            beforeEach(function() {
                spyOn(player, "load");
            });

            it("Given that we previously saved the current track's position in local Storage, it loads the song we saved into the player", function() {
                fakeStorage = { 'CurrentSong': song };

                persistence.loadTrackPosition();

                expect(locker.get).toHaveBeenCalledWith('CurrentSong');
                expect(player.load).toHaveBeenCalledWith(song);
            });

            it("Given that we didn't save anything in local Storage, it doesn't load anything", function() {
                persistence.loadTrackPosition();
                expect(locker.get).toHaveBeenCalledWith('CurrentSong');
                expect(player.load).not.toHaveBeenCalled();
            });
        });

        describe("loadQueue -", function() {
            beforeEach(function() {
                spyOn(notifications, "updateMessage");
                spyOn(player, "addSongs").and.callFake(function (songs) {
                    // Update the queue length so that notifications work
                    player.queue.length += songs.length;
                });
            });

            it("Given that we previously saved the playing queue in local Storage, it fills the player's queue with what we saved and notifies the user", function() {
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

            it("Given that we didn't save anything in local Storage, it doesn't load anything", function() {
                persistence.loadQueue();

                expect(locker.get).toHaveBeenCalledWith('CurrentQueue');
                expect(player.addSongs).not.toHaveBeenCalled();
                expect(notifications.updateMessage).not.toHaveBeenCalled();
            });
        });
    });

    describe("save from localStorage -", function() {
        beforeEach(function() {
            spyOn(locker, "put");
        });

        it("it saves the current track's position in local Storage", function() {
            persistence.saveTrackPosition(song);
            expect(locker.put).toHaveBeenCalledWith('CurrentSong', song);
        });

        it("it saves the playing queue in local Storage", function() {
            player.queue = [
                { id: 1245 },
                { id: 7465 },
                { id: 948 }
            ];
            persistence.saveQueue();
            expect(locker.put).toHaveBeenCalledWith('CurrentQueue', player.queue);
        });
    });

    describe("remove from localStorage -", function() {
        beforeEach(function() {
            spyOn(locker, "forget");
        });

        it("it deletes the current track from local Storage", function() {
            persistence.deleteTrackPosition();
            expect(locker.forget).toHaveBeenCalledWith('CurrentSong');
        });

        it("it deletes the saved playing queue from local Storage", function() {
            persistence.deleteQueue();
            expect(locker.forget).toHaveBeenCalledWith('CurrentQueue');
        });
    });
});
