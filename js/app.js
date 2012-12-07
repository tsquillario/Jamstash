// Global Variables
var debug = false;
var audio = null;
var hostURL = location.href;
var protocol = 'json';
var baseURL;
var baseParams;
var apiVersion;
var username;
var password;
var passwordenc;
var server;
var smwidth;
var apiVersion = '1.6.0';
var currentVersion = '2.3.6';

// Get URL Querystring Parameters
var u = getParameterByName('u');
var p = getParameterByName('p');
var s = getParameterByName('s');
if (u && p && s) {
    // Auto configuration from Querystring params
    if (!getCookie('username')) {
        setCookie('username', u);
        username = u;
    }
    if (!getCookie('passwordenc')) {
        setCookie('passwordenc', p);
        password = p;
    }
    if (!getCookie('Server')) {
        setCookie('Server', s, { expires: 365 });
        baseURL = getCookie('Server') + '/rest';
    }
    window.location.href = getPathFromUrl(window.location);
}

var applicationName;
if (getCookie('ApplicationName')) {
    applicationName = getCookie('ApplicationName');
} else {
    applicationName = 'MiniSub';
}
if (getCookie('username')) {
    username = getCookie('username');
}
if (getCookie('passwordenc')) {
    password = getCookie('passwordenc');
} else {
    if (getCookie('password')) {
        password = 'enc:' + HexEncode(getCookie('password'));
    }
}
if (getCookie('password')) {
    setCookie('passwordenc', 'enc:' + HexEncode(getCookie('password')));
    setCookie('password', null);
}
if (getCookie('Protocol')) {
    protocol = 'jsonp';
}
var auth = makeBaseAuth(username, password.substring(4, password.length).hexDecode());
baseParams = 'u=' + username + '&p=' + password + '&f=' + protocol;
