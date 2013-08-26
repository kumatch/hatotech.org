var async = require('async');
var fs = require('fs');

var NavigationInfo = function (data) {
    return {
        year: data.year,
        month: data.month,
        before: data.before,
        after: data.after
    };
};

module.exports = function (finder) {

    return function (callback) {
        var year_month = {};

        finder.findMonthly(function (err, entries) {
            if (err) {
                callback(err);
                return;
            }

            entries.forEach(function (entry, i) {
                var before, after;

                if (i > 0) before = entries[i - 1];
                if (i < entries.length) after = entries[i + 1];

                var info = NavigationInfo({
                    year: entry.year,
                    month: entry.month,
                    before: before || null,
                    after: after || null
                });

                if (!year_month[entry.year]) {
                    // year_month[entry.year] = {};
                    year_month[entry.year] = [];
                }

                //year_month[entry.year][entry.month] = info;
                year_month[entry.year].push(info);
            });


            var years = [];

            Object.keys(year_month).forEach(function (year) {
                years.push({
                    year: Number(year),
                    monthly: year_month[year]
                });
            });

            callback(null, {
                // year_month: year_month,
                years: years,
                all: entries
            });
        });
    };
};
