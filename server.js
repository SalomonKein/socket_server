'use strict';
const express = require('express');
const http = require('http');
const io = require('socket.io');
const cors = require('cors');
const {on} = require('events');

let FETCH_INTERVAL = 5000;
const PORT = process.env.PORT || 4000;

const tickers = [
  {index: 'AAPL', name: 'Apple'},
  {index: 'GOOGL', name: 'Google'},
  {index: 'MSFT', name: 'Microsoft'},
  {index: 'AMZN', name: 'Amazon'},
  {index: 'FB', name: 'Facebook'},
  {index: 'TSLA', name: 'Tesla'},
];
function changeInterval(interval) {
  FETCH_INTERVAL = interval;
  // socketServer.on('disconnection')
}

function randomValue(min = 0, max = 1, precision = 0) {
  const random = Math.random() * (max - min) + min;
  return random.toFixed(precision);
}

function utcDate() {
  const now = new Date();
  return new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );
}

function getQuotes(socket) {
  const quotes = tickers.map((ticker) => ({
    ticker,
    exchange: 'NASDAQ',
    price: randomValue(100, 300, 2),
    change: randomValue(0, 200, 2),
    change_percent: randomValue(0, 1, 2),
    dividend: randomValue(0, 1, 2),
    yield: randomValue(0, 2, 2),
    last_trade_time: utcDate(),
  }));

  socket.emit('ticker', quotes);
}

function trackTickers(socket) {
  // run the first time immediately
  getQuotes(socket);

  // every N seconds
  const timer = setInterval(function () {
    getQuotes(socket);
  }, FETCH_INTERVAL);

  socket.on('disconnect', function () {
    clearInterval(timer);
  });
}

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const socketServer = io(server, {
  cors: {
    origin: '*',
  },
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post('/', function (req, res) {
  changeInterval(req.body.choice);
  res.status(200).json(`Interval ${req.body.choice} is success`);
});

socketServer.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  socket.on('start', () => {
    trackTickers(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Streaming service is running on http://localhost:${PORT}`);
});
