var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var async = require('async');
var jade = require('jade');
var markdown = require('markdown').markdown;
var sprintf = require('sprintf').sprintf;


module.exports = function (template_dir, output_dir) {

    var templates = {
        monthly: sprintf("%s/diary/monthly.jade", template_dir),
        before_after: sprintf("%s/diary/before_after.jade", template_dir),
        monthlies_link: sprintf("%s/diary/monthlies_link.jade", template_dir)
    };

    var index_html_filename = sprintf("%s/index.html", output_dir);

    var fs_options = { encoding: 'utf8' };



    function createMonthlyDiaryHtmlFilename(monthly) {
        return sprintf("%s/%04d%02d.html", output_dir, monthly.year, monthly.month);
    }

    function createMonthlyDiaryHtmlCacheFilename(monthly) {
        return sprintf("%s/_%04d%02d.html", output_dir, monthly.year, monthly.month);
    }

    return {
        printMonthlyDiary: function (monthly, callback) {
            if (!monthly.dailies.length) {
                callback(Error(sprintf('Error: no diaries in %d, %d', year, month)));
                return;
            }

            var output_filename = createMonthlyDiaryHtmlCacheFilename(monthly);

            var newer_files = monthly.dailies.sort(function (a, b) {
                if (a > b) return -1;
                if (a < b) return 1;
                return 0;
            });

            async.mapSeries(newer_files, function (filename, next) {
                var name = path.basename(filename, '.md');
                var day = Number(name.substr(-2, 2));

                fs.readFile(filename, fs_options, function (err, body) {
                    next(null, {
                        date: sprintf('%04d-%02d-%02d', monthly.year, monthly.month, day),
                        html: markdown.toHTML(body)
                    });
                });
            }, function (err, diaries) {
                var values = {
                    monthly: monthly,
                    diaries: diaries,
                    sprintf: sprintf
                };

                jade.renderFile(templates.monthly, values, function (err, html) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    fs.writeFile(output_filename, html, fs_options, callback);
                });
            });
        },

        printNavigation: function (monthlies, callback) {

            var newerMonthlies = _.sortBy(monthlies, function (monthly) {
                return Number(monthly.formatYearMonth()) * -1;
            });
            var yearsMonthlies = _.groupBy(newerMonthlies, function(monthly) {
                return monthly.year;
            });

            var monthlies_link_html = jade.renderFile(templates.monthlies_link,
                                                      { yearsMonthlies: yearsMonthlies });

            async.each(monthlies, function (monthly, next) {
                var cache_filename = createMonthlyDiaryHtmlCacheFilename(monthly);
                var diary_filename = createMonthlyDiaryHtmlFilename(monthly);

                var values = {
                    monthly: monthly
                };

                jade.renderFile(templates.before_after, { monthly: monthly }, function (err, before_after_html) {
                    if (err) {
                        next(err);
                        return;
                    }

                    fs.readFile(cache_filename, fs_options, function (err, data) {
                        if (err) {
                            next(err);
                            return;
                        }

                        var values = {
                            before_after_link: before_after_html,
                            monthlies_link: monthlies_link_html
                        };
                        var html = _.template(data, values);

                        fs.writeFile(diary_filename, html, fs_options, next);
                    });
                });
            }, callback);
        },

        printIndex: function (monthlies, callback) {
            var latestMonthly = _.max(monthlies, function (monthly) {
                return Number(monthly.formatYearMonth());
            });

            var source = createMonthlyDiaryHtmlFilename(latestMonthly);

            fs.exists(source, function (exist) {
                if (!exist) {
                    callback('a latest monthly diary not found.');
                    return;
                }

                var read  = fs.createReadStream(source);
                var write = fs.createWriteStream(index_html_filename);

                read.on("error", callback);
                write.on("error", callback);
                write.on("close", callback);

                read.pipe(write);
            });
        }
    };
};
