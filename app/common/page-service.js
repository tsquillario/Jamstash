/**
* jamstash.page Module
*
* Set the page's title from anywhere, the angular way
*/
angular.module('jamstash.page', ['jamstash.settings.service', 'jamstash.utils'])

.factory('Page', ['$interval', 'globals', 'utils', function($interval, globals, utils){
    'use strict';

    var title = 'Jamstash';
    var timer;
    return {
        title: function() { return title; },
        setTitle: function(newTitle) {
            title = newTitle;
            return this;
        },
        setTitleSong: function(song) {
            if (song.artist !== undefined && song.name !== undefined) {
                title = utils.toHTML.un(song.artist) + " - " + utils.toHTML.un(song.name);
            } else {
                title = 'Jamstash';
            }
            if (globals.settings.ScrollTitle) {
                this.scrollTitle();
            }

            return this;
        },
        scrollTitle: function() {
            var shift = {
                "left": function (a) {
                    a.push(a.shift());
                },
                "right": function (a) {
                    a.unshift(a.pop());
                }
            };
            var opts = {
                text: title,
                dir: "left",
                speed: 1200
            };

            var t = (opts.text).split("");
            if (!t) {
                return;
            }
            t.push(" ");
            if (timer !== undefined) {
                $interval.cancel(timer);
            }
            timer = $interval(function () {
                var f = shift[opts.dir];
                if (f) {
                    f(t);
                    title = t.join("");
                }
            }, opts.speed);
            return this;
        }
    };
}]);
