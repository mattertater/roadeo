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

io.sockets.on('connection', newConnection);
io.sockets.on('disconnect', removeConnection);


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
function Player(name, color, score, px, py) {
	this.name = name;
	this.color = color;
	this.score = score;
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
	io.sockets.on('playerData', updatePlayer);

}


//
// Removes entries from both client and player data arrays
//
function removeConnection(socket) {
	console.log("Removing Connection: " + socket.id);
	// remove from client array 
	var i = allClients.indexOf(socket.id);
	allClients.splice(i, 1);

	// remove from player data array

}


//
// Runs when name is entered, and every update after that
// Adds info to player array, since its ready after name entry
//
function updatePlayer(playerData) {
	console.log("update player");
	// If player doesn't exist in the player array, add it
	if (!players[playerData.name]) {
		players.push(new Player(playerData.name, playerData.color, playerData.score,
			playerData.x,
			playerData.y));
	}

	// Get index in players array of this player
	var i = players.map(function (e) {
		return e.name;
	}).indexOf(playerData.name);
	players[i].color = playerData.color;
	players[i].name = playerData.name;
	players[i].x = playerData.x;
	players[i].y = playerData.y;
	players[i].score = playerData.score;

	// Collision checking
	if (distance(gx, gy, players[i].x, players[i].y) < (goalSize + playerSize)) {
		players[i].score += 1;
		resetGoal();
	}


	// Send player and goal data back to clients
	io.broadcast.emit('allPlayerData', players);
	io.broadcast.emit('goalData', {
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
	if (!(players.length)) return [300, 300];
	else {
		var x, y;
		var good = false;
		do {
			for (var i = 0; i < players.length - 1; i++) {
				x = (Math.random() * (width - (2 * margin))) + margin;
				y = (Math.random() * (height - (2 * margin))) + margin;
				dist = distance(x, y, players[i].x, players[i].y);
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
