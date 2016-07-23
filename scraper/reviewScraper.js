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
    return siteConfig.keywordConfigs.map(keywordConfig =>
        scrapLazadaKeywordsSearchResults(keywordConfig)
    );
}
function createQoo10ScrapJobs(siteConfig) {
    return new Error('Site not implemented qoo10');
}
function scrapLazadaKeywordsSearchResults(keywordConfig) {
    return new Promise((resolve, reject) => {
        jsdom.env('http://www.lazada.sg/catalog/?itemperpage=120&q='+keywordConfig.keyword.split(' ').join('+'),
            (err, window) => {
            if (err) reject(err);
            resolve(window);
        });
    }).then(window =>
        upsertNewSku(keywordConfig, window)
    );
}
function upsertNewSku(keywordConfig, window) {
    let $ = jquery(window);
    return Promise.all($('.product-card').map((idx, elem) => {
        return createReviewUpdateObj($(elem))
            .then(reviewUpdateObj => {
                let url = $(elem).attr('data-original');
                let updateObj = {$setOnInsert: {createTimestamp: new Date(), keyword: keywordConfig.keyword}};
                if (reviewUpdateObj)
                    updateObj.$set = reviewUpdateObj;
                return {url: url, updateObj: updateObj};
            }).then(retVal =>
                db.collection('scrapReviewRecords').updateOne({url: retVal.url}, retVal.updateObj, {upsert: true})
            );
    }).get());
}
function createReviewUpdateObj($elem) {
    if (!$elem.find('.product-card__rating__stars').length) return Promise.resolve();
    return new Promise((resolve, reject) => {
        jsdom.env('http://www.lazada.sg'+$elem.attr('data-original'),
            (err, window) => {
            if (err) reject(err);
            resolve(window);
        });
    }).then(window => {
        let $ = jquery(window);
        let reviewListDom = $('#js_reviews_list').eq(0);
        let reviewList = reviewListDom.find('.ratRev_reviewListRow').map((idx, elem) => {
            let reviewObj = {};
            reviewObj.datePublished = $(elem).find('meta[itemprop=datePublished]').attr('content');
            reviewObj.ratingValue = $(elem).find('.ratRev_ratOptions[itemprop=ratingValue]').attr('content');
            reviewObj.description = $(elem).find('.ratRev_revDetail[itemprop=description]').text().trim();
            reviewObj.author = $(elem).find('.ratRev-revNickname[itemprop=author]').text().trim();
            reviewObj.revBadge = $(elem).find('.ratRev-revBadge').text().trim();
            return reviewObj;
        }).get();
        return {reviews: reviewList};
    });
}
