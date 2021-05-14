const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors')
const bodyParser = require('body-parser');

const port = process.env.PORT || 4001;

const app = express();
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

// SOCKET -------------------
io.on("connection", (socket) => {

  console.log("New client connected");
  countClient++;

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    countClient--;
    if (countClient === 0) {
      io.emit('code-unlocked', {uuid: 'server'})
    }
  });

  socket.on('update-code', (msg) => {
    console.log('update-code event')
    latestCodeVersion = msg
    io.emit('update-code', msg)
  });

  socket.on('code-locked', (msg) => {
    console.log('code-locked event')
    io.emit('code-locked', msg)
  })

  socket.on('code-unlocked', (msg) => {
    console.log('code-unlocked event')
    io.emit('code-unlocked', msg)
  })

});

server.listen(port, () => console.log(`Listening on port ${port}`));
