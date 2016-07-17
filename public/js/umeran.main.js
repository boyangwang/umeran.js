angular.module('umeran', ['chart.js'])
    .controller('umeranController', ['umeranMasterData', '$scope', function(umeranMasterData, $scope) {
        umeranMasterData
            .then(function(masterData) {
                console.log(masterData);
                $scope.masterData = masterData;
            })
            .catch(function(reason) {
                console.log(reason);
            });
    }]).controller('umeranChartController', ['umeranMasterData', 'umeranChartDataProcessor', '$scope', function(umeranMasterData, umeranChartDataProcessor, $scope) {
        umeranMasterData
            .then(function(masterData) {
                return umeranChartDataProcessor(masterData);
            })
            .then(function(charts) {
                $scope.charts = charts;
            });
    }]).service('umeranMasterData', ['$http', function($http) {
        var masterData = {};
        var masterDataPromise = $http.get("/analytics.json")
            .then(function(response) {
                masterData.analytics = response.data;
            })
            .then(function () { return $http.get("/scrapRecords.json"); })
            .then(function(response) {
                masterData.scrapRecords = response.data.scrapRecords;
            })
            .then(function() {
                return masterData;
            });
        return masterDataPromise;
    }]).filter('jsonPrettyPrint', function() {
        return function(records) {
            return records && JSON.stringify(records, null, 2);
        };
    }).filter('samples', function() {
        return function(records, count) {
            return records && records.slice(0, count||5);
        };
    });
