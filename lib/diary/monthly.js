var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var sprintf = require('sprintf').sprintf;

function Monthly (year, month) {
    this.year = Number(year);
    this.month = Number(month);
    this.dailies = [];

    this.before = null;
    this.after = null;
}

Monthly.prototype.addDaily = function (daily_path) {
    this.dailies.push(daily_path);
};

Monthly.prototype.formatYearMonth = function(separator) {
    return sprintf('%04d%s%02d', this.year, separator || '', this.month);
};

Monthly.prototype.isMatches = function (year, month) {
    return (Number(year) === Number(this.year)
            && Number(month) === Number(this.month)
            );
};



module.exports = function (diary_path) {

    return {
        find: function () {
            var years = fs.readdirSync(diary_path);
            var monthlies = [];

            _.each(years, function (year) {
                if (!year.match(/^\d{4}$/)) return;

                var yearly_directory = diary_path + "/" + year;
                var months = fs.readdirSync(yearly_directory);

                _.each(months, function (month) {
                    if (!month.match(/^\d{2}$/)) return;

                    var monthly_directory = yearly_directory + "/" + month;

                    var monthly = new Monthly(year, month);
                    var files = fs.readdirSync(monthly_directory);

                    _.each(files.sort(), function (file) {
                        if (file.match(/^\d{8}\.md$/)) {
                            monthly.addDaily(monthly_directory + "/" + file);
                        }
                    });

                    monthlies.push(monthly);
                });
            });

            monthlies = _.sortBy(monthlies, function (monthly) {
                return Number(monthly.formatYearMonth());
            });

            return _.map(monthlies, function (monthly, index) {
                if (index > 0) {
                    monthly.before = monthlies[index - 1];
                }

                if (index < monthlies.length) {
                    monthly.after = monthlies[index + 1];
                }

                return monthly;
            });
        },

        get: function (year, month) {
            return _.find(this.find(), function (monthly) {
                return monthly.isMatches(year, month);
            });
        }
    };
};
