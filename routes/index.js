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
  22823: 'msc',
  23868: 'ekb',
  22852: 'krasnoyarsk',
  22852: 'krd',
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
  } else if(req.body.from_post && req.body.to_post && req.body.date_post ) {//или передаеться параметры о рейсе

    var from_post = req.body.from_post;
    var to_post = req.body.to_post;
    var date_post = req.body.date_post;
    var trainNumber = req.body.trainNumber;
    const request_kudago = async (datefrom, dateto, location) => {
      const response = await fetch("https://kudago.com/public-api/v1.4/events/?lang=&fields=id,dates,short_title,images,site_url&expand=&order_by=&text_format=&ids=&location" + location + "=&actual_since=" + datefrom + "&actual_until=" + dateto + "&is_free=&categories=&lon=&lat=&radius=&is_free=0");
      const kudago = await response.json();
      return kudago.results;
    }
    const request_onetwotrip = async (from_post, to_post, date_post, trainNumber) => {
      const response = await fetch('https://www.onetwotrip.com/_api/rzd/metaTimetable/?from=' + from_post + '&to=' + to_post + '&date=' + date_post + '&source=web');
      const onetwotrip = await response.json();
      return onetwotrip.result;
    }

    MongoClient.connect(url, options, (err, database) => {
      if (err) {
        console.log(`FATAL MONGODB CONNECTION ERROR: ${err}:${err.stack}`)
      }
      request_onetwotrip(from_post, to_post, date_post, trainNumber).then(onetwotrip => {
        element = onetwotrip[0];//первый рейс из выдачи
        for (var key in onetwotrip) {//если есть номер рейса выбираем
          if (trainNumber && trainNumber == onetwotrip[key].trainNumber) {
            element = onetwotrip[key];
          }
        }
        var datefrom = (new Date(element.departure.localTime) / 1000).toFixed(0);
        var dateto = (new Date(element.departure.localTime) / 1000 + 259200).toFixed(0);
        var loc = cityobj[to_post];
        request_kudago(datefrom, dateto, loc).then(event => {
          element['events'] = event;
          res.json(element);
          var db = database.db('api')//запись в базу поиск по номеру рейса и датам не дал результатов
          db.collection("tickets").findOne({ "trainNumber": element.trainNumber, "from": element.from, "to": element.to }, function (err, resbd) {
            if (err) {
              res.json({ "error": err });
            };
            if (!resbd) {
              db.collection("tickets").insert(element, function (err, resbd) {
                if (err) {
                  res.json({ "error": err });
                };

              });
            }
          });
        });
      })
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
