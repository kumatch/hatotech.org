var fs = require('fs');
var path = require('path');
var async = require('async');
var jade = require('jade');
var markdown = require('markdown').markdown;
var sprintf = require('sprintf').sprintf;


var outputNavigationJson = function (navigation, output_dir, callback) {
    var filename = sprintf("%s/navigation.json", output_dir);

    fs.writeFile(filename, JSON.stringify(navigation), callback);
};

var outputMonthDiaryHtml = function (diaries, template_dir, output_dir, year, month, callback) {
    var template = sprintf("%s/diary/diary_template.jade", template_dir);
    var filename = sprintf("%s/%04d%02d.html", output_dir, year, month);

    var values = {
        diaries: diaries,
        year: year,
        month: month,

        sprintf: sprintf
    };

    jade.renderFile(template, values, function (err, html) {
        if (err) {
            callback(err);
            return;
        }

        fs.writeFile(filename, html, callback);
    });
};

var outputDiaryIndexHtml = function (diary_dir, year, month, callback) {
    var source = sprintf("%s/%04d%02d.html", diary_dir, year, month);
    var index  = sprintf("%s/index.html",    diary_dir);

    fs.exists(source, function (exist) {
        if (!exist) {
            callback();
            return;
        }

        var read  = fs.createReadStream(source);
        var write = fs.createWriteStream(index);

        read.on("error", callback);
        write.on("error", callback);
        write.on("close", callback);

        read.pipe(write);
    });
};



module.exports = function (navigator, finder, template_dir, output_dir) {

    return function (year, month, callback) {
        var last_year_month;

        async.waterfall([
            function (next) {
                navigator(next);
            },

            function (navigation, next) {
                last_year_month = navigation.all[ navigation.all.length - 1 ];

                outputNavigationJson(navigation, output_dir, next);
            },

            function (next) {
                finder.findDailyByYearMonth(year, month, next);
            },

            function (diary_files, next) {
                if (!diary_files.length) {
                    next(Error(sprintf('Error: no diaries in %d, %d', year, month)));
                    return;
                }

                var newer_files = diary_files.sort(function (a, b) {
                    if (a > b) return -1;
                    if (a < b) return 1;
                    return 0;
                });

                async.mapSeries(newer_files, function (filename, next) {
                    var name = path.basename(filename, '.md');
                    var day = Number(name.substr(-2, 2));

                    fs.readFile(filename, { encoding: 'utf8' }, function (err, body) {
                        next(null, {
                            date: sprintf('%04d-%02d-%02d', year, month, day),
                            html: markdown.toHTML(body)
                        });
                    });
                }, next);
            },

            function (diaries, next) {
                outputMonthDiaryHtml(diaries, template_dir, output_dir, year, month, next);
            },

            function (next) {
                outputDiaryIndexHtml(output_dir, last_year_month.year, last_year_month.month, next);
            }
        ], callback);
    };
};
