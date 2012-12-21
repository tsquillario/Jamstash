
function getCookie(value) {
    if ($.cookie(value)) {
        return $.cookie(value);
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
    if (debug) { console.log('HTML5::loadStorage not supported on your browser' + html.length + ' characters'); }
    }
    */
}
function setCookie(key, value) {
    $.cookie(key, value, { expires: 365 });
    /* jQuery.cookies.js
    try {
    if (debug) { console.log('Saving : ' + key + ':' + value); }
    localStorage.setItem(key, value);
    } catch (e) {
    if (e == QUOTA_EXCEEDED_ERR) {
    alert('Quota exceeded!');
    }
    }
    */
}
/* Reusable Functions */
function clickButton(el) {
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
function confirmDelete() {
    var question = confirm('Are you sure you want to delete the selected item(s)?');
    if (question) {
        return true;
    }
    else {
        return false;
    }
}
function makeBaseAuth(user, password) {
    var tok = user + ':' + password;
    var hash = $.base64Encode(tok);
    return "Basic " + hash;
}
function HexEncode(n) {
    for (var u = "0123456789abcdef", i = [], r = [], t = 0; t < 256; t++)
        i[t] = u.charAt(t >> 4) + u.charAt(t & 15);
    for (t = 0; t < n.length; t++)
        r[t] = i[n.charCodeAt(t)];
    return r.join("")
}
String.prototype.hexDecode = function () { var r = ''; for (var i = 0; i < this.length; i += 2) { r += unescape('%' + this.substr(i, 2)); } return r; }
String.prototype.hexEncode = function () { var r = ''; var i = 0; var h; while (i < this.length) { h = this.charCodeAt(i++).toString(16); while (h.length < 2) { h = h; } r += h; } return r; }
function findKeyForCode(code) {
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
function popOut()
{
    window.open(hostURL, "External Player", "status = 1, height = 735, width = 840, resizable = 0");
}
function secondsToTime(secs) {
    /*
    Version 1
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
    */

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
var msgIndex = 1;
function updateMessage(msg, autohide) {
    if (msg != '') {
        var id = msgIndex;
        $('#messages').append('<span id=\"msg_' + id + '\" class="message">' + msg + '</span>');
        $('#messages').fadeIn();
        var el = '#msg_' + id;
        if (autohide) {
            setTimeout(function () {
                $(el).fadeOut(function () { $(this).remove(); });
            }, 10000);
        } else {
            $(el).click(function () {
                $(el).fadeOut(function () { $(this).remove(); });
                return false;
            });
        }
        msgIndex++;
    }
}
function updateStatus(el, msg) {
    if (msg == '') {
        $(el).html('0 song(s), 00:00:00 total time');
    } else {
        $(el).html(msg);
    }
    if ($(el).html() != '') {
        $(el).addClass('on');
        $(el).fadeIn();
    }
}
// Convert to unicode support
/* Old 
var toHTML = {
    on: function (str) {
        var a = [],
        i = 0;
        for (; i < str.length; ) a[i] = str.charCodeAt(i++);
        return "&#" + a.join(";&#") + ";"
    },
    un: function (str) {
        return str.replace(/&#(x)?([^&]{1,5});?/g,
        function (a, b, c) {
            return String.fromCharCode(parseInt(c, b ? 16 : 10))
        })
    }
};
*/
var toHTML = {
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
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}
function getPathFromUrl(url) {
    var strurl = url.toString();
    var u = strurl.substring(0, strurl.indexOf('?'));
    return u
}
function setTitle(text) {
    if (text != "") {
        document.title = text;
    }
}
var timer = null;
var scrollMsg = "";
var pos = 0;
function scrollTitle(text) {
    if (scrollMsg == "") {
        if (text == "") {
            scrollMsg = document.title;
        } else {
            scrollMsg = text;
        }
    } else {
        if (typeof text != 'undefined' && text != scrollMsg) {
            scrollMsg = text;
            pos = 0;
        }
    }
    var msg = scrollMsg;
    var speed = 1200;
    var endChar = "   ";
    var ml = msg.length;

    title = msg.substr(pos, ml) + endChar + msg.substr(0, pos);
    document.title = title;

    pos++;
    if (pos > ml) {
        pos = 0;
    } else {
        timer = window.setTimeout("scrollTitle()", speed);
    }
    // To stop timer, clearTimeout(timer);
}
// HTML5
function requestPermissionIfRequired() {
    if (!hasNotificationPermission() && (window.webkitNotifications)) {
        window.webkitNotifications.requestPermission();
    }
}
function hasNotificationPermission() {
    return !!(window.webkitNotifications) && (window.webkitNotifications.checkPermission() == 0);
}
var notifications = new Array();
function showNotification(pic, title, text, type, bind) {
    if (hasNotificationPermission()) {
        //closeAllNotifications()
        var popup;
        if (type == 'text') {
            popup = window.webkitNotifications.createNotification(pic, title, text);
        } else if (type == 'html') {
            popup = window.webkitNotifications.createHTMLNotification(text);
        }
        if (bind = '#NextTrack') {
            popup.addEventListener('click', function () {
                $(bind).click();
                this.cancel();
            })
        }
        notifications.push(popup);
        setTimeout(function (notWin) {
            notWin.cancel();
        }, 20000, popup);
        popup.show();
    } else {
        console.log("showNotification: No Permission");
    }
}
function closeAllNotifications() {
    for (notification in notifications) {
        notifications[notification].cancel();
    }
}
function browserStorageCheck() {
    if (typeof (localStorage) == 'undefined') {
        return false;
    } else {
        return true;
    }
}
function parseVersionString(str) {
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
function checkVersion(runningVersion, minimumVersion) {
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
function checkVersionNewer(runningVersion, newVersion) {
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
function switchTheme(theme) {
    switch (theme) {
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
function parseDate(date) {
    // input: "2012-09-23 20:00:00.0"
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var parts = date.split(" ");
    var dateParts = parts[0].split("-");
    var month = parseInt(dateParts[1], 10) - 1;
    var date = months[month] + " " + dateParts[2] + ", " + dateParts[0];
    return date;
}
function askPermission() {
    chrome.permissions.request({
        origins: [getCookie('Server')]
    }, function (granted) {
        if (granted) {
            return true;
        } else {
            return false;
        }
    });
}