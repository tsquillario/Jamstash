describe("archive service", function() {
    'use strict';

    var archive, mockBackend, mockGlobals, utils,
        response;

    beforeEach(function() {

        mockGlobals = {
            archiveUrl: "http://hysterotomy.com/hippolytus/quercitrin?a=chillagite&b=savour#superfecundation"
        };

        module('jamstash.archive.service', function  ($provide) {
            $provide.value('globals', mockGlobals);
            $provide.decorator('player', function () {
                var playerService = jasmine.createSpyObj("player", ["play"]);
                playerService.queue = [];
                return playerService;
            });
            $provide.decorator('notifications', function () {
                return jasmine.createSpyObj("notifications", ["updateMessage"]);
            });
            $provide.decorator('utils', function () {
                return jasmine.createSpyObj("utils", ["formatDate"]);
            });
        });

        inject(function (_archive_, $httpBackend, _utils_) {
            archive = _archive_;
            mockBackend = $httpBackend;
            utils = _utils_;
        });
    });

    afterEach(function() {
        mockBackend.verifyNoOutstandingExpectation();
        mockBackend.verifyNoOutstandingRequest();
    });

    describe("mapAlbum() -", function() {
        it("Given album data with a publicDate defined, when I map it to an Album, then utils.formatDate will be called", function() {
            var albumData = {
                id: 504,
                publicDate: "2015-03-29T18:22:06.000Z",
                collection: ['Sternal Daubreelite']
            };

            archive.mapAlbum(albumData);
            expect(utils.formatDate).toHaveBeenCalledWith(jasmine.any(Date), "yyyy-MM-dd h:mm a");
        });
    });
});
