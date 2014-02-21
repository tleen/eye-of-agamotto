var eoa = require('..')(),
_ = require('underscore');

var characterName = (process.argv[2] ? process.argv[2] : 'squirrel girl');

eoa.characters({name : characterName}, function(err, data){
  if(err) throw new Error(err);
  var characterId = data[0].id;
  
  eoa.character(characterId, function(err, data){
    if(err) throw new Error(err);

    console.log('name: %s', data[0].name);
    console.log('description: %s', data[0].description)

    // Notice the api functions are reverse from their api url 
    // /character/{id}/comics becomes comicsWithCharacterId
    eoa.comicsWithCharacterId(characterId, function(err, data){
      if(err) throw new Error(err);
      console.log('(%d) comics', data.length);
    });

    // with some input args and display
    eoa.comicsWithCharacterId(characterId, {
      format: 'comic',
      noVariants : true,
      orderBy : 'onsaleDate'}, function(err, data){
	if(err) throw new Error(err);
	console.log('(%d) "standard" comics: %s', data.length, ((data.length > 30) ? '(showing 30)' :  ''));
	_.chain(data).first(30).pluck('title').each(function(s, i){ console.log('  %d. %s', (i+1), s) });
      });

    eoa.eventsWithCharacterId(characterId, function(err, data){
      if(err) throw new Error(err);
      console.log('(%d) events', data.length);
    });

    eoa.seriesWithCharacterId(characterId, function(err, data){
      if(err) throw new Error(err);
      console.log('(%d) series', data.length);
    });

    eoa.storiesWithCharacterId(characterId, function(err, data){
      if(err) throw new Error(err);
      console.log('(%d) stories', data.length);
    });

  });


});
