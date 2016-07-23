'use strict';
const request = require('request-promise');
const jsdom = require('jsdom');
const jquery = require('jquery');
let db;
module.exports = createScrapJobPromiseOfType;

function createScrapJobPromiseOfType(siteConfig, passedDb) {
    db = passedDb;
    console.log('In createScrapJobPromiseOfType', siteConfig);
    if (siteConfig.site == 'lazada') {
        return createLazadaScrapJobs(siteConfig);
    }
    else if (siteConfig.site == 'qoo10') {
        return createQoo10ScrapJobs(siteConfig);
    }
    else {
        return new Error('Site not implemented', siteConfig.site);
    }
}
function createLazadaScrapJobs(siteConfig) {
    console.log('siteConfig.keywordConfigs', siteConfig.keywordConfigs);
    return siteConfig.keywordConfigs.map(keywordConfig =>
        scrapLazadaKeywordsSearchResults(keywordConfig)
    );
}
function createQoo10ScrapJobs(siteConfig) {
    return new Error('Site not implemented qoo10');
}
function scrapLazadaKeywordsSearchResults(keywordConfig) {
    let window, $;
    return new Promise((resolve, reject) => {
        jsdom.env('http://www.lazada.sg/catalog/?itemperpage=120&q='+keywordConfig.keyword.split(' ').join('+'),
            (err, window) => {
            if (err) reject(err);
            resolve(window);
        });
    }).then(_window => {
        window = _window;
        $ = jquery(window);
    }).then(() => upsertNewSku(keywordConfig, window, $));
}
function upsertNewSku(keywordConfig, window, $) {
    let urlIds = $('.product-card').map((idx, elem) => $(elem).attr('data-original')).get();
    return Promise.all(urlIds.map(curUrl =>
        db.collection('scrapReviewRecords').updateOne({url: curUrl}, {
            $setOnInsert: {createTimestamp: new Date(), keyword: keywordConfig.keyword}
            }, {upsert: true})
    ));
}
