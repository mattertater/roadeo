/* eslint browser: true */


// Variable initialization 
var canvas = document.querySelector("#roadeo");
canvas.width = canvas.height = 600;
var context = canvas.getContext('2d');
context.font = '1em Helvetica';

// Setting up sockets
var socket = io.connect(document.location.href);

// Get our ID back from the server
socket.on('id', function (data) {
	playerID = data.id;
})

// Get list of names so we know if ours is legal
socket.on('initialPlayerData', function (players) {
	for (var i = 0; i < players.players.length; i++) {
		nameList.push(players.players[i].name);
	}
})

socket.on('goalData', drawGoal);
socket.on('allPlayerData', drawAllPlayers);
socket.on('newMessage', function (message) {
	messages.unshift(message);
});
socket.on('clearCanvas', function () {
	clearCanvas();
})

// Game-changing variables
var maxSpeed = 5;
var force = 2;
var friction = 0.97;
var wallBounce = -0.7; // -1 preserves all velocity

// Player variables
var playerColor = getRandomColor();
var playerID;
var name = '';
var nameList = [];
var messages = [];
var playerSize = 13;
var px = 100,
	py = 100;
var vx = 0,
	vy = 0;

// Goal variables
var goalColor = '#FFDF00';
var goalOutlineColor = '#D4AF37';


// Data variables
var keys = [];
var lastTime = 0,
	currentTime = 0;
var fps;
var frame = 0;

//
// Get player name
//
function nameEnter() {
	name = document.getElementById('username').value;
	if (!name) {
		alert("Please enter a name");
	} else if (document.getElementById('username').value.length > 11) {
		alert("Please enter a name less than 10 characters in length");
		name = '';
	} else if (nameList.includes(document.getElementById('username').value)) {
		alert("User with that name already exists");
		name = '';
	} else {
		name = document.getElementById('username').value;
		$('#nameModal').modal('hide');

		// Send server basic player info when name is set
		socket.emit('nameEntered', {
			id: playerID,
			name: name,
			color: playerColor,
			x: px,
			y: py,
		})
	}
}

// Handle pressing enter in the text field
document.getElementById('username').onkeypress = function (e) {
	if (!e) e = window.event;
	var keyCode = e.keyCode || e.which;
	if (keyCode == '13')
		nameEnter();
}


//
// Listen for key presses/releases
//
window.addEventListener("keydown", keysPressed, false);
window.addEventListener("keyup", keysReleased, false);

gameLoop();


//
// Main game loop where functions are called
//
function gameLoop() {

	requestAnimationFrame(gameLoop);

	if (name) {
		movePlayer(); // updates player values 
		// Send player data to server
		socket.emit('playerData', {
			id: playerID,
			x: px,
			y: py,
		});
	}
}


//
// Calculates new player position
//
function movePlayer() {
	// Apply friction to slow things down real nice
	vy *= friction;
	vx *= friction;

	// Bounds checking

	// If player touching right or left wall
	if (px > (canvas.width - playerSize)) {
		px = canvas.width - playerSize;
		vx *= wallBounce;
	} else if (px < (0 + playerSize)) {
		px = playerSize;
		vx *= wallBounce;
	}

	// If player touching bottom or top wall
	if (py > (canvas.height - playerSize)) {
		py = canvas.height - playerSize;
		vy *= wallBounce;
	} else if (py < (0 + playerSize)) {
		py = playerSize;
		vy *= wallBounce;
	}

	// Change position
	px += vx;
	py += vy;

}


//
// Pretty self explanatory
//
function clearCanvas() {
	context.clearRect(0, 0, canvas.width, canvas.height);
}


