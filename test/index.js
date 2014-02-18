'use strict';

var eoa = require('..'),
pkg = require('../package.json'),
should = require('should');

var config = {};

// if on travis keys will be an env var
if(process.env.keys) config.keys = process.env.keys;
console.log('travis show');
console.log(process.env);

var api = eoa(config);

describe('versioning', function(){
  it('should have a version', function(){
    api.should.have.property('version');
  });

  it('should equal package version', function(){
    api.version.should.be.exactly(pkg.version);
  });
});

describe('characters', function(){
  it('should fetch characters information for "daredevil"', function(done){
    api.characters({name : 'daredevil'}, function(err, data){
      should(err).be.not.ok;
      should(data).be.ok.and.an.Object;
      done();
    });		     
  });

});
