const express = require('express'),
  assert = require('assert'),
  request = require('request'),
  mongoClient = require('mongodb').MongoClient;

const app = express();

const port = process.env.PORT || 8080;
const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const dbURL = process.env.MLAB_CREDENTIALS;
const appURL = 'https://agile-hollows-58079.herokuapp.com/';


mongoClient.connect(dbURL, (err, db) => {

  assert.equal(null, err);
  console.log('Succesfully connected to the Database');

  // Setting Up the Collection in the DataBase
  const collection = db.collection('queries');

  // Instructions for the HomePage
  app.get('/', (req, res) => {
    res.send('Search images with pagination(offset variable) by adding to the URL. /api/imagesearch/searchTerms?offset=10');
  });


  // Image search
  app.get('/api/imagesearch/:searchTerms', (req, res) => {
    let searchTerms = req.params.searchTerms;

    // Store the search in the database
    collection.insertOne({
      term: searchTerms,
      when: new Date(Date.now()),
    });

    let count;
    collection.find({}).toArray((e, c) => count = c);
    if (count === 10) {
     collection.remove({}, {justOne: 1});
    }

    searchTerms = encodeURIComponent(searchTerms);
    const offset = req.query.offset;
    const restURL = `https://www.googleapis.com/customsearch/v1?q=${searchTerms}` +
      `&cx=008736666289582417959%3Aofkviqpt1-w&searchType=image` +
      `${Number(offset) ? "&start=" + offset : ""}&key=${apiKey}`;

    request(restURL, (err, response, body) => {
      if (err) throw err;
      let data = JSON.parse(body);
      let items = data.items;

      let results = items.map(item => {
        const image = {
          url: item.link,
          snippet: item.snippet,
          thumbnail: item.image.thumbnailLink,
          context: item.image.contextLink,
        };

        return image;
      });

      res.json(results);
    });
  });

  // Get latest search results
  app.get('/api/latest/imagesearch/', (req, res) => {
  	collection.find({}).toArray((err, docs) => {
  		docs.reverse();
  		const results = docs.map(doc => {
  			delete doc._id;
  			return doc;
  		});
  		res.json(docs);
  	});
  });

  app.listen(port, function() {
    const p = this.address().port;
    console.log(`Server is listening in port ${p}`);
  });
});
