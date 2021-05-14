const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors')
const bodyParser = require('body-parser');

const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(index);
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Server var ------------
let latestCodeVersion;
let locked;
let countClient = 0;

// API ------------
app.get('/latest-code', (req, res) => {
  console.log('lates-code called')
  if (latestCodeVersion) {
    res.json({code: latestCodeVersion.code})
  } else {
    res.json({code: 'empty-code'})
  }
})
app.get('/require-lock', (req, res) => {
  console.log('require-lock called')
  if (!locked) {
    locked = true
    res.json({granted: true})
  } else {
    res.json({granted: false})
  }
})
app.get('/release-lock', (req, res) => {
  console.log('release-lock called')
  locked = false;
  res.json({done: true})
})

// SOCKET -------------------
io.on("connection", (socket) => {

  console.log("New client connected");
  countClient++;

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    countClient--;
    if (countClient === 0) {
      console.log('zero client, forcing lock false')
      locked = false
    }
  });

  socket.on('update-code', (msg) => {
    console.log('update-code event')
    latestCodeVersion = msg
    io.emit('update-code', msg)
  });

});

server.listen(port, () => console.log(`Listening on port ${port}`));
