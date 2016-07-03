angular.module('umeran', [])
.controller('umeranController', ['umeranJsonService', '$scope',
function(umeranJsonService, $scope) {
    umeranJsonService().then(function(data) {
        $scope.data = data;
    });
}]).factory("umeranJsonService", ['$http', function($http) {
    return function() {
        return $http.get("/analytics.json").then(function(response) { return response.data; });
    };
}]).filter('sampleRecordsJsonPrettyPrint', function() {
    return function(records) { return records && JSON.stringify(records.slice(0, 5), null, 2); };
});
