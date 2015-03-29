/**
* jamstash.utils Module
*
* Provides generally useful functions, like sorts, date-related functions, localStorage access, etc.
*/
angular.module('jamstash.utils', ['jamstash.settings.service'])

.service('utils', ['$rootScope', 'globals', function ($rootScope, globals) {
    'use strict';

    this.safeApply = function (fn) {
        var phase = $rootScope.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof (fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };
    this.setValue = function (key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            if (globals.settings.Debug) { console.log(e); }
        }
    };
    this.getValue = function (value) {
        try {
            var item = localStorage.getItem(value);
            if (item !== '' && typeof item !== 'undefined') {
                return JSON.parse(item);
            } else {
                return false;
            }
        } catch (e) {
            if (globals.settings.Debug) { console.log(e); }
        }
    };
    this.sortDateFunction = function (a, b) {
        return a.date < b.date ? 1 : -1;
    };
    this.sortArtistFunction = function (a, b) {
        return a.artist.toLowerCase() < b.artist.toLowerCase() ? -1 : 1;
    };
    this.sortAlbumFunction = function (a, b) {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    };
    this.sortTrackFunction = function (a, b) {
        return parseInt(a.track) > parseInt(b.track) ? -1 : 1;
    };
    this.confirmDelete = function (text) {
        var question = window.confirm(text);
        if (question) {
            return true;
        }
        else {
            return false;
        }
    };
    this.HexEncode = function (n) {
        for (var u = "0123456789abcdef", i = [], r = [], t = 0; t < 256; t++) {
            i[t] = u.charAt(t >> 4) + u.charAt(t & 15);
        }
        for (t = 0; t < n.length; t++) {
            r[t] = i[n.charCodeAt(t)];
        }
        return r.join("");
    };
    this.switchTheme = function (theme) {
        switch (theme.toLowerCase()) {
            case 'dark':
                $('link[data-name=theme]').attr('href', 'styles/Dark.css');
                break;
            case 'default':
                $('link[data-name=theme]').attr('href', '');
                break;
            default:
                break;
        }
    };
    this.timeToSeconds = function (time) {
        var a = time.split(':'); // split it at the colons
        var seconds;
        switch (a.length) {
            case 1:
                seconds = 0;
                break;
            case 2:
                seconds = (parseInt(a[0])) * 60 + (parseInt(a[1]));
                break;
            case 3:
                seconds = (parseInt(a[0])) * 60 * 60 + (parseInt(a[1])) * 60 + (parseInt(a[2]));
                break;
            default:
                break;
        }
        return seconds;
    };
    this.secondsToTime = function (secs) {
        // secs = 4729
        var times = new Array(3600, 60, 1);
        var time = '';
        var tmp;
        for (var i = 0; i < times.length; i++) {
            tmp = Math.floor(secs / times[i]);
            // 0: 4729/3600 = 1
            // 1: 1129/60 = 18
            // 2: 49/1 = 49
            if (tmp < 1) {
                tmp = '00';
            }
            else if (tmp < 10) {
                tmp = '0' + tmp;
            }
            if (i === 0 && tmp === '00') {
            } else {
                time += tmp;
                if (i < 2) {
                    time += ':';
                }
            }
            secs = secs % times[i];
        }
        return time;
    };

    //TODO: Hyz: replace with using an angular date filter in the template
    this.formatDate = function (date, format) {
        var dateToformat = (angular.isDate(date)) ? date : new Date(date);
        return $.format.date(dateToformat, format);
    };

    this.logObjectProperties = function (obj) {
        $.each(obj, function (key, value) {
            var parent = key;
            if (typeof value === "object") {
                $.each(value, function (key, value) {
                    console.log(parent + ' > ' + key + ' : ' + value);
                });
            } else {
                console.log(key + ' : ' + value);
            }
        });
    };
    this.findKeyForCode = function (code) {
        var map = {
            'keymap': [
            { 'key': 'a', 'code': 65 },
            { 'key': 'b', 'code': 66 },
            { 'key': 'c', 'code': 67 },
            { 'key': 'd', 'code': 68 },
            { 'key': 'e', 'code': 69 },
            { 'key': 'f', 'code': 70 },
            { 'key': 'g', 'code': 71 },
            { 'key': 'h', 'code': 72 },
            { 'key': 'i', 'code': 73 },
            { 'key': 'j', 'code': 74 },
            { 'key': 'k', 'code': 75 },
            { 'key': 'l', 'code': 76 },
            { 'key': 'm', 'code': 77 },
            { 'key': 'n', 'code': 78 },
            { 'key': 'o', 'code': 79 },
            { 'key': 'p', 'code': 80 },
            { 'key': 'q', 'code': 81 },
            { 'key': 'r', 'code': 82 },
            { 'key': 's', 'code': 83 },
            { 'key': 't', 'code': 84 },
            { 'key': 'u', 'code': 85 },
            { 'key': 'v', 'code': 86 },
            { 'key': 'w', 'code': 87 },
            { 'key': 'x', 'code': 88 },
            { 'key': 'y', 'code': 89 },
            { 'key': 'z', 'code': 90 }
            ]
        };
        var keyFound = 0;
        $.each(map.keymap, function (i, mapping) {
            if (mapping.code === code) {
                keyFound = mapping.key;
            }
        });
        return keyFound;
    };
    this.toHTML = {
        on: function (str) {
            var a = [],
        i = 0;
            for (; i < str.length; ) { a[i] = str.charCodeAt(i++); }
            return "&#" + a.join(";&#") + ";";
        },
        un: function (str) {
            return str.replace(/&#(x)?([^;]{1,5});?/g,
        function (a, b, c) {
            return String.fromCharCode(parseInt(c, b ? 16 : 10));
        });
        }
    };

    this.parseVersionString = function (str) {
        if (typeof (str) !== 'string') { return false; }
        var x = str.split('.');
        // parse from string or default to 0 if can't parse
        var maj = parseInt(x[0]) || 0;
        var min = parseInt(x[1]) || 0;
        var pat = parseInt(x[2]) || 0;
        return {
            major: maj,
            minor: min,
            patch: pat
        };
    };

    this.checkVersion = function (running, required) {
        if (required === undefined) {
            return true;
        }
        if (!angular.isObject(running)) {
            running = this.parseVersionString(running);
        }
        if (!angular.isObject(required)) {
            required = this.parseVersionString(required);
        }
        if (required.major !== undefined && running.major !== undefined && running.major > required.major) {
            return true;
        } else {
            if (required.minor !== undefined && running.minor !== undefined && running.minor > required.minor) {
                return true;
            } else {
                if (required.patch !== undefined && running.patch !== undefined && running.patch >= required.patch) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    };

    this.checkVersionNewer = function (newerVersion, olderVersion) {
        if (olderVersion === undefined) {
            return true;
        }
        if (!angular.isObject(newerVersion)) {
            newerVersion = this.parseVersionString(newerVersion);
        }
        if (!angular.isObject(olderVersion)) {
            olderVersion = this.parseVersionString(olderVersion);
        }
        if (olderVersion.major !== undefined && newerVersion.major !== undefined && newerVersion.major > olderVersion.major) {
            return true;
        } else {
            if (olderVersion.minor !== undefined && newerVersion.minor !== undefined && newerVersion.minor > olderVersion.minor) {
                return true;
            } else {
                if (olderVersion.patch !== undefined && newerVersion.patch !== undefined && newerVersion.patch > olderVersion.patch) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    };
}]);
