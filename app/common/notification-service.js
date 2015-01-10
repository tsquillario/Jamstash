/**
* jamstash.notifications Module
*
* Provides access to the notification UI.
*/
angular.module('jamstash.notifications', ['jamstash.player.service', 'jamstash.utils'])

.service('notifications', ['$rootScope', '$window', '$interval', 'globals', 'player', 'utils',
    function($rootScope, $window, $interval, globals, player, utils) {
    'use strict';

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
        if (this.isSupported() && !this.hasPermission()) {
            window.Notify.requestPermission();
        }
    };
    this.hasPermission = function () {
        return !$window.Notify.needsPermission();
    };
    this.isSupported = function () {
        return window.Notify.isSupported();
    };

    this.showNotification = function (song) {
        if (this.hasPermission()) {
            var notification = new Notify(utils.toHTML.un(song.name), {
                body: utils.toHTML.un(song.artist + " - " + song.album),
                icon: song.coverartthumb,
                notifyClick: function () {
                    player.nextTrack();
                    this.close();
                    $rootScope.$apply();
                }
            });
            $interval(function() {
                notification.close();
            }, globals.settings.Timeout);
            notification.show();
        } else {
            console.log("showNotification: No Permission");
        }
    };
}]);
