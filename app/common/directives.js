'use strict';

angular.module('JamStash').directive('sortable', function () {
    return {
        link: function (scope, elm, attrs) {
            elm.sortable({
                start: scope.dragStart,
                update: scope.dragEnd
            });
            elm.disableSelection();
        }
    };
})
/*
.directive('split', function () {
    return {
        link: function (scope, elm, attrs) {
            elm.splitPane();
        }
    };
})
*/
.directive('fancybox', ['$compile', function($compile){
    return {
        restrict: 'A',
        replace: false,
        link: function($scope, element, attrs) {
            $scope.fancyboxOpen = function() {
                var el = angular.element(element.html()),
                compiled = $compile(el);
                $.fancybox.open(el);
                compiled($scope);
            };
            $scope.fancyboxOpenUrl = function () {
                var el = angular.element(element.html()),
                compiled = $compile(el);
                $.fancybox.open(el);
                compiled($scope);
            };
        }
    };
}])
.directive('songpreview', ['$compile', 'subsonic', function ($compile, subsonic) {
    return {
        restrict: 'E',
        templateUrl: 'common/songs.html',
        replace: false,
        // pass these two names from attrs into the template scope
        scope: {
            song: '@'
        },
        link: function (scope, element, attrs) {
            subsonic.getSongTemplate(function (data) {
                scope.song = data;
                //var el = angular.element(element.html()),
                //var el = element.html(),
                //compiled = $compile(el);
                $.fancybox.open(element);
                //compiled($scope);
            });
        }
    };
}])
.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
})
.directive('ngEnter', function () {
    return {
        scope: { onEnter: '&' },
        link: function (scope, element) {
            console.log(scope);
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.onEnter();
                    scope.$apply();
                }
            });
        }
    };
})
.directive('ngDownload', ['$compile', function ($compile) {
    return {
        restrict: 'E',
        scope: { data: '=' },
        link: function (scope, elm, attrs) {
            function getUrl() {
                return URL.createObjectURL(new Blob([JSON.stringify(scope.data)], { type: "application/json" }));
            }

            elm.append($compile(
                    '<a class="button" download="backup.json"' +
                    'href="' + getUrl() + '">' +
                    'Download' +
                    '</a>'
            )(scope));

            scope.$watch(scope.data, function () {
                elm.children()[0].href = getUrl();
            });
        }
    };
}])
.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
})
.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});