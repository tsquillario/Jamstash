// jscs:disable validateQuoteMarks
describe("breadcrumbs directive", function () {
    'use strict';

    var $q, deferred, element, scope, controller, subsonic, notifications, breadcrumbs;

    beforeEach(module('templates'));
    beforeEach(function () {
        module('jamstash.breadcrumbs.directive', function ($provide) {
            subsonic = jasmine.createSpyObj("subsonic", ["getDirectory"]);
            $provide.value('subsonic', subsonic);
            notifications = jasmine.createSpyObj("notifications", ["updateMessage"]);
            $provide.value('notifications', notifications);
            breadcrumbs = jasmine.createSpyObj("breadcrumbs", ["popUntil"]);
            $provide.value('breadcrumbs', breadcrumbs);
        });

        inject(function ($rootScope, $compile, _$q_) {
            $q = _$q_;
            deferred = $q.defer();
            // Compile the directive
            scope = $rootScope.$new();
            element = '<jamstash-breadcrumbs></jamstash-breadcrumbs>';
            element = $compile(element)(scope);
            scope.$digest();
            controller = element.controller('jamstashBreadcrumbs');
        });

        subsonic.getDirectory.and.returnValue(deferred.promise);
        scope.handleErrors = jasmine.createSpy("handleErrors").and.returnValue(deferred.promise);
        scope.SelectedAlbumSort = {
            id: "default"
        };
    });

    it("Given a music directory that contained 2 songs and 1 subdirectory and given its id and name, when I display its songs, then subsonic service will be called, the breadcrumbs will be popped until they only display the directory and the songs and directory will be published to the scope", function () {
        controller.displaySongs({
            id: 680,
            name: "henchman unstormy"
        });
        deferred.resolve({
            directories: [{ id: 569, type: 'byfolder' }],
            songs: [
                { id: 549 },
                { id: 390 }
            ]
        });
        scope.$apply();

        expect(subsonic.getDirectory).toHaveBeenCalledWith(680);
        expect(scope.album).toEqual([
            { id: 569, type: 'byfolder' }
        ]);
        expect(scope.song).toEqual([
            { id: 549 },
            { id: 390 }
        ]);
        expect(breadcrumbs.popUntil).toHaveBeenCalledWith({
            id: 680,
            name: "henchman unstormy"
        });
    });

    it("Given a music directory, when I display it, then handleErrors will handle HTTP and Subsonic errors", function () {
        controller.displaySongs({
            id: 628
        });
        expect(scope.handleErrors).toHaveBeenCalledWith(deferred.promise);
    });

    it("Given a music directory that didn't contain anything, when I display it, then an error notification will be displayed", function () {
        controller.displaySongs({
            id: 242,
            name: "discinoid"
        });
        deferred.reject({ reason: 'This directory is empty.' });
        scope.$apply();

        expect(notifications.updateMessage).toHaveBeenCalledWith('This directory is empty.', true);
    });
});
