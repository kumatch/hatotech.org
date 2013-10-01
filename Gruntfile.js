
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

    grunt.registerTask('diary', 'Markdown で書かれた日記を HTML へ出力化', function (year, month) {
        year = year   ? Number(year)  : new Date().getFullYear();
        month = month ? Number(month) : new Date().getMonth() + 1;

        var Monthly = container.get('diary_monthly');
        var Printer = container.get('diary_printer');

        var monthly = Monthly.get(year, month);

        if (!monthly) {
            grunt.fail.fatal("undefined monthly diary " + year + "-" + month);
        }

        grunt.task.run([ 'diary-after' ]);

        var done = this.async();
        Printer.printMonthlyDiary(monthly, done);
    });

    grunt.registerTask('diary-all', 'Markdown で書かれたすべての日記を HTML へ出力化', function () {
        var Monthly = container.get('diary_monthly');
        var Printer = container.get('diary_printer');

        var monthlies = Monthly.find();
        var done = this.async();

        grunt.task.run([ 'diary-after' ]);
        async.each(monthlies, Printer.printMonthlyDiary, done);
    });


    grunt.registerTask('diary-after', '日記 HTML 作成の後処理', function () {
        var Monthly = container.get('diary_monthly');
        var Printer = container.get('diary_printer');

        var monthlies = Monthly.find();
        var done = this.async();

        Printer.printNavigation(monthlies, function (err) {
            if (err) {
                done(err);
            } else {
                Printer.printIndex(monthlies, done);
            }
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