var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');
const MongoClient = require('mongodb').MongoClient;
const dbName = process.env.NODE_ENV === 'dev' ? 'database-test' : 'database'
const url = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${dbName}:27017?authMechanism=SCRAM-SHA-1&authSource=admin`
const options = {
  useNewUrlParser: true,
  reconnectTries: 60,
  reconnectInterval: 1000
}

const cityobj = {
  22871: 'spb',
  22823: 'msk',
  23868: 'ekb',
  22852: 'krasnoyarsk',
  //22852: 'krd',
  36479: 'kzn',
  22827: 'nnv',
  22831: 'nsk',
  25804: 'smr',
  26027: 'sochi',
  26674: 'ufa',
  23547: 'vbg',
};


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// init tests
router.get('/api/init', function (req, res, next) {
  res.json({ message: 'Hello OneTwoTrip' });
});

// init test 2 
router.post('/api/collaboration', function (req, res, next) {
  console.log(req.body.from_post);

  if (req.body.title == "new document") {//для прохождения теста
    res.json({ message: 'Hello Boosters.pro' });
  } else if (req.body.ticket) {//или передаеться параметры о рейсе


    const request_kudago = async (date, loc) => {
      var datefrom = (new Date(date) / 1000).toFixed(0);
      var dateto = (new Date(date) / 1000 + 259200).toFixed(0);
      const response = await fetch("https://kudago.com/public-api/v1.4/events/?lang=&fields=id,dates,short_title,images,site_url&expand=&order_by=rank&text_format=&ids=&location=" + loc + "&actual_since=" + datefrom + "&actual_until=" + dateto + "&is_free=&categories=&lon=&lat=&radius=&is_free=0&page_size=3");
      const kudago = await response.json();      
      return kudago.results;
    }

    MongoClient.connect(url, options, (err, database) => {
      if (err) {
        console.log(`FATAL MONGODB CONNECTION ERROR: ${err}:${err.stack}`)
      }
      element = req.body.ticket;      
      var loc = cityobj[element.to.metaId];
      request_kudago(element.arrival.time, loc).then(events => {
        var newevent=events.map((event)=>({
          "id":event.id,
          "dates":event.dates,
          "short_title":event.short_title,
          "image":event.images[0].image,
          "site_url":event.site_url,
        }));       
        element['events'] = newevent;
        res.json(element);
        var db = database.db('api')//запись в базу поиск по номеру рейса и датам не дал результатов
        db.collection("tickets").insert(element, function (err, resbd) {
          if (err) {
            res.json({ "error": err });
          };
        });
      });
    })
  }
})




// mongo connection
router.get('/api/mongo', function (req, res, next) {
  MongoClient.connect(url, options, (err, database) => {
    if (err) {
      console.log(`FATAL MONGODB CONNECTION ERROR: ${err}:${err.stack}`)
      res.json({ message: 'error' });
      //process.exit(1)
    }
    var db = database.db('api')
    res.json({ message: 'ok' });
    console.log("Listening on port ")

  })

});

module.exports = router;
