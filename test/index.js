'use strict';

var marvel = require('..')(),
pkg = require('../package.json'),
should = require('should');

describe('versioning', function(){
  it('should have a version', function(){
    marvel.should.have.property('version');
  });

  it('should equal package version', function(){
    marvel.version.should.be.exactly(pkg.version);
  });

});
