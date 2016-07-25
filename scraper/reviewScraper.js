'use strict';
const request = require('request-promise');
const jsdom = require('jsdom');
const jquery = require('jquery');
let db;
module.exports = createScrapPromisesOfProductPagesSameSite;

function createScrapPromisesOfProductPagesSameSite(siteConfig, passedDb) {
    db = passedDb;
    console.log('In createScrapPromiseOfType', siteConfig);
    if (siteConfig.site == 'lazada') {
        return createScrapPromisesLazada(siteConfig);
    }
    else if (siteConfig.site == 'qoo10') {
        return createScrapPromisesQoo10(siteConfig);
    }
    else {
        return new Error('Site not implemented', siteConfig.site);
    }
}
function createScrapPromisesLazada(siteConfig) {
    return (siteConfig.keywordConfigs || []).map(keywordConfig =>
        createScrapPromisesOfKeywordProductPageLazada(keywordConfig)
    ).concat((siteConfig.categoryConfigs || []).map(categoryConfig =>
        createScrapPromisesOfCategoryProductPageLazada(categoryConfig)
    ));
}
function createScrapPromisesQoo10(siteConfig) {
    return new Error('Site not implemented qoo10');
}
function createScrapPromisesOfCategoryProductPageLazada(categoryConfig) {
    if (categoryConfig.category == 'ALL') {
        return new Error('Category not implemented ALL');
    }
    else {
        return new Promise((resolve, reject) => {
            jsdom.env('http://www.lazada.sg/'+categoryConfig.category+'/?itemperpage=120',
                (err, window) => {
                if (err) reject(err);
                resolve(window);
            });
        }).then(window =>
            upsertNewSku(window)
        ).then(retVals =>
            Promise.all(retVals.map(retVal => {
                retVal.updateObj.$setOnInsert.category = categoryConfig.category;
                return db.collection('scrapReviewRecords').updateOne({url: retVal.url}, retVal.updateObj, {upsert: true});
            }))
        );
    }
}
function createScrapPromisesOfKeywordProductPageLazada(keywordConfig) {
    return new Promise((resolve, reject) => {
        jsdom.env('http://www.lazada.sg/catalog/?itemperpage=120&q='+keywordConfig.keyword.split(' ').join('+'),
            (err, window) => {
            if (err) reject(err);
            resolve(window);
        });
    }).then(window =>
        upsertNewSku(window)
    ).then(retVals => {
        console.log('retVals', retVals);
        retVals.updateObj.$setOnInsert.keyword = keywordConfig.keyword;
        return db.collection('scrapReviewRecords').updateOne({url: retVal.url}, retVal.updateObj, {upsert: true})
    });
}
function upsertNewSku(window) {
    let $ = jquery(window);
    return Promise.all($('.product-card').map((idx, elem) => {
        return createReviewUpdateObj($(elem))
            .then(reviewUpdateObj => {
                let url = $(elem).attr('data-original');
                let updateObj = {$setOnInsert: {createTimestamp: new Date()}};
                if (reviewUpdateObj)
                    updateObj.$set = reviewUpdateObj;
                return {url: url, updateObj: updateObj};
            });
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
