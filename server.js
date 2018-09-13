var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.htm');
});

server.lastPlayerID = 0;
server.lastBulletID = 0;
server.playersList = [];

server.listen(process.env.PORT || 8081, function() {
  console.log('Listening on ' + server.address().port);
});

var Bullet = function(id, pid, x, y, v, r, tr) {
  this.dt = Date.now();
  this.id = id;
  this.pid = pid;
  this.x = x;
  this.y = y;
  this.v = v;
  this.r = r;
  this.tr = tr;
  return this;
};

var Player = function(id, x, y) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.v = 0;
  this.r = 0;
  this.tr = 0;
  this.health = 5;
  this.score = 0;
  return this;
};

Player.maxHeath = 5;
bullets = [];
gSocket = null;

io.on('connection', function(socket) {
  gSocket = socket;
  socket.on('newplayer', function() {
    socket.player = new Player(
      server.lastPlayerID++,
      // randomInt(-1000, 1000),
      // randomInt(-1000, 1000)
      0,
      0
    );
    socket.emit('thisplayer', socket.player);
    socket.broadcast.emit('allplayers', getAllPlayers());
    socket.emit('allplayers', getAllPlayers());

    socket.on('move', function(data) {
      //            console.log('click to '+data.x+', '+data.y);
      socket.player.x = data.x;
      socket.player.y = data.y;
      socket.player.v = data.v;
      socket.player.r = data.r;
      socket.player.tr = data.tr;
      socket.broadcast.emit('move', socket.player);
    });

    socket.on('shoot', function(data) {
      var bullet = new Bullet(Object.keys(bullets).length, data.pid, data.x, data.y, data.v, data.r, data.tr);
      bullets.push(bullet);
      socket.broadcast.emit('shoot', bullet);
      socket.emit('shoot', bullet);
    });

    socket.on('disconnect', function() {
      io.emit('remove', socket.player.id);
    });
  });

  socket.on('test', function() {
    console.log('test received');
  });
});




function getAllPlayers() {
  var players = [];
  Object.keys(io.sockets.connected).forEach(function(socketID) {
    var player = io.sockets.connected[socketID].player;
    if (player) players.push(player);
  });
  return players;
}
