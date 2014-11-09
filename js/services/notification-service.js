'use strict';

var jamstash = angular.module('JamStash');

jamstash.service('notifications', function ($rootScope, globals) {
    var msgIndex = 1;
    this.updateMessage = function (msg, autohide) {
        if (msg != '') {
            var id = msgIndex;
            $('#messages').append('<span id=\"msg_' + id + '\" class="message">' + msg + '</span>');
            $('#messages').fadeIn();
            $("#messages").scrollTo('100%');
            var el = '#msg_' + id;
            if (autohide) {
                setTimeout(function () {
                    $(el).fadeOut(function () { $(this).remove(); });
                }, globals.settings.Timeout);
            } else {
                $(el).click(function () {
                    $(el).fadeOut(function () { $(this).remove(); });
                    return false;
                });
            }
            msgIndex++;
        }
    }
    this.requestPermissionIfRequired = function () {
        if (window.Notify.isSupported() && window.Notify.needsPermission()) {
            window.Notify.requestPermission();
        }
    }
    this.hasNotificationPermission = function () {
        return (window.Notify.needsPermission() === false);
    }
    this.hasNotificationSupport = function () {
        return window.Notify.isSupported();
    }
    var notifications = new Array();

    this.showNotification = function (pic, title, text, type, bind) {
        if (this.hasNotificationPermission()) {
            //closeAllNotifications()
            var settings = {}
            if (bind = '#NextTrack') {
                settings.notifyClick = function () {
                    $rootScope.nextTrack();
                    this.close();
                };
            }
            if (type == 'text') {
                settings.body = text;
                settings.icon = pic;
            } else if (type == 'html') {
                settings.body = text;
            }
            var notification = new Notify(title, settings);
            notifications.push(notification);
            setTimeout(function (notWin) {
                notWin.close();
            }, globals.settings.Timeout, notification);
            notification.show();
        } else {
            console.log("showNotification: No Permission");
        }
    }
    this.closeAllNotifications = function () {
        for (notification in notifications) {
            notifications[notification].close();
        }
    }
});