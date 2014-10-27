describe("subsonicService", function() {
    'use strict';

    beforeEach(module('JamStash'));

    it("should exist", inject(function(subsonic) {
        expect(subsonic).toBeDefined();
    }));
});