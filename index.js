'use strict';

// xx - move cache read/write to config optional interface

var crypto = require('crypto'),
querystring = require('querystring'),
request = require('request'),
url = require('url'),
_ = require('underscore');

var pkg = require('./package.json');

module.exports = function(config){
  
  var configuration = _.defaults({}, config, {
    duration : '1 month'
  });

  var keys = (configuration.keys || require('./.keys.json').keys);
  if(!(keys.public || keys.private)) throw new Error('No Marvel API keys were defined.');

  function cachedRequest(endpoint, params, callback){
    console.log('cachedRequest called: ', endpoint, params);


    params = _.defaults({}, params, {
      limit : 100 //current maximum
    });
    
    // xx - params, join extra-dimensional arrays by comma

    var uri = url.format({
      protocol : 'https',
      host: 'gateway.marvel.com',
      pathname: '/v1/public/' + endpoint,
      query : params
    });

    // check cache for uri, 

    // format formal request
    var ts = Date.now();
    var extraParams = {
      ts : ts,
      apikey : keys.public,
      hash : crypto.createHash('md5').update(ts + keys.private + keys.public).digest('hex')
    };
    console.log('extra params', extraParams);

    uri = (uri + '&' + querystring.stringify(extraParams));
    console.log('cachedRequest', uri);

    request({
      uri : uri,
      json : true},function(error, response, data){
	console.log(error);
	console.log(data);

	// if no error write to cache

	return callback(null, 'done');
    });


  }


  var expt = {}; // the export object

  expt.characters = _.partial(cachedRequest, 'characters'),
  expt.version = pkg.version;


  return expt;
};
