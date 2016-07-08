'use strict';
const express = require('express');
const mongodb = require('mongodb');
const dbUrl = 'mongodb://localhost:27017/umeran', port = 14401;
let db, app = module.exports = express();

mongodb.MongoClient.connect(dbUrl)
    .then((dbConnection) => {
        db = dbConnection;
        app.use(express.static(__dirname + '/public'));
        app.use('/js', express.static(__dirname + '/node_modules/babel-polyfill/dist'));
        app.use('/js', express.static(__dirname + '/node_modules/chart.js/dist'));
        app.use('/js', express.static(__dirname + '/node_modules/angular-chart.js/dist'));
        app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
        app.use('/js', express.static(__dirname + '/node_modules/underscore/'));
        app.get('/analytics.png', analyticsPngHandler);
        app.get('/analytics.json', analyticsJsonHandler);
    })
    .then(new Promise((resolve, reject) => {
            app.server = app.listen(port,  () => {
                console.log('umeran listening on', port);
                resolve();
            });
    }))
    .then(() => console.log('umeran bootstrapping done'))
    .catch((reason) => console.log(reason));

function analyticsPngHandler(req, res) {
    let timestamp = new Date();
    createRecord(req, timestamp)
        .then(() => {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.sendFile(__dirname + '/white-1x1.png');
        })
        .catch((reason) => console.log('reason', reason));
}
function getTotalRecords() {
    return db.collection('analyticsPngRaw').find({}).toArray();
}
function getRecordsAfterTimestamp(timestamp) {
    return db.collection('analyticsPngRaw').count(
        timestamp ? {timestamp: {$gte: timestamp}} : {});
}
function createRecord(req, timestamp) {
    return db.collection('analyticsPngRaw').insertOne(buildRaw());

    function buildRaw() {
        let raw = {
            timestamp: timestamp,
            body: req.body||'',
            originalUrl: req.originalUrl||'',
            ips: req.ips||'',
            params: req.params||'',
            path: req.path||'',
            query: req.query||'',
            subdomains: req.subdomains||'',
            xhr: req.xhr||'',
        };
        for (let header in req.headers) {
            raw[header] = req.headers[header];
        }
        return raw;
    }
}
function analyticsJsonHandler(req, res) {
    let timestamp1DayBefore = new Date(new Date().setDate(new Date().getDate()-1));
    let result = { timestamp: timestamp1DayBefore };
    getTotalRecords()
        .then((records) => result.records = records)
        .then(() => getRecordsAfterTimestamp(timestamp1DayBefore))
        .then((count) => result.past24HoursCount = count)
        .then(() => res.json(result))
        .catch((reason) => console.log('reason', reason));
}
