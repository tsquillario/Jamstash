/**
* jamstash.utils Module
*
* Provides generally useful functions, like sorts, date-related functions, localStorage access, etc.
*/
angular.module('jamstash.utils', ['jamstash.settings'])

.service('utils', ['$rootScope', 'globals', function ($rootScope, globals) {
    'use strict';

    this.fancyboxOpenImage = function (url) {
        $.fancybox.open({
            helpers : {
                overlay : {
                    css : {
                        'background' : 'rgba(0, 0, 0, 0.15)'
                    }
                }
            },
            hideOnContentClick: true,
            type: 'image',
            openEffect: 'none',
            closeEffect: 'none',
            href: url
        });
    };
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
    this.makeBaseAuth = function (user, password) {
        var tok = user + ':' + password;
        var hash = $.base64Encode(tok);
        return "Basic " + hash;
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
    this.arrayObjectIndexOf = function (myArray, searchTerm, property) {
        for (var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] === searchTerm) { return i; }
        }
        return -1;
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
    this.clickButton = function (el) {
        var el = $(el);
        if (el) {
            var classes = $(el).attr('class').split(" ");
            for (var i = 0, l = classes.length; i < l; ++i) {
                var types = ['shuffle', 'mute'];
                if (jQuery.inArray(classes[i], types) >= 0) {
                    var up = classes[i] + '_up';
                    if (el.hasClass(up)) {
                        el.removeClass(up);
                        return false;
                    } else {
                        el.addClass(up);
                        return true;
                    }
                }
            }
        }
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
    this.getParameterByName = function (name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.search);
        if (results === null) {
            return "";
        } else {
            return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    };
    this.getPathFromUrl = function (url) {
        var strurl = url.toString();
        var u = strurl.substring(0, strurl.indexOf('?'));
        return u;
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
    this.checkVersion = function (runningVersion, minimumVersion) {
        if (runningVersion.major >= minimumVersion.major) {
            if (runningVersion.minor >= minimumVersion.minor) {
                if (runningVersion.patch >= minimumVersion.patch) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    };
    this.checkVersionNewer = function (runningVersion, newVersion) {
        if (runningVersion.major < newVersion.major) {
            return true;
        } else {
            if (runningVersion.minor < newVersion.minor) {
                return true;
            } else {
                if (runningVersion.patch < newVersion.patch) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    };
    this.reloadRoute = function (date) {
        if (reload) {
            $window.location.reload();
        } else {
            $route.reload();
        }
    };
    this.parseDate = function (date) {
        // input: "2012-09-23 20:00:00.0"
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var parts = date.split(" ");
        var dateParts = parts[0].split("-");
        var month = parseInt(dateParts[1], 10) - 1;
        var newDate = months[month] + " " + dateParts[2] + ", " + dateParts[0];
        return newDate;
    };
}]);
