describe("Page service", function() {
    'use strict';

    var mockGlobals, Page, utils, $interval;
    beforeEach(function() {

        mockGlobals = {
            settings: {
                ScrollTitle: false
            }
        };

        module('jamstash.page', function ($provide) {
            $provide.value('globals', mockGlobals);
        });

        inject(function (_Page_, _utils_, _$interval_) {
            Page = _Page_;
            utils = _utils_;
            $interval = _$interval_;
        });
        spyOn(utils.toHTML, "un").and.callFake(function (arg) { return arg; });
    });

    describe("Given a song,", function() {
        var song;
        beforeEach(function() {
            song = {
                artist: 'Merlyn Nurse',
                name: 'Exsiccator tumble'
            };
        });

        it("it displays its artist and its name as the page's title", function() {
            Page.setTitleSong(song);
            expect(Page.title()).toBe('Merlyn Nurse - Exsiccator tumble');
        });

        it("if the global setting 'ScrollTitle' is true, it scrolls the page title", function() {
            spyOn(Page, "scrollTitle");
            mockGlobals.settings.ScrollTitle = true;

            Page.setTitleSong(song);

            expect(Page.scrollTitle).toHaveBeenCalled();
        });
    });

    it("Given a title, it can scroll it", function() {
        Page.setTitle('unbeloved omnificent supergravitate').scrollTitle();
        $interval.flush(1201);
        expect(Page.title()).toBe('nbeloved omnificent supergravitate u');
    });
});
