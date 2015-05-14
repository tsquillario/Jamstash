describe("repeat directive", function() {
    'use strict';

    var element, scope, isolateScope, notifications, mockGlobals;

    beforeEach(module ('templates'));
    beforeEach(function() {
        // We redefine globals because in some tests we need to alter the settings
        mockGlobals = {
            settings: {
                RepeatValues: ["queue", "song", "none"],
                Repeat: "none"
            }
        };

        module('jamstash.repeat.directive', function($provide) {
            $provide.value('globals', mockGlobals);
            // Mock the notifications service
            $provide.decorator('notifications', function () {
                return jasmine.createSpyObj("notifications", ["updateMessage"]);
            });
        });

        inject(function ($rootScope, $compile, _notifications_) {
            notifications = _notifications_;
            // Compile the directive
            scope = $rootScope.$new();
            scope.settings = mockGlobals.settings;
            element = '<jamstash-repeat selected-value="settings.Repeat" values="settings.RepeatValues"></jamstash-repeat>';
            element = $compile(element)(scope);
            scope.$digest();
            isolateScope = element.isolateScope();
        });
    });

    it("Given that the Repeat setting was set to 'none', when I cycle through the values, then the Repeat setting will be set to 'queue'", function() {
        isolateScope.cycleRepeat();
        isolateScope.$apply();

        expect(mockGlobals.settings.Repeat).toBe('queue');
    });

    it("Given that the Repeat setting was set to 'queue', when I cycle through the values, then the Repeat setting will be set to 'song'", function() {
        mockGlobals.settings.Repeat = 'queue';
        isolateScope.$apply();

        isolateScope.cycleRepeat();
        isolateScope.$apply();

        expect(mockGlobals.settings.Repeat).toBe('song');
    });

    it("Given that the Repeat setting was set to 'song', when I cycle through the values, then the Repeat setting will be set to 'none", function() {
        mockGlobals.settings.Repeat = 'song';
        isolateScope.$apply();

        isolateScope.cycleRepeat();
        isolateScope.$apply();

        expect(mockGlobals.settings.Repeat).toBe('none');
    });

    it("When I cycle through the values, then the user will be notified with the new value", function() {
        isolateScope.cycleRepeat();
        isolateScope.$apply();

        expect(notifications.updateMessage).toHaveBeenCalledWith('Repeat queue', true);
    });
});
