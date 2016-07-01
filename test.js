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
        if (app.server.listening)
            connectAndSetMongo().then(done).catch((reason) => done(reason));
        else
            app.server.on('listening', () => connectAndSetMongo().then(done).catch((reason) => done(reason)));
    });
    describe('when receive request for analytics.png', () => {
        let url = hostUrl + '/analytics.png', res, previousCount;
        let timestamp1MinuteBefore = new Date(new Date().setMinutes(new Date().getMinutes()-1));

        before((done) => {
            db.collection('analyticsPngRaw').count({timestamp: {$gte: timestamp1MinuteBefore}})
                .then((count) => previousCount = count)
                .then(() => rp({uri: url, resolveWithFullResponse: true}))
                .then((response) => void (res = response))
                .then(done);
        });
        it('returns the image', (done) => {
            expect(res.statusCode).to.equal(200);
            new Promise((resolve, reject) => {
                fs.readFile(__dirname + '/white-1x1.png', 'utf8', (err, data) => {
                    if (err)
                        reject(err)
                    else
                        resolve(data)
                });
            })
                .then((data) => { expect(res.body).to.equal(data); })
                .then(done)
                .catch((reason) => done(reason));
        });
        it('stores a raw record', (done) => {
            db.collection('analyticsPngRaw').count({timestamp: {$gte: timestamp1MinuteBefore}})
                .then((count) => { expect(count).to.equal(previousCount + 1); })
                .then(done);
        });
    });
});

function connectAndSetMongo() {
    return mongodb.MongoClient.connect(dbUrl)
        .then((mongodb) => void (db = mongodb));
}
