angular.module('umeran', ['chart.js'])
.controller('umeranController', ['umeranJsonService', '$scope', function(umeranJsonService, $scope) {
    umeranJsonService()
        .then(function(data) {
            $scope.masterData = data;
        })
        .catch((reason) => console.log(reason));
}]).controller('umeranChartController', ['umeranJsonService', '$scope', function(umeranJsonService, $scope) {
    Chart.defaults.global.elements.line.tension = 0;
    umeranJsonService()
        .then(function(masterData) {
            var charts = $scope.charts = {
                totalVisitsDates: {},
                totalVisitsHours: {"00":0,"01":0,"02":0,"03":0,"04":0,"05":0,"06":0,"07":0,"08":0,"09":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0},
                totalVisitsBrowsers: {},
                totalVisitsPlatforms: {}
            };
            var options = $scope.charts.options = {
                totalVisitsDates: {tension: 0},
                totalVisitsHours: {tension: 0},
                totalVisitsBrowsers: {},
                totalVisitsPlatforms: {}
            };
            for (var i=0; i<masterData.records.length; i++) {
                var record = masterData.records[i];
                var hour = record.timestamp.substring(11, 13);
                if (!charts.totalVisitsHours[hour])
                    charts.totalVisitsHours[hour] = 1;
                else
                    charts.totalVisitsHours[hour] += 1;
                var date = record.timestamp.substring(0, 10);
                if (!charts.totalVisitsDates[date])
                    charts.totalVisitsDates[date] = 1;
                else
                    charts.totalVisitsDates[date] += 1;
                var browser = window.useragent.guess_browser(record['user-agent']).browser;
                if (!charts.totalVisitsBrowsers[browser])
                    charts.totalVisitsBrowsers[browser] = 1;
                else
                    charts.totalVisitsBrowsers[browser] += 1;
                var platform = window.useragent.guess(record['user-agent']).os;
                if (!charts.totalVisitsPlatforms[platform])
                    charts.totalVisitsPlatforms[platform] = 1;
                else
                    charts.totalVisitsPlatforms[platform] += 1;
            }
            for (var chart in charts) {
                var newChart = {labels: Object.keys(charts[chart]).sort(), values: []};

                for (var i=0; i<newChart.labels.length; i++){
                    newChart.values.push(charts[chart][newChart.labels[i]]);
                }
                charts[chart] = newChart;
            }
            console.log($scope.charts);
            $scope.charts.totalVisitsHours.options =
            $scope.charts.totalVisitsDates.options = {lineTension: 0};
            $scope.charts.totalVisitsHours.labels =
                _.map($scope.charts.totalVisitsHours.labels, function(h) { return h + ':00'; });
        });
        $scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
        $scope.data = [65, 59, 80, 81, 56, 55, 40];
}]).factory("umeranJsonService", ['$http', function($http) {
    var masterData;
    return function() {
        return masterData ? Promise.resolve(masterData) :
            $http.get("/analytics.json").then(function(response) {
                masterdata = response.data;
                return response.data;
            });
    };
}]).filter('sampleRecordsJsonPrettyPrint', function() {
    return function(records) { return records && JSON.stringify(records.slice(0, 5), null, 2); };
});
