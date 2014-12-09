/**
* jamstash.notifications Module
*
* Provides access to the notification UI.
*/
angular.module('jamstash.notifications', [])

.service('notifications', ['$rootScope', 'globals', function($rootScope, globals) {
    'use strict';

    var msgIndex = 1;
    this.updateMessage = function (msg, autohide) {
        if (msg !== '') {
            var id = $rootScope.Messages.push(msg) - 1;
            $('#messages').fadeIn();
            if (autohide) {
                setTimeout(function () {
                    $('#msg_' + id).fadeOut(function () { $(this).remove(); });
                }, globals.settings.Timeout);
            }
        }
    };
    this.requestPermissionIfRequired = function () {
        if (window.Notify.isSupported() && window.Notify.needsPermission()) {
            window.Notify.requestPermission();
        }
    };
    this.hasNotificationPermission = function () {
        return (window.Notify.needsPermission() === false);
    };
    this.hasNotificationSupport = function () {
        return window.Notify.isSupported();
    };
    var notifications = [];

    this.showNotification = function (pic, title, text, type, bind) {
        if (this.hasNotificationPermission()) {
            //closeAllNotifications()
            var settings = {};
            if (bind = '#NextTrack') {
                settings.notifyClick = function () {
                    $rootScope.nextTrack();
                    this.close();
                };
            }
            if (type === 'text') {
                settings.body = text;
                settings.icon = pic;
            } else if (type === 'html') {
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
    };
    this.closeAllNotifications = function () {
        for (var notification in notifications) {
            notifications[notification].close();
        }
    };
}]);