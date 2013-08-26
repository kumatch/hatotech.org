
angular.module('HatotechDiary', []).filter('format', function () {
    var sprintf = function (str) {
        var args = Array.prototype.slice.call(arguments, 1);
        return str.replace(/%0(\d+)d/g, function(m, num) {
            var r = String(args.shift());
            var c = '';
            num = parseInt(num) - r.length;
            while (--num >= 0) c += '0';
            return c + r;
        }).replace(/%[sdf]/g, function(m) { return sprintf._SPRINTF_HASH[m](args.shift()); });
    };
    sprintf._SPRINTF_HASH = {
        '%s': String,
        '%d': parseInt,
        '%f': parseFloat
    };

    return function(input, format) {
        return sprintf(format, input);
    };
});


function HatotechDiaryNavigationController ($scope, $http) {

    $scope.navigation = {};

    // $scope.navigation = {
    //     years: [
    //         {
    //             year: 2013,
    //             monthly: [
    //                 { year: 2013, month: 10, before: { year: 2013, month: 9 }, after: null },
    //                 { year: 2013, month: 9, before: { year: 2013, month: 8 },  after: { year: 2013, month: 10 } },
    //                 { year: 2013, month: 8, before: { year: 2012, month: 12 },  after: { year: 2013, month: 9 } }
    //             ]
    //         },
    //         {
    //             year: 2012,
    //             monthly: [
    //                 { year: 2012, month: 12, before: { year: 2012, month: 11 }, after: { year: 2013, month: 8 } },
    //                 { year: 2012, month: 11, before: null,  after: { year: 2012, month: 12 } }
    //             ]
    //         }
    //     ]
    // };

    $scope.current_date = { year: null, month: null };
    $scope.before_date  = null;
    $scope.after_date   = null;
    $scope.a = "year";

    $http.get('/diary/navigation.json').success(function(navigation) {
        $scope.navigation = navigation;

        var current_year  = Number($scope.current_date.year);
        var current_month = Number($scope.current_date.month);

        angular.forEach(navigation.years, function (year_info) {
            if (year_info.year != current_year) return;

            angular.forEach(year_info.monthly, function (month_info) {
                if (month_info.month != current_month) return;

                $scope.before_date = month_info.before;
                $scope.after_date  = month_info.after;
            });
        });
    });
};

HatotechDiaryNavigationController.$inject = ['$scope', '$http'];