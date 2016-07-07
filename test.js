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
        app.server.listening ? setup() : app.server.on('listening', setup);

        function setup() {
            connectAndSetMongo()
                // .then(clearCollection)
                .then(done).catch((reason) => done(reason));
        }
    });
    describe('serves static files from all public subfolders', () => {
        it('works on public/', (done) => {
            testStatic(done, '/analytics.html');
        });
        it('works on public/js', (done) => {
            testStatic(done, '/js/analytics.js');
        });

        function testStatic(done, filePath) {
            rp({uri: hostUrl + filePath})
                .then((res) => new Promise((resolve, reject) => {
                    fs.readFile(__dirname + '/public' + filePath, 'utf8', (err, data) => {
                        if (err)
                            reject(err);
                        else
                            resolve({file: data, res: res});
                    });
                }))
                .then((compare) => { expect(compare.res).to.equal(compare.file); })
                .then(done).catch((reason) => done(reason));
        }
    });
    describe('when receive request for analytics.png then analytics.json', () => {
        let resPng, resJson, previousCount, previousTotal;
        let timestamp1DayBefore = new Date(new Date().setDate(new Date().getDate()-1));

        before((done) => {
            db.collection('analyticsPngRaw').count()
                .then(total => previousTotal = total)
                .then(() => db.collection('analyticsPngRaw').count({timestamp: {$gte: timestamp1DayBefore}}))
                .then(count => previousCount = count)
                .then(() => rp({uri: hostUrl + '/analytics.png', resolveWithFullResponse: true}))
                .then((response) => void (resPng = response))
                .then(() => rp({uri: hostUrl + '/analytics.json', resolveWithFullResponse: true}))
                .then((response) => void (resJson = response))
                .then(done).catch((reason) => done(reason));
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
                .then(done).catch((reason) => done(reason));
        });
        it('stores a raw record', (done) => {
            db.collection('analyticsPngRaw').count({timestamp: {$gte: timestamp1DayBefore}})
                .then((count) => { expect(count).to.equal(previousCount + 1); })
                .then(done).catch((reason) => done(reason));
        });
        it('returns json with correct total and #record', () => {
            expect(resJson.statusCode).to.equal(200);
            let result = JSON.parse(resJson.body);
            expect(result.past24HoursCount).to.equal(previousCount + 1);
            expect(result.records.length).to.equal(previousTotal + 1);
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
