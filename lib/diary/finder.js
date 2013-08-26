var async = require('async');
var fs = require('fs');
var sprintf = require('sprintf').sprintf;


module.exports = function (root) {

    return {
        findMonthly: function (callback) {
            var _this = this;
            var entries = [];

            fs.readdir(root, function (err, years) {
                if (err) {
                    callback(err);
                    return;
                }

                async.each(years, function (year, next) {
                    if (!year.match(/^\d{4}$/)) {
                        next();
                        return;
                    }

                    var year_dir = root + "/" + year;

                    fs.readdir(year_dir, function (err, months) {
                        if (err) {
                            next(err);
                            return;
                        }

                        async.each(months, function (month, next) {
                            if (!month.match(/^\d{2}$/)) {
                                next();
                                return;
                            }

                            _this.findDailyByYearMonth(year, month, function (err, days) {
                                if (days.length) {
                                    entries.push({ year: Number(year), month: Number(month) });
                                };

                                next();
                            });
                        }, next);
                    });
                }, function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, entries.sort(function (a, b) {
                            if (a.year > b.year) return 1;
                            if (a.year < b.year) return -1;
                            if (a.month > b.month) return 1;
                            if (a.month < b.month) return -1;
                            return 0;
                        }));
                    }
                });
            });
        },

        findDailyByYearMonth: function (year, month, callback) {
            var dir = sprintf('%s/%04d/%02d', root, Number(year), Number(month));

            fs.readdir(dir, function (err, files) {
                if (err) {
                    callback(err);
                    return;
                }

                var filenames = [];

                async.each(files, function (file, next) {
                    if (file.match(/^\d{8}\.md$/)) {
                        filenames.push( dir + "/" + file);
                    }
                    next();
                }, function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, filenames.sort());
                    }
                });
            });
        }
    };
};
