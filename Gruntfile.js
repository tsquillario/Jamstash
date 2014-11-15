// Generated on 2014-10-26 using generator-angular 0.9.8
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'app/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'app/**/*.js'

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Configurable paths for the application
  var appConfig = {
    app: require('./bower.json').appPath || 'app',
    dist: 'dist'
  };

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    yeoman: appConfig,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      bower: {
        files: ['bower.json'],
        tasks: ['wiredep']
      },
      js: {
        files: ['<%= yeoman.app %>/**/*.js', '!<%= yeoman.app %>/**/*_test.js'],
        tasks: ['karma:continuous:run'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      jsTest: {
        files: ['<%= yeoman.app %>/**/*_test.js'],
        tasks: ['karma:continuous:run'],
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        files: [
          '<%= yeoman.app %>/**/*.html',
          '<%= yeoman.app %>/styles/{,*/}*.css',
          '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      },
      options: {
        livereload: '<%= connect.options.livereload %>'
      }
    },

    // The actual grunt server settings
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          middleware: function (connect) {
            return [
              connect().use(
                '/bower_components',
                connect.static('./bower_components')
              ),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      test: {
      options: {
        port: 9001,
        middleware: function (connect) {
          return [
            connect().use(
              '/bower_components',
              connect.static('./bower_components')
            ),
            connect.static(appConfig.app)
          ];
        }
      }
      },
      dist: {
        options: {
          port: 9002,
          open: true,
          base: '<%= yeoman.dist %>'
        }
      }
    },

    // Test settings
    karma: {
      options: {
        configFile: './karma.conf.js',
      },
      unit: {
        singleRun: true,
        browsers: ['Chrome']
      },
      continuous: {
        singleRun: false,
        background: true,
        browsers: ['PhantomJS']
      }
    },

    // Automatically inject Bower components into the app
    wiredep: {
      app: {
        src: ['<%= yeoman.app %>/index.html'],
        ignorePath: /\.\.\//
      },
      test: {
        src: 'karma.conf.js',
        fileTypes: {
          js: {
            block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
            detect: {
                js: /'(.*\.js)'/gi
            },
            replace: {
                js: '\'{{filePath}}\','
            }
          }
        },
        devDependencies: true
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish'),
        force: true //TODO: while I work on correcting those errors, don't block the build
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= yeoman.app %>/**/*.js',
          '!<%= yeoman.app %>/vendor/**/*.js'
        ]
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/{,*/}*',
            '!<%= yeoman.dist %>/.git*'
          ]
        }]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>',
        flow: {
          html: {
            steps: {
              js: ['concat', 'uglifyjs'],
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },

    // Performs rewrites based on filerev and the useminPrepare configuration
    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
      js: ['<%= yeoman.dist %>/scripts/*.js'],
      options: {
        assetsDirs: ['<%= yeoman.dist %>','<%= yeoman.dist %>/images', '<%= yeoman.dist %>/styles'],
        patterns: {
          js: [
            [/(images\/albumdefault_50\.jpg)/, 'Replace javascript references to the album default image'],
            [/(images\/albumdefault_60\.jpg)/, 'Replace javascript references to the album default image'],
            [/(images\/albumdefault_160\.jpg)/, 'Replace javascript references to the album default image'],
            [/(styles\/Dark\.css)/, 'Replace javascript references to the theme CSS']
          ]
        }
      }
    },

    // Renames files for browser caching purposes
    filerev: {
      dist: {
        src: [
          '<%= yeoman.dist %>/scripts/{,*/}*.js',
          '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= yeoman.dist %>/styles/{,*/}*.css',
          '<%= yeoman.dist %>/styles/*.{png,jpg,jpeg,gif,webp,svg}', // images user by vendor plugins
          '<%= yeoman.dist %>/styles/fonts/*'
        ]
      }
    },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg,gif}',
          dest: '<%= yeoman.dist %>/images'
        },
        {
          expand: true,
          cwd: '.tmp/styles',
          src: '*.{png,jpg,jpeg,gif}',
          dest: '<%= yeoman.dist %>/styles'
        }]
      }
    },

    // Minify our CSS files but do not merge them, we still want to have two
    cssmin: {
      styles: {
        files: [{
          expand: true,
          cwd: '.tmp/styles',
          src: ['*.css', '!*.min.css'],
          dest: '<%= yeoman.dist %>/styles',
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true,
          removeOptionalTags: true
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: ['{,*/}*.html'],
          dest: '<%= yeoman.dist %>'
        }]
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          src: [
          '*.{ico,png,txt}',
          '.htaccess',
          '**/*.html',
          '**/*.json'
          ],
          dest: '<%= yeoman.dist %>'
        },
        {
          expand: true,
          cwd: '<%= yeoman.app %>',
          src: ['styles/{,*/}*.css'],
          dest: '.tmp'
        },
        // Special copy for all the files expected by the plugins
        {
          expand: true,
          flatten: true,
          src: [
            'bower_components/jplayer/skin/pink.flag/*.{jpg,gif,png}',
            'bower_components/fancybox/source/*.{png,gif}'
          ],
          dest: '.tmp/styles'
        }]
      }
    },

    // SSH files used to clean and deploy using sftp on a test server.
    // Be sure to .gitignore the .ssh/ folder !
    // testServer should contain :
    // {
    //    "host": 'my-test-server.com',
    //    "username": 'my-username-on-this-server',
    //    "password": 'include-only-if-not-using-private-key-below'
    // }
    sshconfig: {
      testServer: grunt.file.readJSON('.ssh/testServer.json')
    },
    // This is the private key for the username on the host defined in testServer.json
    testServerKey: grunt.file.read('.ssh/test-server-key'),
    // Removes everything at the deploy location to avoid filling up the server with revved files.
    sshexec: {
      cleanTest: {
        command: 'rm -rf /var/www/jamstash/*',
        options: {
          config: 'testServer',
          privateKey: '<%= testServerKey %>'
        }
      }
    },
    // Deploy with sftp to the test server
    sftp: {
      test: {
        files: {
          './': ['<%= yeoman.dist %>/{,*/}*', '<%= yeoman.dist %>/.git*']
        },
        options: {
          path: '/var/www/jamstash',
          srcBasePath: "dist/",
          config: 'testServer',
          privateKey: '<%= testServerKey %>',
          showProgress: true,
          createDirectories: true
        }
      }
    }

  });

  grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
        'wiredep',
        'karma:continuous',
        'connect:livereload',
        'watch'
      ]);
  });

  grunt.registerTask('test', [
    'karma:unit',
    'jshint'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'wiredep:app',
    'useminPrepare',
    'concat:generated',
    'copy:dist',
    'imagemin',
    //'ngAnnotate',
    'cssmin',
    'uglify:generated',
    'filerev',
    'usemin',
    'htmlmin'
  ]);

  grunt.registerTask('deploy', 'Build and deploy to test server', function() {
    return grunt.task.run([
      'build',
      'sshexec:cleanTest',
      'sftp:test'
    ]);
  });

  grunt.registerTask('default', [
    'test',
    'build'
  ]);
};
