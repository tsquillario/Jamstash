JamStash.service('utils', function ($cookieStore) {
    this.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof (fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };
    this.setValue = function (key, value, notify) {
        if (value !== null) {
            $cookieStore.put(key, value);
        } else {
            $cookieStore.remove(key);
        }
        if (notify) {
        }
        /* jQuery.cookies.js
        try {
        localStorage.setItem(key, value);
        } catch (e) {
        if (e == QUOTA_EXCEEDED_ERR) {
        alert('Quota exceeded!');
        }
        }
        */
    }
    this.getValue = function (value) {
        if ($cookieStore.get(value)) {
            return $cookieStore.get(value);
        } else {
            return false;
        }
        /* jQuery.cookies.js
        if (browserStorageCheck) {
        var item = localStorage.getItem(value);
        if (item != '' && item != undefined) {
        return true;
        } else {
        return false;
        }
        } else {
        if (settings.Debug()) { console.log('HTML5::loadStorage not supported on your browser' + html.length + ' characters'); }
        }
        */
    }
    this.confirmDelete = function (text) {
        var question = confirm(text);
        if (question) {
            return true;
        }
        else {
            return false;
        }
    }
    this.makeBaseAuth = function (user, password) {
        var tok = user + ':' + password;
        var hash = $.base64Encode(tok);
        return "Basic " + hash;
    }
    this.HexEncode = function (n) {
        for (var u = "0123456789abcdef", i = [], r = [], t = 0; t < 256; t++)
            i[t] = u.charAt(t >> 4) + u.charAt(t & 15);
        for (t = 0; t < n.length; t++)
            r[t] = i[n.charCodeAt(t)];
        return r.join("")
    }
    this.switchTheme = function (theme) {
        switch (theme.toLowerCase()) {
            case 'dark':
                $('link[data-name=theme]').attr('href', 'style/Dark.css');
                break;
            case 'default':
                $('link[data-name=theme]').attr('href', '');
                break;
            default:
                break;
        }
    }
    // HTML5
    this.browserStorageCheck = function () {
        if (typeof (localStorage) == 'undefined') {
            return false;
        } else {
            return true;
        }
    }
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
    }
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
            if (i == 0 && tmp == '00') {
            } else {
                time += tmp;
                if (i < 2) {
                    time += ':';
                }
            }
            secs = secs % times[i];
        }
        return time;
    }
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
    }
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
    }
    this.findKeyForCode = function (code) {
        var map = { 'keymap': [
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
    }
    this.toHTML = {
        on: function (str) {
            var a = [],
        i = 0;
            for (; i < str.length; ) a[i] = str.charCodeAt(i++);
            return "&#" + a.join(";&#") + ";"
        },
        un: function (str) {
            return str.replace(/&#(x)?([^;]{1,5});?/g,
        function (a, b, c) {
            return String.fromCharCode(parseInt(c, b ? 16 : 10))
        })
        }
    };
    this.getParameterByName = function (name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.search);
        if (results == null)
            return "";
        else
            return decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    this.getPathFromUrl = function (url) {
        var strurl = url.toString();
        var u = strurl.substring(0, strurl.indexOf('?'));
        return u
    }
    this.setTitle = function (text) {
        if (text != "") {
            document.title = text;
        }
    }
    var timer = 0;
    this.scrollTitle = function (text) {
        var shift = {
            "left": function (a) {
                a.push(a.shift());
            },
            "right": function (a) {
                a.unshift(a.pop());
            }
        };
        var opts = {
            text: text,
            dir: "left",
            speed: 1200
        };

        t = (opts.text || document.title).split("");
        if (!t) {
            return;
        }
        t.push(" ");
        clearInterval(timer);
        timer = setInterval(function () {
            var f = shift[opts.dir];
            if (f) {
                f(t);
                document.title = t.join("");
            }
        }, opts.speed);
        /*
        $.marqueeTitle({
        text: text,
        dir: "left",
        speed: 1200
        });
        */
    }
    this.parseVersionString = function (str) {
        if (typeof (str) != 'string') { return false; }
        var x = str.split('.');
        // parse from string or default to 0 if can't parse
        var maj = parseInt(x[0]) || 0;
        var min = parseInt(x[1]) || 0;
        var pat = parseInt(x[2]) || 0;
        return {
            major: maj,
            minor: min,
            patch: pat
        }
    }
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
    }
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
    }
    this.parseDate = function (date) {
        // input: "2012-09-23 20:00:00.0"
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var parts = date.split(" ");
        var dateParts = parts[0].split("-");
        var month = parseInt(dateParts[1], 10) - 1;
        var date = months[month] + " " + dateParts[2] + ", " + dateParts[0];
        return date;
    }
});