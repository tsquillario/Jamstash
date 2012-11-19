var starttime;
var updater;
function updateChatMessages() {
    updater = $.periodic({ period: 1000, decay: 1.5, max_period: 1800000 }, function () {
        $.ajax({
            periodic: this,
            url: baseURL + '/getChatMessages.view?u=' + username + '&p=' + password + '&v=' + apiVersion + '&c=' + applicationName + '&f=json&since=' + starttime,
            method: 'GET',
            dataType: 'json',
            timeout: 10000,
            success: function (data) {
                if (data["subsonic-response"].chatMessages.chatMessage === undefined) {
                    if (debug) { console.log('ChatMessages Delay: ' + this.periodic.cur_period); }
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
        url: baseURL + '/addChatMessage.view?u=' + username + '&p=' + password,
        dataType: 'json',
        timeout: 10000,
        data: { v: apiVersion, c: applicationName, f: "json", message: msg },
        success: function () {
            updater.reset();
        },
        traditional: true // Fixes POST with an array in JQuery 1.4
    });
}
