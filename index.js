'use strict';


var async = require('async'),
crypto = require('crypto'),
pkg = require('./package.json'),
retainer = require('retainer'),
S = require('string'),
url = require('url'),
_  = require('underscore');


var LIMIT = 100;
var MAX_RESULTS = 10000;

module.exports = function(config){
  
  var configuration = _.defaults({}, config, {
    file : '.eoa-cache.json',
    every : (1000 * 60 * 60 * 10), // ten minutes, write cache out
    duration : (1000 * 60 * 60 * 60 * 24 * 1), // expire cache entries in ~ month
    throttle : (1000 * 5) // only allow one (non-cached) api request every five seconds
  });

  var keys = (configuration.keys || require('./.keys.json').keys);
  if(!(keys.public || keys.private)) throw new Error('No Marvel API keys were defined.');

  var r = retainer({
    defaults : {
      json : true, 
      headers : { 
	'User-Agent' : 'Eye of Agamotto, ' + pkg.version }},
    store : require('cachy-memory-persistent')(_.pick(configuration, 'file', 'every')),
    duration : configuration.duration,
    throttle : configuration.throttle
  });

  var request = function(endpoint, params, callback){

//    console.log('calling', endpoint);

    params = _.defaults({}, params, {
      limit : MAX_RESULTS,
      offset : 0
    });

    var uri = url.format({
      protocol : 'https',
      host: 'gateway.marvel.com',
      pathname: '/v1/public/' + endpoint,
    });


//    console.log('requesting', uri, params, authinfo);
// results are wrapped in container with:
// offset, limit, total, count
// run in async series collecting data till limit or total is reached

    var eachLimit = ((params.limit && params.limit < LIMIT) ? params.limit : LIMIT); 
    var currentOffset = params.offset;
    var total = 0;
    var results = [];

// run loop pulling and merging results
    async.doWhilst(function(callback){

      var ts = _.now();
      var authinfo = {
	ts : ts, 
	apikey : keys.public,
	hash : crypto.createHash('md5').update(ts + keys.private + keys.public).digest('hex')
      };
      var localParams = _.extend(params, {limit : eachLimit, offset : currentOffset});
      r.get(uri, localParams, authinfo, function(err, json){
	if(err) return callback(err);
	results = results.concat(json.data.results);
	
	// update positional numbers

	total = json.data.total;
	currentOffset = (json.data.offset + eachLimit);
	
	return callback();
      });
    }, function(){
//      console.log('currentOffset', currentOffset, 'total', total);
      // max results is a cutoff if comething goes haywire, so we dont hammer the api
      return ((currentOffset < total) || (currentOffset >= MAX_RESULTS));
    }, function(err){
      return callback(err, results);      
    });
  };


  var returner = {
    version : pkg.version
  };

  var api = {
    'characters' : ['character', 'comics', 'events', 'series', 'stories'],
    'comics' : ['comic', 'characters', 'creators', 'events', 'stories'],
    'creators' : ['creator', 'comics', 'events', 'series', 'stories'],
    'events' : ['event', 'characters', 'comics', 'creators', 'series', 'stories'],
    'series' : ['volume', 'characters', 'comics', 'creators', 'events', 'stories'],
    'stories' : ['story', 'characters', 'comics', 'creators', 'events']
  };
  
  returner.apiConfiguration = api;

  _.each(_.keys(api), function(primary){

    returner[primary] = _.partial(request, primary);

    _.each(api[primary], function(secondary, i, secondaries){
 
      var funcName = secondaries[0];
      var endpoint = [primary];

      if(i) funcName = [secondary, 'With', S(funcName).capitalize().s, 'Id'].join('');
//      console.log('defining', funcName);

      returner[funcName] = function(){ // id, {params}, callback	
	var args = _.toArray(arguments);
	var id = args.shift();
	var callback = args.pop();
	var params = (args.length ? args.pop() : {});

	endpoint.push(id);
	if(i) endpoint.push(secondary);
//	console.log(funcName, endpoint, params);

	return request(endpoint.join('/'), params, callback);
      };
    });
  });

  return returner;
};
