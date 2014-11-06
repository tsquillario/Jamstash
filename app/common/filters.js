'use strict';

var jamstash = angular.module('JamStash');

/* Filters */
jamstash.filter('capitalize', function () {
    return function (input, scope) {
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
});
jamstash.filter('musicfolder', function () {
    return function (items, scope) {
        return items.slice(1, items.length);
    };
});
jamstash.filter('capitalize', function () {
    return function (input, scope) {
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
});