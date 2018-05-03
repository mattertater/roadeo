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

// Variable to not clear the screen every time
var clearCount = 0;

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
			console.log("Got bad index number for player array: " + i);
		}
	});

	socket.on('nameEntered', newPlayer);
	socket.on('playerData', updatePlayer);
}

//
// Runs when player enters a name
// Creates a new player in the players array
//
function newPlayer(data) {
	players.push(new Player(data.id, data.name, data.color, data.x, data.y));
	console.log("Added " + data.name + " to the players array with ID " + data.id);
	io.emit('newMessage', {
		message: data.name + " has joined the game"
	});
}


//
// Runs when name is entered, and every update after that
// Adds info to player array, since its ready after name entry
//
function updatePlayer(playerData) {

	// Get index of player
	var i = players.map(function (e) {
		return e.id;
	}).indexOf(playerData.id);

	// Make sure the index generated is valid
	if (i >= 0) {

		// Update player info in players array
		players[i].x = playerData.x;
		players[i].y = playerData.y;

		// Collision checking
		if (distance(gx, gy, players[i].x, players[i].y) < (goalSize + playerSize)) {
			players[i].score++;
			sortPlayers();
			resetGoal();
			console.log(players[i].name + " got a point!");

			// Send new players array to client to update scores
			io.emit('allPlayerData', players);
		}

		//shrinkGoal();

		// Send player and goal data back to clients
		if (clearCount) {
			io.emit('clearCanvas');
			clearCount = 0;
		} else {
			clearCount++;
		}
		io.emit('goalData', {
			x: gx,
			y: gy,
			size: goalSize,
		});
		io.emit('allPlayerData', players);
	}
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
