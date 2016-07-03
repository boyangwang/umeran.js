'use strict';
debugger;
const fs = require('fs');
const expect = require('chai').expect;
const app = require('./app.js');
const rp = require('request-promise');
const mongodb = require('mongodb');
const hostUrl = 'http://localhost:14401';
const dbUrl = 'mongodb://localhost:27017/umeran';
let db;

describe('umeranApp', () => {
    before((done) => {
        function setup() {
            connectAndSetMongo()
                .then(clearCollection)
                .then(done)
                .catch((reason) => done(reason));
        }
        app.server.listening ? setup() : app.server.on('listening', setup);
    });
    describe('when receive request for analytics.png then analytics.json', () => {
        let resPng, resJson, previousCount;
        let timestamp1MinuteBefore = new Date(new Date().setMinutes(new Date().getMinutes()-1));

        before((done) => {
            db.collection('analyticsPngRaw').count({timestamp: {$gte: timestamp1MinuteBefore}})
                .then((count) => previousCount = count)
                .then(() => rp({uri: hostUrl + '/analytics.png', resolveWithFullResponse: true}))
                .then((response) => void (resPng = response))
                .then(() => rp({uri: hostUrl + '/analytics.json', resolveWithFullResponse: true}))
                .then((response) => void (resJson = response))
                .then(done);
        });
        it('returns the image', (done) => {
            expect(resPng.statusCode).to.equal(200);
            new Promise((resolve, reject) => {
                fs.readFile(__dirname + '/white-1x1.png', 'utf8', (err, data) => {
                    if (err)
                        reject(err)
                    else
                        resolve(data)
                });
            })
                .then((data) => { expect(resPng.body).to.equal(data); })
                .then(done)
                .catch((reason) => done(reason));
        });
        it('stores a raw record', (done) => {
            db.collection('analyticsPngRaw').count({timestamp: {$gte: timestamp1MinuteBefore}})
                .then((count) => { expect(count).to.equal(previousCount + 1); })
                .then(done);
        });
        it('returns json with correct total and #record', () => {
            expect(resJson.statusCode).to.equal(200);
            let result = JSON.parse(resJson.body);
            expect(result.total).to.equal(1);
            expect(result.records.length).to.equal(1);
        });
    });
});

function connectAndSetMongo() {
    return mongodb.MongoClient.connect(dbUrl)
        .then((mongodb) => void (db = mongodb));
}
function clearCollection() {
    return void db.collection('analyticsPngRaw').remove({persistent: {$exists: false}});
}
