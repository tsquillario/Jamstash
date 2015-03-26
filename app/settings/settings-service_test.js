describe("Settings service", function() {
    'use strict';

    var globals;
    beforeEach(function() {
        module('jamstash.settings.service');
        inject(function (_globals_) {
            globals = _globals_;
        });
    });

    it("Given 'http://subsonic.org/demo', when calling BaseURL() then I get 'http://subsonic.org/demo/rest'", function() {
        globals.settings.Server = "http://subsonic.org/demo";
        expect(globals.BaseURL()).toBe("http://subsonic.org/demo/rest");
    });

    it("Given a username, password, protocol, api version and application name, when calling BaseParams() then I get a concatenated string of url params", function () {
        globals.settings.Username = "jdoe";
        globals.settings.Password = "testpassword";
        globals.settings.Protocol = "jsonp";
        globals.settings.ApiVersion = "1.10.2";
        globals.settings.ApplicationName = "MyApp";
        expect(globals.BaseParams()).toBe("u=jdoe&p=testpassword&f=jsonp&v=1.10.2&c=MyApp");
    });

    //TODO: JMA: add callback param if jsonp
});
