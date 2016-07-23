// scrap job executor
'use strict';
const mongodb = require('mongodb');
const fs = require('fs-promise');
const deepAssign = require('deep-assign');
const dbUrl = 'mongodb://localhost:27017/umeran', port = 14401;
const defaultConfig = {
    interval: 1000*3600*24
};

let db, config = deepAssign({}, defaultConfig, require('./'+process.argv[2]));
run();
// setInterval(run, config.interval);

function run() {
    mongodb.MongoClient.connect(dbUrl)
        .then(dbConnection => db = dbConnection)
        .then(() => createScrapPromises(config.jobs))
        .then(parsedJobs => Promise.all(parsedJobs))
        .then(resultArr => console.log('One round of scrap jobs done', resultArr))
        .then(() => db.close())
        .catch(reason => console.log('Err in run', reason));
}
function createScrapPromises(jobs) {
    return jobs.reduce((jobTypeAccumulatorArr, job) => {
        let createScrapJobs = require('./'+job.type+'Scraper.js');
        let jobsSameTypeFromSites = job.siteConfigs.reduce((sitesAccumulatorArr, siteConfig) =>
            sitesAccumulatorArr.concat(createScrapJobs(siteConfig, db))
        , []);
        return jobTypeAccumulatorArr.concat(jobsSameTypeFromSites);
    }, []);
}
