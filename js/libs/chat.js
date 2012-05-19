var starttime;
var updater;
function updateChatMessages() {
    updater = $.periodic({ period: 1000, decay: 1.5, max_period: 1800000 }, function () {
        $.ajax({
            periodic: this,
            url: baseURL + '/getChatMessages.view?u=' + username + '&p=' + passwordenc + '&v=' + version + '&c=' + applicationName + '&f=jsonp&since=' + starttime,
            method: 'GET',
            dataType: 'jsonp',
            timeout: 10000,
            beforeSend: function (req) {
                req.setRequestHeader('Authorization', auth);
            },
            success: function (data) {
                if (data["subsonic-response"].chatMessages.chatMessage === undefined) {
                    this.periodic.increment();
                } else {
                    var msgs = [];
                    if (data["subsonic-response"].chatMessages.chatMessage.length > 0) {
                        msgs = data["subsonic-response"].chatMessages.chatMessage;
                    } else {
                        msgs[0] = data["subsonic-response"].chatMessages.chatMessage;
                    }
                    this.periodic.reset();
                    var sorted = msgs.sort(function (a, b) {
                        return a.time - b.time;
                    });
                    var x = 1;
                    $.each(sorted, function (i, msg) {
                        var chathtml = '<div class=\"msg\">';
                        chathtml += '<span class=\"time\">' + $.format.date(new Date(parseInt(msg.time, 10)), 'hh:mm:ss a') + '</span> ';
                        chathtml += '<span class=\"user\">' + msg.username + '</span></br>';
                        chathtml += '<span class=\"msg\">' + msg.message + '</span>';
                        chathtml += '</div>';
                        $(chathtml).appendTo("#ChatMsgs");
                        if (x === sorted.length) {
                            starttime = msg.time;
                        }
                        x++;
                    });
                    $("#ChatMsgs").linkify();
                    $("#ChatMsgs").attr({ scrollTop: $("#ChatMsgs").attr("scrollHeight") });
                }
            }
        });
    });
}
function stopUpdateChatMessages() {
    updater.cancel();
}
function addChatMessage(msg) {
    $.ajax({
        type: 'GET',
        url: baseURL + '/addChatMessage.view',
        dataType: 'jsonp',
        timeout: 10000,
        data: { u: username, p: passwordenc, v: version, c: applicationName, f: "jsonp", message: msg },
        beforeSend: function (req) {
            req.setRequestHeader('Authorization', auth);
        },
        success: function () {
            updater.reset();
        },
        traditional: true // Fixes POST with an array in JQuery 1.4
    });
}
