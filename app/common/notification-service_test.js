describe("Notifications service - ", function() {
    'use strict';

    var notifications, $window, $interval, player, utils, mockGlobals,
        NotificationObj;
    beforeEach(function() {
        mockGlobals = {
            settings: {
                Timeout: 30000
            }
        };

        module('jamstash.notifications', function ($provide) {
            $provide.value('globals', mockGlobals);
        });

        inject(function (_notifications_, _$window_, _$interval_, _player_, _utils_) {
            notifications = _notifications_;
            $window = _$window_;
            player = _player_;
            utils = _utils_;
            $interval = _$interval_;
        });

        spyOn(player, "nextTrack");
        spyOn(utils.toHTML, "un").and.callFake(function (arg) { return arg; });

        // Mock the Notify object
        $window.Notify = jasmine.createSpyObj("Notify", ["isSupported", "needsPermission", "requestPermission"]);
        NotificationObj = jasmine.createSpyObj("Notification", ["show", "close"]);
        spyOn($window, "Notify").and.callFake(function (title, settings) {
            NotificationObj.simulateClick = settings.notifyClick;
            return NotificationObj;
        });
    });

    it("can check whether we have the permission to display notifications in the current browser", function() {
        $window.Notify.needsPermission.and.returnValue(false);

        expect(notifications.hasPermission()).toBeTruthy();
        expect($window.Notify.needsPermission).toHaveBeenCalled();
    });

    it("can check whether the current browser supports notifications", function() {
        $window.Notify.isSupported.and.returnValue(true);

        expect(notifications.isSupported()).toBeTruthy();
        expect($window.Notify.isSupported).toHaveBeenCalled();
    });

    it("can request Notification permission for the current browser", function() {
        spyOn(notifications, "isSupported").and.returnValue(true);
        spyOn(notifications, "hasPermission").and.returnValue(false);

        notifications.requestPermissionIfRequired();

        expect($window.Notify.requestPermission).toHaveBeenCalled();
    });

    describe("When I show a notification, given a song,", function() {
        var song;
        beforeEach(function() {
            song = {
                coverartthumb: "https://backjaw.com/overquantity/outpitch?a=redredge&b=omnivoracious#promotement",
                name: "Unhorny",
                artist: "Saturnina Koster",
                album: "Trepidate"
            };
            spyOn(notifications, "hasPermission").and.returnValue(true);
        });
        it("it checks the permissions, displays the title, the artist's name and the album picture in a notification", function() {
            notifications.showNotification(song);

            expect(notifications.hasPermission).toHaveBeenCalled();
            expect($window.Notify).toHaveBeenCalledWith(song.name, {
                body: song.artist + " - " + song.album,
                icon: song.coverartthumb,
                notifyClick: jasmine.any(Function)
            });
            expect(NotificationObj.show).toHaveBeenCalled();
        });

        it("when I click on it, it plays the next track of the queue", function() {
            notifications.showNotification(song);
            NotificationObj.simulateClick();

            expect(player.nextTrack).toHaveBeenCalled();
            expect(NotificationObj.close).toHaveBeenCalled();
        });

        it("given that the global Timeout setting is set to 10 seconds, it closes itself after 10 seconds", function() {
            mockGlobals.settings.Timeout = 10000;

            notifications.showNotification(song);
            $interval.flush(10001);

            expect(NotificationObj.close).toHaveBeenCalled();
        });

        it("if we don't have the permission to display notifications, nothing happens", function() {
            notifications.hasPermission.and.returnValue(false);

            notifications.showNotification(song);

            expect(NotificationObj.show).not.toHaveBeenCalled();
        });
    });
});
