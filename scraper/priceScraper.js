'use strict';
const mongodb = require('mongodb');
const request = require('request-promise');
const jsdom = require('jsdom');
const jquery = require('jquery');
const dbUrl = 'mongodb://localhost:27017/umeran', port = 14401;
let db, arrKeywords = [
    ['logitech', 'keyboard'],
    ['logitech', 'mouse']
];

mongodb.MongoClient.connect(dbUrl)
    .then(dbConnection => db = dbConnection)
    .then(() => Promise.all(arrKeywords.map(keywords => scrapKeywordsSearchResults(keywords))))
    .then(() => console.log('scrap done'))
    .then(() => db.close())
    .catch(reason => console.log(reason));

function scrapKeywordsSearchResults(keywords) {
    let window, $;
    return new Promise((resolve, reject) => {
        jsdom.env('http://www.lazada.sg/catalog/?q='+keywords.join('+'), (err, window) => {
            if (err)
                reject(err);
            resolve(window);
        });
    }).then(_window => {
        window = _window
        $ = jquery(window);
    }).then(html => buildKeywordsSearchScrapRecord(keywords, window, $))
    .then(record => db.collection('scrapRecords').insertOne(record));
}
function buildKeywordsSearchScrapRecord(keywords, window, $) {
    let record = {
        timestamp: new Date(),
        keywords: keywords,
        items: []
    };
    $('.product-card').each(function(idx) {
        record.items.push(buildKeywordsSearchRecord($(this)));
    });
    console.log(record);
    return record;
}
function buildKeywordsSearchRecord(elem) {
    let item = {
        sku_simple: elem.attr('data-sku-simple'),
        price: parseFloat(elem.attr('data-price')),
        url: elem.attr('data-original'),
    };
    addPropIfSelectorExist(item, 'name', elem,
        '.product-card__name', elem => elem.text());
    addPropIfSelectorExist(item, 'fast_delivery', elem,
        '.product-card-info__fast-delivery-icon', elem => true);
    addPropIfSelectorExist(item, 'rating_stars', elem,
        '.product-card__rating__stars', elem => parseFloat(elem.attr('title')));
    addPropIfSelectorExist(item, 'rating_number', elem,
        '.rating__number', elem => parseInt(/[0-9]+/.exec(elem.text())[0]));
    addPropIfSelectorExist(item, 'old_price', elem,
        '.product-card__old-price', elem => parseFloat(/[0-9\.]+/.exec(elem.text())[0]));
    return item;
}
function addPropIfSelectorExist(obj, propName, parent, selector, cb) {
    let foundElem = parent.find(selector);
    if (foundElem.length)
        obj[propName] = foundElem.length ? cb(foundElem) : false;
}
