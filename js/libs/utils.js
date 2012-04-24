/* Reusable Functions */
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
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);
    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}
function updateMessage(msg) {
    $('#messages').text(msg);
    $('#messages').fadeIn();
    setTimeout(function () { $('#messages').fadeOut(); }, 5000);
}
// Convert to unicode support
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
    if (scrollMsg === "") {
        if (text === "") {
            scrollMsg = document.title;
        } else {
            scrollMsg = text;
        }
    } else {
        if (text != undefined && text != scrollMsg) {
            scrollMsg = text;
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
function requestPermissionIfRequired() {
    if (!hasNotificationPermission() && (window.webkitNotifications)) {
        window.webkitNotifications.requestPermission();
    }
}
function hasNotificationPermission() {
    return !!(window.webkitNotifications) && (window.webkitNotifications.checkPermission() == 0);
}
var notifications = new Array();
function showNotification(pic, title, text) {
    if (hasNotificationPermission()) {
        closeAllNotifications()
        var popup = window.webkitNotifications.createNotification(pic, title, text);
        notifications.push(popup);
        setTimeout(function (notWin) {
        notWin.cancel();
        }, 10000, popup);
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
