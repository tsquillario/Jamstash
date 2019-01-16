// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2014-10-26 using
// generator-karma 0.8.3

module.exports = function (config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // base path, that will be used to resolve files and exclude
    basePath: '.',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      // bower:
      'bower_components/jquery/dist/jquery.js',
      'bower_components/jquery-ui/jquery-ui.js',
      'bower_components/jplayer/dist/jplayer/jquery.jplayer.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-route/angular-route.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/jquery-mousewheel/jquery.mousewheel.js',
      'bower_components/fancybox/source/jquery.fancybox.js',
      'bower_components/notify.js/notify.js',
      'bower_components/jquery.scrollTo/jquery.scrollTo.js',
      'bower_components/jquery-dateFormat/dist/jquery-dateFormat.js',
      'bower_components/angular-locker/dist/angular-locker.min.js',
      'bower_components/ng-lodash/build/ng-lodash.js',
      'bower_components/angular-ui-sortable/sortable.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/jasmine-promise-matchers/dist/jasmine-promise-matchers.js',
      'bower_components/jasmine-fixture/dist/jasmine-fixture.js',
      // endbower
      'app/**/*.js',
      'app/**/*_test.js',
      'app/**/*.html'
    ],

    // list of files / patterns to exclude
    // exclude: ['app/vendor/**/*.js'],

    preprocessors: {
      'app/**/!(*_test).js': ['coverage'],
      'app/**/*.html': ['ng-html2js']
    },

    ngHtml2JsPreprocessor: {
        stripPrefix: 'app/',
        moduleName: 'templates'
    },

    // web server port
    port: 8080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
