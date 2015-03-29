describe("utils service", function() {
    'use strict';

    var $rootScope, utils, mockGlobals;
    beforeEach(function() {
        module('jamstash.utils', function ($provide) {
            $provide.value('globals', mockGlobals);
        });

        inject(function (_utils_, _$rootScope_) {
            utils = _utils_;
            $rootScope = _$rootScope_;
        });
    });

    describe("parseVersionString() -", function() {
        it("Given a version string '2.0.1', when I parse it into a version object, then the result will be {major: 2, minor: 0, patch: 1}", function() {
            var result = utils.parseVersionString('2.0.1');
            expect(result).toEqual({major: 2, minor: 0, patch: 1});
        });

        it("Given a random string 'IHtd8EAL9HeLdc', when I parse it into a version object, then the result will be {major: 0, minor: 0, patch: 0}", function() {
            var result = utils.parseVersionString('IHtd8EAL9HeLdc');
            expect(result).toEqual({major: 0, minor: 0, patch: 0});
        });

        it("Given something other than a number, when I parse it into a version object, then the result will be false", function() {
            var result = utils.parseVersionString(84.1061);
            expect(result).toBeFalsy();
        });
    });

    describe("checkVersion() -", function() {
        var running, required;
        beforeEach(function() {
            running = '';
            required = '';
        });

        it("Given two version strings '2.0.1' and '1.2.3', when I check the version required, the result will be true", function() {
            running = '2.0.1';
            required = '1.2.3';
            expect(utils.checkVersion(running, required)).toBeTruthy();
        });

        it("Given two version objects {major: 2, minor: 0, patch: 1} and {major: 1, minor: 2, patch: 3}, when I check the version required, the result will be true", function() {
            running = {
                major: 2,
                minor: 0,
                patch: 1
            };
            required = {
                major: 1,
                minor: 2,
                patch: 0
            };
            expect(utils.checkVersion(running, required)).toBeTruthy();
        });

        it("Given two version strings '1.3.0' and '1.2.3', when I check the version required, the result will be true", function() {
            running = '1.3.0';
            required = '1.2.3';
            expect(utils.checkVersion(running, required)).toBeTruthy();
        });

        it("Given two version strings '1.2.2' and '1.2.3', when I check the version required, the result will be false", function() {
            running = '1.2.2';
            required = '1.2.3';
            expect(utils.checkVersion(running, required)).toBeFalsy();
        });

        it("Given two version strings '1.2.3' and '1.2.3', when I check the version required, the result will be true", function() {
            running = '1.2.3';
            required = '1.2.3';
            expect(utils.checkVersion(running, required)).toBeTruthy();
        });

        it("Given two random strings 'wISr91GRXzTsxkx' and 'uSIwvRDp8QJO', when I check the version required, the result will be true", function() {
            running = 'wISr91GRXzTsxkx';
            required = 'uSIwvRDp8QJO';
            expect(utils.checkVersion(running, required)).toBeTruthy();
        });

        it("Given a version string '1.0.1' and undefined, when I check the version required, the result will be true", function() {
            running = '1.0.1';
            required = undefined;
            expect(utils.checkVersion(running, required)).toBeTruthy();
        });
    });

    describe("checkVersionNewer() -", function() {
        var newer, older;
        beforeEach(function() {
            newer = '';
            older = '';
        });

        it("Given two version strings '2.0.1' and '1.2.3', when I check if the first version is newer, the result will be true", function() {
            newer = '2.0.1';
            older = '1.2.3';
            expect(utils.checkVersionNewer(newer, older)).toBeTruthy();
        });

        it("Given two version objects {major: 2, minor: 0, patch: 1} and {major: 1, minor: 2, patch: 3}, when I check if the first version is newer, the result will be true", function() {
            newer = {
                major: 2,
                minor: 0,
                patch: 1
            };
            older = {
                major: 1,
                minor: 2,
                patch: 0
            };
            expect(utils.checkVersionNewer(newer, older)).toBeTruthy();
        });

        it("Given two version strings '1.3.0' and '1.2.3', when I check if the first version is newer, the result will be true", function() {
            newer = '1.3.0';
            older = '1.2.3';
            expect(utils.checkVersionNewer(newer, older)).toBeTruthy();
        });

        it("Given two version strings '1.2.2' and '1.2.3', when I check if the first version is newer, the result will be false", function() {
            newer = '1.2.2';
            older = '1.2.3';
            expect(utils.checkVersionNewer(newer, older)).toBeFalsy();
        });

        it("Given two version strings '1.2.3' and '1.2.3', when I check if the first version is newer, the result will be false", function() {
            newer = '1.2.3';
            older = '1.2.3';
            expect(utils.checkVersionNewer(newer, older)).toBeFalsy();
        });

        it("Given two version strings '1.0.1' and '1.0.0', when I check if the first version is newer, the result will be true", function() {
            newer = '1.0.1';
            older = '1.0.0';

            expect(utils.checkVersionNewer(newer, older)).toBeTruthy();
        });

        it("Given two random strings 'wISr91GRXzTsxkx' and 'uSIwvRDp8QJO', when I check if the first version is newer, the result will be false", function() {
            newer = 'wISr91GRXzTsxkx';
            older = 'uSIwvRDp8QJO';
            expect(utils.checkVersionNewer(newer, older)).toBeFalsy();
        });

        it("Given a version string '1.0.1' and undefined, when I check if the first version is newer, the result will be true", function() {
            newer = '1.0.1';
            older = undefined;
            expect(utils.checkVersionNewer(newer, older)).toBeTruthy();
        });
    });

    it("formatDate() - Given a Date and a text format, when I format a Date, jQuery's format date will be called and a formatted string will be returned", function() {
        spyOn($.format, 'date');
        var date = new Date('2015-03-28T16:54:40+01:00');

        utils.formatDate(date, 'yyyy-MM-dd h:mm a');

        expect($.format.date).toHaveBeenCalledWith(date, 'yyyy-MM-dd h:mm a');
    });
});
