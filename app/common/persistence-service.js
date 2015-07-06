/**
* jamstash.persistence Module
*
* Provides load, save and delete operations for the current song and queue.
* Data storage provided by HTML5 localStorage.
*/
angular.module('jamstash.persistence', [
    'ngLodash',
    'angular-locker',
    'jamstash.settings.service',
    'jamstash.player.service',
    'jamstash.notifications',
    'jamstash.utils'
])

.config(['lockerProvider', lockerConfig])

.service('persistence', persistenceService)

.value('jamstashVersionChangesets', {
    // jshint strict: false
    versions: [
        {
            version: '4.4.5',
            changeset: function (settings) {
                settings.DefaultSearchType = 0;
            }
        }
    ]
});

lockerConfig.$inject = ['lockerProvider'];

function lockerConfig(lockerProvider) {
    'use strict';
    lockerProvider.setDefaultDriver('local')
        .setDefaultNamespace(false)
        .setEventsEnabled(false);
}

persistenceService.$inject = [
    'lodash',
    'globals',
    'player',
    'notifications',
    'locker',
    'json',
    'jamstashVersionChangesets',
    'utils'
];

function persistenceService(_, globals, player, notifications, locker, json, jamstashVersionChangesets, utils) {
    'use strict';

    const CURRENT_SONG  = 'CurrentSong',
          CURRENT_QUEUE = 'CurrentQueue',
          VOLUME        = 'Volume',
          MUSIC_FOLDERS = 'MusicFolders',
          GENRES        = 'GenrePlaylists',
          SETTINGS      = 'Settings',
          VERSION       = 'JamstashVersion';

    // jshint validthis: true
    var self = this;
    _.extend(self, {
        loadTrackPosition        : loadTrackPosition,
        saveTrackPosition        : saveTrackPosition,
        deleteTrackPosition      : deleteTrackPosition,
        loadQueue                : loadQueue,
        saveQueue                : saveQueue,
        deleteQueue              : deleteQueue,
        getVolume                : getVolume,
        saveVolume               : saveVolume,
        deleteVolume             : deleteVolume,
        getSelectedMusicFolder   : getSelectedMusicFolder,
        saveSelectedMusicFolder  : saveSelectedMusicFolder,
        deleteSelectedMusicFolder: deleteSelectedMusicFolder,
        saveSelectedGenreNames   : saveSelectedGenreNames,
        loadSelectedGenreNames   : loadSelectedGenreNames,
        deleteSelectedGenreNames : deleteSelectedGenreNames,
        getSettings              : getSettings,
        saveSettings             : saveSettings,
        deleteSettings           : deleteSettings,
        getVersion               : getVersion,
        upgradeVersion           : upgradeVersion
    });

    return self;

    function loadTrackPosition() {
        // Load Saved Song
        var song = locker.get(CURRENT_SONG);
        if (song) {
            player.load(song);
        }
        if (globals.settings.Debug) { console.log('Current Position Loaded from localStorage: ', song); }
    }

    function saveTrackPosition(song) {
        locker.put(CURRENT_SONG, song);
        if (globals.settings.Debug) { console.log('Saving Current Position: ', song); }
    }

    function deleteTrackPosition() {
        locker.forget(CURRENT_SONG);
        if (globals.settings.Debug) { console.log('Removing Current Position from localStorage'); }
    }

    function loadQueue() {
        // load Saved queue
        var queue = locker.get(CURRENT_QUEUE);
        if (queue) {
            player.addSongs(queue);
            if (player.queue.length > 0) {
                notifications.updateMessage(player.queue.length + ' Saved Song(s)', true);
            }
            if (globals.settings.Debug) { console.log('Play Queue Loaded from localStorage: ' + player.queue.length + ' song(s)'); }
        }
    }

    function saveQueue() {
        locker.put(CURRENT_QUEUE, player.queue);
        if (globals.settings.Debug) { console.log('Saving Queue: ' + player.queue.length + ' songs'); }
    }

    function deleteQueue() {
        locker.forget(CURRENT_QUEUE);
        if (globals.settings.Debug) { console.log('Removing Play Queue from localStorage'); }
    }

    function getVolume() {
        var volume = locker.get(VOLUME);
        if (volume === undefined) {
            locker.put(VOLUME, 1.0);
            volume = 1.0;
        }
        return volume;
    }

    function saveVolume(volume) {
        locker.put(VOLUME, volume);
    }

    function deleteVolume() {
        locker.forget(VOLUME);
    }

    function getSelectedMusicFolder() {
        return locker.get(MUSIC_FOLDERS);
    }

    function saveSelectedMusicFolder(selectedMusicFolder) {
        locker.put(MUSIC_FOLDERS, selectedMusicFolder);
    }

    function deleteSelectedMusicFolder() {
        locker.forget(MUSIC_FOLDERS);
    }

    function saveSelectedGenreNames(selectedGenreNames) {
        locker.put(GENRES, selectedGenreNames);
    }

    function loadSelectedGenreNames() {
        var selectedGenreNames = locker.get(GENRES);
        if (selectedGenreNames === undefined) {
            selectedGenreNames = [];
        }
        return selectedGenreNames;
    }

    function deleteSelectedGenreNames() {
        locker.forget(GENRES);
    }

    function getSettings() {
        // If the latest version from changelog.json is newer than the version stored in local storage,
        // we upgrade it
        var storedVersion = self.getVersion();
        json.getChangeLog(function (changelogs) {
            var changelogVersion = changelogs[0].version;
            if (utils.checkVersionNewer(changelogVersion, storedVersion)) {
                self.upgradeVersion(storedVersion, changelogVersion);
            }
        });
        return locker.get(SETTINGS);
    }

    function saveSettings(settings) {
        locker.put(SETTINGS, settings);
    }

    function deleteSettings() {
        locker.forget(SETTINGS);
    }

    function getVersion() {
        return locker.get(VERSION);
    }

    function upgradeVersion(currentVersion, finalVersion) {
        var settings = locker.get(SETTINGS);
        // Apply all upgrades older than the final version and newer than the current
        var allUpgrades = _.filter(jamstashVersionChangesets.versions, function (toApply) {
            var olderOrEqualToFinal = utils.checkVersion(finalVersion, toApply.version);
            var newerThanCurrent = utils.checkVersionNewer(toApply.version, currentVersion);
            return olderOrEqualToFinal && newerThanCurrent;
        });
        _.forEach(allUpgrades, function (versionUpg) {
            versionUpg.changeset(settings);
        });
        self.saveSettings(settings);
        locker.put(VERSION, finalVersion);
        notifications.updateMessage('Version ' + currentVersion + ' to ' + finalVersion, true);
    }
}
