/**
* jamstash.selectedsongs Module
*
* Manages the list of selected songs accross the app to avoid duplicating
* those functions both in Subsonic and Archive.org contexts
*/
angular.module('jamstash.selectedsongs', ['ngLodash'])

.service('SelectedSongs', SelectedSongs);

SelectedSongs.$inject = ['lodash'];

function SelectedSongs(_) {
    'use strict';

    var self = this;
    _.extend(self, {
        add     : add,
        addSongs: addSongs,
        get     : get,
        remove  : remove,
        reset   : reset,
        toggle  : toggle
    });

    var selectedSongs = [];

    function add(song) {
        song.selected = true;
        selectedSongs.push(song);
        selectedSongs = _.uniq(selectedSongs);

        return self;
    }

    function addSongs(songs) {
        _.forEach(songs, function (song) {
            song.selected = true;
        });
        selectedSongs = _.union(selectedSongs, songs);

        return self;
    }

    function get() {
        return selectedSongs;
    }

    function remove(song) {
        var removedSong = _(selectedSongs).remove(function (selectedSong) {
           return selectedSong === song;
        }).first();
        _.set(removedSong, 'selected', false);

        return self;
    }

    function toggle(song) {
        if (song.selected) {
            self.remove(song);
        } else {
            self.add(song);
        }

        return self;
    }

    function reset() {
        _.forEach(selectedSongs, function (song) {
            song.selected = false;
        });
        selectedSongs = [];

        return self;
    }
}
