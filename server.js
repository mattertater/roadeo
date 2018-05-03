// Socket/Express setup
var express = require('express');
var socket = require('socket.io');
var app = express();
app.use(express.static('public'));
var server = app.listen(3000);
var io = socket(server);

// Current player arrays
var clients = [];
var players = [];
var scores = [];

io.on('connection', newConnection);

// Used to not draw goal close to edges
var margin = 20;

// The closest the goal can spawn to any player
var minGoalDist = 200;

// Size of all players
var playerSize = 13;

// Size of canvas
var width = 600,
	height = 600;

var lastTime = 0,
	currentTime = 0;

// Player data
function Player(id, name, color, px, py) {
	this.id = id;
	this.name = name;
	this.color = color;
	this.score = 0;
	this.x = px;
	this.y = py;
}

// Goal data
var gx = 300,
	gy = 300;


//
// Runs when new player enters the game, before name entry
// --Only adds to client array--
//
function newConnection(socket) {
	console.log("New Connection: " + socket.id);

	// New ID listing in clients
	clients.push(socket.id);

	// Send players id back to them
	socket.emit('id', {
		id: socket.id,
	});

	// Send list of current players to check name conflicts on client side
	socket.emit('initialPlayerData', {
		players: players,
	});

	socket.emit('goalData', {
		x: gx,
		y: gy,
	});

	// Runs when the client disconnects from the server
	socket.on('disconnect', function () {

		// Remove from client array 
		var i = clients.indexOf(socket.id);
		clients.splice(i, 1);

		// Remove from players array
		i = players.map(function (e) {
			return e.id;
		}).indexOf(socket.id);
		if (i >= 0) {
			console.log("Removing player: " + players[i].name);
			io.emit('newMessage', {
				message: players[i].name + " has left the game"
			});
			players.splice(i, 1);
		} else {
			console.log("Got bad player index of " + i + " on removePlayer");
		}
	});


	// Runs when a name is received from the client
	socket.on('nameEntered', function (data) {
		players.push(new Player(data.id, data.name, data.color, data.x, data.y));
		console.log("Added " + data.name + " to the players array with ID " + data.id);
		io.emit('newMessage', {
			message: data.name + " has joined the game",
		});
	});


	// Runs whenever new position is received from the client
	socket.on('playerData', function (playerData) {
		// Get index of player
		var i = players.map(function (e) {
			return e.id;
		}).indexOf(playerData.id);

		// Make sure the index generated is valid
		if (i >= 0) {
			// Update player info in players array
			players[i].x = playerData.x;
			players[i].y = playerData.y;
		}
	});


	// Runs when the player is colliding with the goal
	socket.on('playerPoint', function (data) {

		gx = data.x;
		gy = data.y;

		// Get index of player
		var i = players.map(function (e) {
			return e.id;
		}).indexOf(data.id);

		if (i >= 0) {
			players[i].score++;
			sortPlayers();
		} else {
			console.log("Bad player index of " + i + " while incrementing point");
		}

		io.emit('goalData', {
			x: gx,
			y: gy,
		});
	});


	// Runs when the player wants an update of the players array and goal positions
	socket.on('requestUpdate', function () {
		socket.emit('updatedPlayers', {
			players: players,
		});
	});
}


//
// Sorts the player array by score
//
function sortPlayers() {
	players.sort(function (a, b) {
		var val1 = a.score,
			val2 = b.score;
		if (val1 < val2) return 1;
		if (val1 > val2) return -1;
		return 0;
	});
}


//
// Calculate distance between to points, (x1, y1) and (x2, y2)
//
function distance(x1, y1, x2, y2) {
	var dist;
	dist = Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
	return dist;
}
