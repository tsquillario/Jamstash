'use strict';
/**
* jamstash.persistence Module
*
* Provides load, save and delete operations for the current song and queue.
* Data storage provided by HTML5 localStorage.
*/
angular.module('jamstash.persistence', ['jamstash.settings', 'jamstash.player.service', 'jamstash.notifications', 'angular-locker'])

.config(['lockerProvider', function (lockerProvider) {
    lockerProvider.setDefaultDriver('local')
        .setDefaultNamespace('jamstash')
        .setEventsEnabled(false);
}])

.service('persistence', ['globals', 'player', 'notifications', 'locker', function(globals, player, notifications, locker){
    this.loadTrackPosition = function () {
        // Load Saved Song
        var song = locker.get('CurrentSong');
        if (song) {
            player.load(song);
        }
        if (globals.settings.Debug) { console.log('Current Position Loaded from localStorage: ', song); }
    };

    this.saveTrackPosition = function (song) {
        locker.put('CurrentSong', song);
        if (globals.settings.Debug) { console.log('Saving Current Position: ', song); }
    };

    this.deleteTrackPosition = function () {
        locker.forget('CurrentSong');
        if (globals.settings.Debug) { console.log('Removing Current Position from localStorage'); }
    };

    this.loadQueue = function () {
        // load Saved queue
        var queue = locker.get('CurrentQueue');
        if (queue) {
            player.addSongs(queue);
            if (player.queue.length > 0) {
                notifications.updateMessage(player.queue.length + ' Saved Song(s)', true);
            }
            if (globals.settings.Debug) { console.log('Play Queue Loaded from localStorage: ' + player.queue.length + ' song(s)'); }
        }
    };

    this.saveQueue = function () {
        locker.put('CurrentQueue', player.queue);
        if (globals.settings.Debug) { console.log('Saving Queue: ' + player.queue.length + ' songs'); }
    };

    this.deleteQueue = function () {
        locker.forget('CurrentQueue');
        if (globals.settings.Debug) { console.log('Removing Play Queue from localStorage'); }
    };

    this.getVolume = function () {
        return locker.get('Volume');
    };

    this.saveVolume = function (volume) {
        locker.put('Volume', volume);
    };

    this.deleteVolume = function () {
        locker.forget('Volume');
    };
}]);

