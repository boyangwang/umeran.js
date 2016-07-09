angular.module('umeran', ['chart.js'])
    .controller('umeranController', ['umeranMasterData', '$scope', function(umeranMasterData, $scope) {
        umeranMasterData
            .then(function(data) {
                $scope.masterData = data;
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
        return masterDataPromise = $http.get("/analytics.json")
            .then(function(response) {
                return response.data;
            });
    }]).filter('jsonPrettyPrint', function() {
        return function(records) {
            return records && JSON.stringify(records, null, 2);
        };
    }).filter('samples', function() {
        return function(records, count) {
            return records && records.slice(0, 5);
        };
    });
