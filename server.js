const express = require('express'),
	assert = require('assert'),
	mongoClient = require('mongodb').MongoClient;

const app = express();

app.get('/', (req, res) => {
	res.send('Here the instructions');
});

app.listen(3000, function(){
	const p = this.address().port;
	console.log(`Server is listening in port ${p}`);
});