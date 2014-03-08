'use strict';

var eoa = require('..'),
pkg = require('../package.json'),
should = require('should');

var config = {};
var timeout = (1000 * 60 * 60 * 5);

// if on travis keys will be an env var
if(process.env.TRAVIS) config.keys = {public : process.env.MARVEL_PUBLIC_KEY, private : process.env.MARVEL_PRIVATE_KEY};

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
  
  [{
    name: 'daredevil',
    id : 1009262,
    match : 'Matt Murdock'
  }, {
    name: 'squirrel girl', 
    id : 1010860,
    match : 'Doreen Green'
  },{
    name : 'spider-man',
    id : 1009610,
    match : 'Peter Parker'}].forEach(function(character){

      it('should fetch characters list matching "' + character.name + '"', function(done){
	this.timeout(timeout);
	api.characters({name : character.name}, function(err, data){
	  should(err).be.not.ok;
	  should(data[0]).be.ok.and.an.Object.and.have.property('id');
	  data[0].id.should.be.Number.and.equal(character.id);
	  return done();
	});		     
      });
      
      it('should fetch specific character information about "' + character.name + '"', function(done){
	this.timeout(timeout);
	api.character(character.id, function(err, data){     
	  should(err).be.not.ok;
	  should(data).be.ok.and.an.Array.and.have.lengthOf(1);
	  data[0].should.have.property('description');
	  data[0].description.should.match(new RegExp(character.match,'g'));
	  return done();
	});
      });
      
      it('should fetch array of ids from name "' + character.name + '"', function(done){
	this.timeout(timeout);
	api.characterNameToIds(character.name, function(err, ids){
	  should(ids).be.ok.and.an.Array;
	  ids.length.should.be.above(0);
	  ids[0].should.be.a.Number.and.equal(character.id);
	  return done();
	});
      });


      it('should fetch single "' + character.id + '" from name "' + character.name + '"', function(done){
	this.timeout(timeout);
	api.characterNameToId(character.name, function(err, id){
	  should(id).be.ok.and.a.Number.and.equal(character.id);
	  return done();
	});
      });         
  });
});
