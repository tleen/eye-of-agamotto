'use strict';


var async = require('async'),
crypto = require('crypto'),
pkg = require('./package.json'),
retainer = require('retainer'),
S = require('string'),
url = require('url'),
util = require('util'),
_  = require('underscore');


var LIMIT = 100;
var MAX_RESULTS = 10000;

module.exports = function(config){
  
  var configuration = _.defaults({}, config, {
    file : '.eoa-cache.json',
    every : (1000 * 60 * 60 * 1), // * x minutes, write cache out
    duration : (1000 * 60 * 60 * 60 * 24 * 1), // expire cache entries in * x days
    throttle : (1000 * 5) // only allow one (non-cached) api request every five seconds
  });

  var keys = (configuration.keys || require('./.keys.json').keys);
  if(!(keys.public || keys.private)) throw new Error('No Marvel API keys were defined.');

  var r = retainer({
    defaults : {
      json : true, 
      strictSSL : false,
      headers : { 
	'User-Agent' : 'Eye of Agamotto, ' + pkg.version }},
    store : require('cachy-memory-persistent')(_.pick(configuration, 'file', 'every')),
    duration : configuration.duration,
    throttle : configuration.throttle
  });

  var request = function(endpoint, params, callback){

    params = _.defaults({}, params, {
      limit : MAX_RESULTS,
      offset : 0
    });

    var uri = url.format({
      protocol : 'https',
      host: 'gateway.marvel.com',
      pathname: '/v1/public/' + endpoint,
    });

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
	
	// xx - ook for marvel defined errors and use those as err in callback too
	if(_.isEmpty(json)) return callback('No results for api call: ' + uri);
	if(json.status != 'Ok') return callback(util.format('Error (%s) in api call: %s', json.code, json.message));

	results = results.concat(json.data.results);

	// update positional numbers

	total = json.data.total;
	currentOffset = (json.data.offset + eachLimit);
	
	return callback();
      });
    }, function(){
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
      var endpoint = [primary, '{{id}}'];

      if(i){
	funcName = [secondary, 'With', S(funcName).capitalize().s, 'Id'].join('');
	endpoint.push(secondary);
      }
      endpoint = endpoint.join('/');

      returner[funcName] = function(){ // id, {params}, callback
	var args = _.toArray(arguments);
	var id = args.shift();
	var callback = args.pop();
	var params = (args.length ? args.pop() : {});

	var uri = S(endpoint).template({id : id}).s;

	return request(uri, params, callback);
      };
    });
  });

  // some utility functions
  returner.characterNameToIds = function characterNameToIds(name, callback){
    returner.characters({name : name}, function(err, data){
      if(err) return callback(err);
      if(data.length === 0) return callback('No results');
      else return callback(null, _.pluck(data, 'id'));
    });
  };

  returner.characterNameToId = function characterNameToId(name, callback){
    returner.characterNameToIds(name, function(err, ids){
      if(err) return callback(err);
      else return callback(null, ids[0]);
    });
  };

  return returner;
};
