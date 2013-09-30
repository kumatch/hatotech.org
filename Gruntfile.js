
module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');
    var async = require('async');
    var Paranoic = require('paranoic');

    var container = new Paranoic(__dirname + "/config/services.json");
    container.setParameter("path.root", __dirname);

    grunt.initConfig({
        realm: "hatotech",
        pkg: pkg,

        jade: {
            statics: {
                files: [
                    {
                        expand: true,
                        cwd: '_web/',
                        src: '**/*.jade',
                        dest: 'web/',
                        ext: '.html'
                    }
                ]
            }
        },

        concat: {
            options: {
                separator: ';'
            },
            imports: {
                src: [ "resources/imports/js/*.js" ],
                dest: "web/assets/js/imports.js"
            },
            hatotech: {
                src: [ "resources/hatotech/js/*.js" ],
                dest: "web/assets/js/<%= realm %>.js"
            }
        },

        uglify: {
            imports: {
                src: "<%= concat.imports.dest %>",
                dest: "web/assets/js/imports.min.js"
            },
            hatotech: {
                src: "<%= concat.hatotech.dest %>",
                dest: "web/assets/js/<%= realm %>.min.js"
            }
        },

        cssmin: {
            compress: {
                files: {
			        "./web/assets/css/imports.css": [ "./resources/imports/css/*.css" ],
			        "./web/assets/css/hatotech.css": [ "./resources/hatotech/css/*.css" ]
                }
            }
        },

        watch: {
            files: ['resources/**/*.css'],
            tasks: ['cssmin']
        }
    });

    grunt.registerTask('diary', 'Markdown で書かれた日記を HTML へ出力して書き出す', function (year, month) {
        if (!year)  year  = new Date().getFullYear();
        if (!month) month = new Date().getMonth() + 1;

        var printer = container.get('diary_printer');
        var done = this.async();

        printer(Number(year), Number(month), done);
    });

    grunt.registerTask('diary-all', 'Markdown で書かれたすべての日記を HTML へ出力して書き出す', function () {
        var navigator = container.get('diary_navigator');
        var printer = container.get('diary_printer');

        var done = this.async();

        navigator(function (err, navigation) {
            if (err) {
                done(err);
                return;
            }

            async.each(navigation.all, function (navi, next) {
                var year  = Number(navi.year);
                var month = Number(navi.month);

                printer(year, month, next);
            }, done);
        });
    });


    Object.keys(pkg.devDependencies).forEach(function (devDependency) {
        if (devDependency.match(/^grunt\-/)) {
            grunt.loadNpmTasks(devDependency);
        }
    });

    grunt.registerTask('default', []);
    grunt.registerTask('html',  [ "jade", "diary-all" ]);
    grunt.registerTask('js',    [ "concat", "uglify" ]);
    grunt.registerTask('css',   [ "cssmin" ]);
};