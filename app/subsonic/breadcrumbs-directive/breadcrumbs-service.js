/**
* jamstash.breadcrumbs.service Module
*
* Provides operations to read the Breadcrumbs' state and add or remove
* items to the list.
*/
angular.module('jamstash.breadcrumbs.service', ['ngLodash'])

.factory('breadcrumbs', ['lodash', function (_) {
    'use strict';

    var list = [];

    var service = {
        get: function () {
            return list;
        },
        push: function (item) {
            var breadcrumb = {
                id: item.id,
                name: item.name
            };
            list.push(breadcrumb);
            return service;
        },
        popUntil: function (item) {
            var found = _.find(list, function (crumb) {
                return equalBreadcrumb(crumb, item);
            });
            if (! found) {
                return service;
            }
            list = _.dropRightWhile(list, function (crumb) {
                return !(equalBreadcrumb(crumb, item));
            });
            return service;
        },
        reset: function () {
            list = [];
            return service;
        }
    };

    function equalBreadcrumb(first, second) {
        return first.id === second.id && first.name === second.name;
    }

    return service;
}]);