//
// Draws the goal coin, and checks to see if the player is in it
//
function drawGoal(goalData) {
	// Reset opacity just in case
	context.globalOpacity = 1.0;

	// Center colored part
	context.beginPath();
	context.arc(goalData.x, goalData.y, goalData.size, 0, 2 * Math.PI);
	context.fillStyle = goalColor;
	context.fill();

	// Slightly off-color outline
	context.beginPath();
	context.arc(goalData.x, goalData.y, goalData.size, 0, 2 * Math.PI);
	context.strokeStyle = goalOutlineColor;
	context.lineWidth = 2;
	context.stroke();
}


//
// Draws all players on screen, calls other draw functions
//
function drawAllPlayers(playerData) {
	var x, y, color;
	for (var i = 0; i < playerData.length; i++) {

		// Temporary variables for readability
		x = playerData[i].x;
		y = playerData[i].y;
		color = playerData[i].color;

		// If it's not me, make them a little transparent
		if (name != playerData[i].name)
			context.globalAlpha = 0.5;
		else
			context.globalAlpha = 1.0;

		// Center colored part
		context.beginPath();
		context.arc(x, y, playerSize, 0, 2 * Math.PI);
		context.fillStyle = color;
		context.fill();

		// Black outline
		context.beginPath();
		context.arc(x, y, playerSize, 0, 2 * Math.PI);
		context.strokeStyle = "#000";
		context.lineWidth = 2;
		context.stroke();

		// Player name
		context.fillStyle = "#000";
		context.fillText(playerData[i].name, x - 20, y - 20);

		// Reset opacity
		context.globalAlpha = 1.0;

		if (!nameList.includes(playerData[i].name))
			nameList.push(playerData[i].name);

		drawScoreboard(playerData);
		drawMessages();
	}
}


//
// Draws the player names and scores in the top right
//
function drawScoreboard(playerData) {

	context.fillStyle = "#000";
	context.fillText("Player", 10, 20);
	context.fillText("Score", 110, 20);
	context.fillText("- - - - - - - - - - - - - - -", 10, 30);

	var offset = 0;

	for (var i = 0; i < playerData.length; i++) {
		context.fillText(playerData[i].name, 10, 50 + offset);
		context.fillText(playerData[i].score, 110, 50 + offset)
		offset += 20;
	}
}


//
// Prints out the game updates in the bottom left corner
//
function drawMessages() {

	// Reset opacity and position offset
	context.globalAlpha = 1;
	var offset = 0;

	// Loop through messages, print with different offsets and opacities
	for (var i = 0; i < messages.length; i++) {
		context.globalAlpha = messages[i].opacity;
		context.fillText(messages[i].message, 10, 580 - offset);
		offset += 20;
		context.globalAlpha -= 0.3;
	}
	context.globalAlpha = 1;
}


// 
// Increments position if a key is pressed, handles multiple keypresses
// and support WASD as well as arrow keys
//
function keysPressed(e) {
	// Only be able to move if there is a name 
	if (name) {
		// Store entry if key is pressed
		keys[e.keyCode] = true;

		// ←
		if (keys[37] || keys[65]) {
			if (vx > -maxSpeed)
				vx -= 1;
		}

		// ↑
		if (keys[38] || keys[87]) {
			if (vy > -maxSpeed)
				vy -= 1;
		}

		// →
		if (keys[39] || keys[68]) {
			if (vx < maxSpeed)
				vx += 1;

		}

		// ↓
		if (keys[40] || keys[83]) {
			if (vy < maxSpeed)
				vy += 1;
		}
	}
}


//
// Set value to false in array of keys if released
//
function keysReleased(e) {
	keys[e.keyCode] = false;
}


//
// Create random 6-digit hex value
//
function getRandomColor() {
	var digits = '0123456789ABCDEF';
	var color = '#';

	for (var i = 0; i < 6; i++) {
		color += digits[Math.floor(Math.random() * 16)];
	}
	return color;
}







//
// Calculate distance between to points, (x1, y1) and (x2, y2)
//
function distance(x1, y1, x2, y2) {
	var dist;
	dist = Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
	return dist;
}
