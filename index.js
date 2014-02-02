'use strict';

var request = require('request');
var pkg = require('./package.json');

module.exports = function(configuration){

  return {
    version : pkg.version
  };
};
