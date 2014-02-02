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

describe('characters', function(){
  it('should fetch characters information for "daredevil"', function(done){
    marvel.characters({name : 'daredevil'}, function(err, data){
      console.log(err, data);
      done();
    });		     
  });

});
