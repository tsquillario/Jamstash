/**
* jamstash.repeat.directive Module
*
* Triple-state button to toggle between repeating the entire playing queue, the current playing song and disabling repeat
*/
angular.module('jamstash.repeat.directive', ['jamstash.notifications'])

.directive('jamstashRepeat', ['notifications', function (notifications) {
    'use strict';
    return {
        restrict: 'E',
        templateUrl: 'player/repeat-directive/repeat-directive.html',
        replace: true,
        scope: {
            selectedValue: '=',
            values: '='
        },
        link: function ($scope) {
            $scope.$watch('selectedValue', function (newVal) {
                $scope.selectedIndex = $scope.values.indexOf(newVal);
            });
            $scope.cycleRepeat = function () {
                $scope.selectedIndex = ($scope.selectedIndex + 1) % $scope.values.length;
                $scope.selectedValue = $scope.values[$scope.selectedIndex];
                notifications.updateMessage('Repeat ' + $scope.selectedValue, true);
            };
        }
    };
}]);
