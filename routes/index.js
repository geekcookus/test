var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient
const dbName = process.env.NODE_ENV === 'dev' ? 'database-test' : 'database'
const url = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${dbName}:27017?authMechanism=SCRAM-SHA-1&authSource=admin`
const options = {
  useNewUrlParser: true,
  reconnectTries: 60,
  reconnectInterval: 1000
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// init tests
router.get('/api/init', function(req, res, next) {
  res.json({message: 'ok'});
});

// init test 2 
router.post('/api/collaboration', function(req,res,next) {
  res.json({message: 'ok'});
})

// mongo connection
router.get('/api/mongo', function(req, res, next) {
  MongoClient.connect(url, options, (err, database) => {
    if (err) {
      console.log(`FATAL MONGODB CONNECTION ERROR: ${err}:${err.stack}`)
      res.json({message: 'error'});
      //process.exit(1)
    }
    var db = database.db('api')
    res.json({message: 'ok'});
    console.log("Listening on port ")

  })

});

module.exports = router;
