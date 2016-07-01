'use strict';
const express = require('express');
const mongodb = require('mongodb');
const dbUrl = 'mongodb://localhost:27017/umeran', port = 14401;
let db, dbPromise = mongodb.MongoClient.connect(dbUrl), app = express();

dbPromise.then((dbConnection) => {
    db = dbConnection;
    app.get('/analytics.png', analyticsPngHandler);
    app.get('/analytics.html', analyticsHtmlHandler);
    app.get('/analytics.json', analyticsJsonHanlder);
    app.listen(port, () => console.log('umeran listening on', port));
}).catch((reason) => console.log(reason));

function analyticsPngHandler(req, res) {
    let timestamp = new Date();
    createRecord(req, timestamp)
    .then(() => res.sendFile(__dirname + '/white-1x1.png'))
    .catch((reason) => console.log('reason', reason));
}
function getTotalRecords() {
    return db.collection('analyticsPngRaw').count({});
}
function getRecordsAfterTimestamp(timestamp) {
    return db.collection('analyticsPngRaw').find({timestamp: {$gte: timestamp}}).toArray();
}
function createRecord(req, timestamp) {
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
        console.log('built raw obj', raw);
        return raw;
    }
    return db.collection('analyticsPngRaw').insertOne(buildRaw());
}
function analyticsHtmlHandler(req, res) {
    res.sendFile(__dirname + '/analytics.html');
}
function analyticsJsonHanlder(req, res) {
    let timeStamp24Hours = new Date();
    timeStamp24Hours.setDate(timeStamp24Hours.getDate() - 1);
    let result = { timestamp: timeStamp24Hours };
    getTotalRecords()
    .then((total) => result.total = total)
    .then(() => getRecordsAfterTimestamp(timeStamp24Hours))
    .then((records) => result.records = records)
    .then(() => res.json(result))
    .catch((reason) => console.log('reason', reason));
}
