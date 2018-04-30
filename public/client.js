/* eslint browser: true */


// Variable initialization 
var canvas = document.querySelector("#roadeo");
canvas.width = canvas.height = 600;
var context = canvas.getContext('2d');
context.font = '1em Consolas';

// Setting up sockets
var socket = io.connect('http://localhost:3000');

// Game-changing variables
var goalResetTime = 5; // seconds
var maxSpeed = 5;
var force = 2;
var friction = 0.97;
var wallBounce = -0.7; // -1 preserves all velocity

// Player variables
var playerColor = getRandomColor();
var name = '';
var score = 0;
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
	} else {
		name = document.getElementById('username').value;
		$('#nameModal').modal('hide');
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
// Main game loop where functions are called, forcing 60 fps
//
function gameLoop() {
	requestAnimationFrame(gameLoop);

	if (name) {
		frame += 1;
		checkCollisions();
		shrinkGoal();
		movePlayer(); // updates player position 
		// Send data to server
		socket.emit('playerData', {
			x: px,
			y: py,
			name: name,
			color: playerColor,
			score: score,
		});
	}

	// Get data from server
	socket.on("goalData", drawGoal);
	socket.on("allPlayerData", drawAllPlayers);
	clearCanvas(); // removes old frame
	drawGoal(); // draws the goal coin
	drawPlayer(); // draws new position
	drawStats(); // draws debugging stats
}

// **MOVE TO SERVER**
// Shrinks the goal over 5 seconds, then resets it if nobody gets it
//
function shrinkGoal() {

	if (frame < 2) lastTime = performance.now();
	currentTime = performance.now();
	deltaTime = currentTime - lastTime;
	//console.log(.0001 * deltaTime.toFixed());
	lastTime = currentTime;
	if (goalSize > 0)
		goalSize -= goalResetTime * .001 * deltaTime.toFixed();
	else
		resetGoal();



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
// Draws the player at it's updated position
// FIXME: maybe dont need this function?
//
function drawPlayer() {
	// Center colored part
	context.beginPath();
	context.arc(px, py, playerSize, 0, 2 * Math.PI);
	context.fillStyle = playerColor;
	context.fill();

	// Black outline
	context.beginPath();
	context.arc(px, py, playerSize, 0, 2 * Math.PI);
	context.strokeStyle = "#000";
	context.lineWidth = 2;
	context.stroke();

	// Player name
	context.fillStyle = "#000"
	context.fillText(name, px - 20, py - 20);
}


function drawAllPlayers(playerData) {
	for (var i = 0; i < playerData.length - 1; i++) {
		// Center colored part
		context.beginPath();
		context.arc(playerData[i].x, playerData[i].y, playerSize, 0, 2 * Math.PI);
		context.fillStyle = playerColor;
		context.fill();

		// Black outline
		context.beginPath();
		context.arc(playerData[i].x, playerData[i].y, playerSize, 0, 2 * Math.PI);
		context.strokeStyle = "#000";
		context.lineWidth = 2;
		context.stroke();

		// Player name
		context.fillStyle = "#000"
		context.fillText(playerData[i].name playerData[i].x - 20, playerData[i].y -
			20);
	}
}

//
// Draws out helpful information for debugging purposes
// NEED TO SHOW TOP 5 SCORES IN TOP CORNER OF SCREEN
//
function drawStats() {
	//context.fillText("fps: " + fps, 10, 15);
	context.fillText("vx: " + vx.toFixed(2), 10, 30);
	context.fillText("vy: " + vy.toFixed(2), 10, 45);
	context.fillText("px: " + px.toFixed(2), 10, 60);
	context.fillText("py: " + py.toFixed(2), 10, 75);
	context.fillText("gx: " + gx.toFixed(2), 10, 90);
	context.fillText("gy: " + gy.toFixed(2), 10, 105);
	context.fillText("score: " + score, 10, 120);
}

function drawScoreboard(scoreData) {

}

//
// Resets to the default position and 0 speed
//
function resetPlayer() {
	vx = 0;
	vy = 0;
	py = 100;
	px = 100;
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
