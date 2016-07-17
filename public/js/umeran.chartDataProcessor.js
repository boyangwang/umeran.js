angular.module('umeran').service('umeranChartDataProcessor', function() {
    var CHART_NAMES = ['totalVisitsHours', 'totalVisitsDates', 'totalVisitsBrowsers', 'totalVisitsPlatforms'];
    var DATASET_OVERRIDES = {
        totalVisitsDates: [{lineTension: 0}],
        totalVisitsHours: [{lineTension: 0}],
    };
    var LABEL_EXTRACT_FUNCTION = {
        totalVisitsHours: function(record) { return record.timestamp.substring(11, 13); },
        totalVisitsDates: function(record) { return record.timestamp.substring(0, 10); },
        totalVisitsBrowsers: function(record) { return window.umeran.useragent.guess_browser(record['user-agent']).browser; },
        totalVisitsPlatforms: function(record) { return window.umeran.useragent.guess(record['user-agent']).os; }
    };
    var DEFAULT_DATA_POINTS = {
        totalVisitsHours: {'00': 0,'01': 0,'02': 0,'03': 0,'04': 0,'05': 0,'06': 0,'07': 0,'08': 0,'09': 0,'10': 0,'11': 0,'12': 0,
            '13': 0,'14': 0,'15': 0,'16': 0,'17': 0,'18': 0,'19': 0,'20': 0,'21': 0,'22': 0,'23': 0}
    };
    var LABEL_POST_PROCESS_FUNCTION = {
        totalVisitsHours: function(label) { return label + ':00'; }
    };
    return function(masterData) {
        var charts = {};
        setupChartLevelStaticData(charts);
        processRecordLevelData(charts, masterData.analytics.records);
        postProcessData(charts);
        processScrapRecordsCharts(charts, masterData.scrapRecords);
        console.log(charts);
        return charts;
    };

    function setupChartLevelStaticData(charts) {
        _.each(CHART_NAMES, function(name) {
            var curChart = charts[name] = charts[name]||{};
            curChart.datasetOverride = DATASET_OVERRIDES[name]||{};
            curChart.map = Object.assign(curChart.map||{}, DEFAULT_DATA_POINTS[name]||{});
        });
    }
    function processRecordLevelData(charts, masterData) {
        _.each(masterData, function(record) {
            _.each(CHART_NAMES, function(chart_name) {
                var label = (LABEL_EXTRACT_FUNCTION[chart_name])(record);
                charts[chart_name].map[label] = charts[chart_name].map[label] ?
                    charts[chart_name].map[label] + 1 : 1;
            })
        });
    }
    function postProcessData(charts) {
        _.each(CHART_NAMES, function(chart_name) {
            charts[chart_name].labels = Object.keys(charts[chart_name].map).sort();
            charts[chart_name].values = [[]];
            _.each(charts[chart_name].labels, function(label) {
                charts[chart_name].values[0].push(charts[chart_name].map[label]);
            });
            if (LABEL_POST_PROCESS_FUNCTION[chart_name])
                charts[chart_name].labels =
                    _.map(charts[chart_name].labels, LABEL_POST_PROCESS_FUNCTION[chart_name]);
        });
    }
    function processScrapRecordsCharts(charts, scrapRecords) {
        charts.scrapRecords = {};
        _.each(scrapRecords, function(record) {
            var curChart = charts.scrapRecords[record.keywords.join('_')] = {}, labels = [];
            curChart.values = [_.pluck(record.items, 'price')];
            for (var i=0; i<record.items.length; labels.push(i) && i++);
            curChart.labels = labels;
            curChart.datasetOverride = [{lineTension: 0}];
            curChart.options = {
                tooltips: {
                    callbacks: {
                        label: function(tooltip, data) {
                            var lines = [];
                            for (var prop in record.items[tooltip.index]) {
                                lines.push(prop.toUpperCase()+': '+record.items[tooltip.index][prop]);
                                lines.push('');
                            }
                            return lines;
                        }
                    }
                }
            };
        });
    }
})
