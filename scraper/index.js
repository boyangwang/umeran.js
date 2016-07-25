// scrap job executor
'use strict';
const Promise = require("bluebird");
const mongodb = require('mongodb');
const fs = require('fs-promise');
const deepAssign = require('deep-assign');
const dbUrl = 'mongodb://localhost:27017/umeran', port = 14401;
const defaultConfig = {
    interval: 1000*3600*24
};

let db, config = deepAssign({}, defaultConfig, require('./'+process.argv[2]));
run();
if (process.argv[3] && process.argv['keepRunning'])
    setInterval(run, config.interval);

function run() {
    mongodb.MongoClient.connect(dbUrl)
        .then(dbConnection => db = dbConnection)
        .then(() => createScrapPromisesOfTypes(config.jobs))
        .then(parsedPromises => Promise.all(parsedPromises))
        .then(resultArr => console.log('One round of scrap jobs done'))
        .then(() => db.close())
        .catch(reason => {
            console.error('Err in run', reason, 'stack trace:\n',
                reason && reason.stack ? reason.stack : typeof reason);
            db && db.close();
        });
}
function createScrapPromisesOfTypes(jobs) {
    return [].concat(...jobs.map(job => {
        let createScrapPromisesOfProductPagesSameSite = require('./'+job.type+'Scraper.js');
        return [].concat(...(job.siteConfigs || []).map(siteConfig =>
            createScrapPromisesOfProductPagesSameSite(siteConfig, db)
        ));
    }));
}
