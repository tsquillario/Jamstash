'use strict';

/* Filters */
angular.module('JamStash').filter('capitalize', function () {
    return function (input, scope) {
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
})
.filter('musicfolder', function () {
    return function (items, scope) {
        return items.slice(1, items.length);
    };
})
.filter('capitalize', function () {
    return function (input, scope) {
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
});