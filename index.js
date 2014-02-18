'use strict';


var crypto = require('crypto'),
pkg = require('./package.json'),
retainer = require('retainer'),
url = require('url'),
_  = require('underscore');

module.exports = function(config){
  
  var configuration = _.defaults({}, config, {
    file : '.eoa-cache.json',
    every : 6000,
    duration : (1000 * 60 * 60 * 60 * 24 * 1), //month
    throttle : (1000 * 30)
  });

  var keys = (configuration.keys || require('./.keys.json').keys);
  if(!(keys.public || keys.private)) throw new Error('No Marvel API keys were defined.');

  var r = retainer({
    defaults : {json : true},
    store : require('cachy-memory-persistent')(_.pick(configuration, 'file', 'every')),
    duration : configuration.duration,
    throttle : configuration.throttle
  });

  var request = function(endpoint, params, callback){
    params = _.defaults({}, params, {
      limit : 100 //current maximum
    });   

    var uri = url.format({
      protocol : 'https',
      host: 'gateway.marvel.com',
      pathname: '/v1/public/' + endpoint,
    });

    var ts = _.now();
    var authinfo = {
      ts : ts,
      apikey : keys.public,
      hash : crypto.createHash('md5').update(ts + keys.private + keys.public).digest('hex')
    };

//    console.log('requesting', uri, params, authinfo);

    r.get(uri, params, authinfo, callback);
  };


  return {
    characters : _.partial(request, 'characters'),
    version : pkg.version
  };
};
