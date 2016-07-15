'use strict';
var global = window.umeran = window.umeran||{}
var E = global.useragent = {};
var win_versions = {
    '10.0': '10.0',
    '6.3': '8.1',
    '6.2': '8',
    '6.1': '7',
    '6.0': 'vista',
    '5.2': '2003',
    '5.1': 'xp',
    '5.0': '2000',
};
var arch_mapping = {
    x86_64: '64',
    i686: '32',
    arm: 'arm',
};
var check_opera = /\bOPR\b\/(\d+)/i;
var check_opera_mini = /\bOpera Mini\/(\d+)/;
var check_edge = /\bEdge\b\/(\d+)/i;
var check_xbox = /\bxbox\b/i;
var check_ucbrowser = /\bUCBrowser\b\/(\d+)/i;
var check_ie = /[( ]MSIE ([6789]|10).\d[);]/;
var check_ie_legacy = /[( ]Trident\/\d+(\.\d)+.*rv:(\d\d)(\.\d)+[);]/;
var regex_windows = /Windows(?: NT(?: (.*?))?)?[);]/;

E.guess_browser = function(ua){
    var res;
    ua = ua|| navigator&&navigator.userAgent ||'';
    if (res = check_opera_mini.exec(ua))
        return {browser: 'opera_mini', version: res[1]};
    if (res = check_ie.exec(ua))
        return {browser: 'ie', version: res[1], xbox: check_xbox.test(ua)};
    if (res = check_ie_legacy.exec(ua))
        return {browser: 'ie', version: res[2], xbox: check_xbox.test(ua)};
    if (res = / QupZilla\/(\d+\.\d+\.\d+).* Safari\/\d+.\d+/.exec(ua))
        return {browser: 'qupzilla', version: res[1]};
    if (res = /\(PlayStation (\d+) (\d+\.\d+)\).* AppleWebKit\/\d+.\d+/.exec(ua))
        return {browser: 'playstation'+res[1], version: res[2]};
    if (res = / (Firefox|PaleMoon)\/(\d+).\d/.exec(ua))
        return {browser: 'firefox', version: res[2], palemoon: res[1]=='PaleMoon'};
    if (res = /(?:iPhone|iPad|iPod|iPod touch);.*?OS ([\d._]+)/.exec(ua))
        return {browser: 'safari', version: res[1], ios: true};
    var ucbrowser = check_ucbrowser.exec(ua);
    var opera = check_opera.exec(ua);
    var edge;
    if (res = / Chrome\/(\d+)(\.\d+)+.* Safari\/\d+(\.\d+)+/.exec(ua))
    {
        if (edge = check_edge.exec(ua))
            return {browser: 'ie', version: edge[1]};
        return {
            browser: 'chrome', version: res[1],
            android: ua.match(/Android/),
            webview: ua.match(/ Version\/(\d+)(\.\d)/),
            opera: !!opera,
            opera_version: opera ? opera[1] : undefined,
            ucbrowser: !!ucbrowser,
            ucbrowser_version: ucbrowser ? ucbrowser[1] : undefined
        };
    }
    if (res = / Version\/(\d+)(\.\d)+.* Safari\/\d+.\d+/.exec(ua))
    {
        if (!ua.match(/Android/))
            return {browser: 'safari', version: res[1]};
        return {
            browser: 'chrome', version: res[1], android: true, webview: true,
            ucbrowser: ucbrowser && !!ucbrowser[1],
            ucbrowser_version: ucbrowser ? ucbrowser[1] : undefined
        };
    }
    return {};
};
E.browser_to_string = function(browser){
    if (typeof browser!='object' || !browser.browser)
        return 'unknown';
    var s = browser.browser;
    if (browser.version)
        s += ' '+browser.version;
    if (browser.xbox)
        s += ' xbox';
    if (browser.android)
        s += ' android';
    if (browser.webview)
        s += ' webview';
    if (browser.opera)
    {
        s += ' opera';
        if (browser.opera_version)
            s += '-'+browser.opera_version;
    }
    if (browser.hola_android)
        s += ' hola_android';
    if (browser.hola_app)
        s += ' hola_app';
    if (browser.ucbrowser)
    {
        s += ' ucbrowser';
        if (browser.ucbrowser_version)
            s += '-'+browser.ucbrowser_version;
    }
    if (browser.palemoon)
        s += ' palemoon';
    if (browser.ios)
        s += ' ios';
    return s ? s : 'unknown';
};
E.guess = function(ua, platform){
    var res;
    ua = ua || navigator&&navigator.userAgent || '';
    platform = platform || navigator&&navigator.platform || '';
    if (check_xbox.exec(ua))
        return {os: 'xbox', mobile: false};
    if (res = regex_windows.exec(ua))
    {
        return {
            os: 'windows',
            version: win_versions[res[1]],
            release_version: res[1],
            arch: ua.match(/WOW64|Win64|x64/) ? '64' : '32',
            mobile: false,
        };
    }
    if (res = /Macintosh.*; (?:Intel|PPC) Mac OS X (\d+[._]\d+)/.exec(ua))
        return {os: 'macos', version: res[1].replace('_', '.'), mobile: false};
    if (/Macintosh/.exec(ua))
        return {os: 'macos', mobile: false};
    if (res = /Android(?: (\d+\.\d+))?/.exec(ua))
        return {os: 'android', version: res[1], mobile: true};
    if (res = /(Linux|CrOS|OpenBSD|FreeBSD)(?: (x86_64|i686|arm))?/.exec(ua))
    {
        if (check_opera.test(ua) && res[1]=='Linux' && res[2]=='x86_64' &&
            /^Linux arm/.test(platform))
        {
            // Opera Mobile bug
            return {os: 'android', mobile: true};
        }
        return {
            os: res[1].toLowerCase(),
            arch: arch_mapping[res[2]],
            nix: true,
            mobile: false,
        };
    }
    if (res = /(?:iPhone|iPad|iPod|iPod touch);.*?OS (\d+[._]\d+)/.exec(ua))
        return {os: 'ios', version: res[1].replace('_', '.'), mobile: true};
    if (/iPhone|iPad|iPod/.exec(ua))
        return {os: 'ios', modile: true};
    if (/PLAYSTATION/.exec(ua))
        return {os: 'ps', mobile: false};
    if (/Windows Phone/.exec(ua))
        return {os: 'winphone', mobile: true};
    if (/HitLeap Viewer/.exec(ua))
        return {os: 'windows', mobile: false};
    return {};
};
E.guess_device = function(ua){
    var res;
    ua = ua || navigator&&navigator.userAgent || '';
    if (res = /(iPhone|iPad|iPod)/.exec(ua))
        return {device: res[1].toLowerCase()};
    return {};
};
E.support_fullscreen = function(){
    return document.fullscreenEnabled||document.mozFullScreenEnabled||
        document.webkitFullscreenEnabled||document.msFullscreenEnabled;
};
