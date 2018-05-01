// Socket/Express setup
var express = require('express');
var socket = require('socket.io');
var app = express();
app.use(express.static('public'));
var server = app.listen(3000);
var io = socket(server);

// Current player arrays
var allClients = [];
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
var goalSize = 20;
var gPos = getGoalPosition();
var gx = gPos[0],
	gy = gPos[1];

//
// Runs when new player enters the game, before name entry
// --Only adds to client array--
//
function newConnection(socket) {
	console.log("New Connection: " + socket.id);
	allClients.push(socket.id);
	socket.emit('id', {
		id: socket.id,
	});
	socket.emit('initialPlayerData', {
		players: players,
	});

	socket.on('disconnect', function () {

		// remove from client array 
		var i = allClients.indexOf(socket.id);
		allClients.splice(i, 1);

		// remove from players array
		i = players.map(function (e) {
			return e.id;
		}).indexOf(socket.id);
		if (i >= 0) {
			console.log("Removing player: " + players[i].name);
			players.splice(i, 1);
		} else {
			players = []
		}
	});

	socket.on('playerData', updatePlayer);
}

//
// Runs when name is entered, and every update after that
// Adds info to player array, since its ready after name entry
//
function updatePlayer(playerData) {

	// Get index of player
	var i = players.map(function (e) {
		return e.name;
	}).indexOf(playerData.name);

	// If player doesn't exist in the player array, add it
	if (!players[i]) {
		console.log("Adding new player " + playerData.name);
		players.push(new Player(playerData.id, playerData.name, playerData.color,
			playerData.x,
			playerData.y));
	} else {

		// Update player info in players array
		players[i].x = playerData.x;
		players[i].y = playerData.y;

		// Collision checking
		if (distance(gx, gy, players[i].x, players[i].y) < (goalSize + playerSize)) {
			players[i].score++;
			io.emit('allPlayerData', players);
			resetGoal();
		}

	}
	// Send player and goal data back to clients
	io.emit('allPlayerData', players);
	io.emit('goalData', {
		x: gx,
		y: gy,
		size: goalSize,
	});
}


//
// Resets the goal position and size
//
function resetGoal() {
	goalSize = 20;
	gPos = getGoalPosition();
	gx = gPos[0], gy = gPos[1];
}


// 
// Set new goal position, min of 200 away from any player
//
function getGoalPosition() {
	// If nobody is playing, don't check based on players
	if (players.length == 0) return [300, 300];
	else {
		var x, y;
		var good = false;
		do {
			for (var i = 0; i < players.length; i++) {
				x = (Math.random() * (width - (2 * margin))) + margin;
				y = (Math.random() * (height - (2 * margin))) + margin;
				dist = distance(x, y, players[i].x, players[i].y);
				console.log("Trying x: " + x.toFixed(2) + ",y: " + y.toFixed(2));
				if (dist > minGoalDist)
					good = true;
				else
					good = false;
			}
		} while (!good);

		return [x, y];
	}
}


//
// Calculate distance between to points, (x1, y1) and (x2, y2)
//
function distance(x1, y1, x2, y2) {
	var dist;
	dist = Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
	return dist;
}
