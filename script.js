/* eslint browser: true */

//
// Variable initialization 
//
var canvas = document.querySelector("#roadeo");
canvas.width = canvas.height = 600;
var context = canvas.getContext('2d');
context.font = '1em Consolas';


var vx = 0;
var vy = 0;
var force = 0.8;
var friction = 0.97;
var maxSpeed = 5;

var playerColor = getRandomColor();
var name = '';
var score = 0;
var playerSize = 13;
var px = 100,
	py = 100;

var goalColor = '#FFDF00';
var goalOutlineColor = '#D4AF37';
var goalSize = 20;
var minGoalDist = 300;
var margin = 20;
var gPos = getGoalPosition();
var gx = gPos[0],
	gy = gPos[1];

var keys = [];
var lastCalledTime;
var fps;


//
// Get player name
//
function nameEnter() {
	name = document.getElementById('username').value;
	if (!name) {
		alert("Please enter a name");
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
		nameEnter()
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
	checkCollisions();
	movePlayer(); // updates player position 

	clearCanvas(); // removes old frame

	drawGoal(); // draws the goal coin
	drawPlayer(); // draws new position
	drawStats(); // draws debugging stats
}


//
// Checks for collisions with goal and other objects (not the walls)
//
function checkCollisions() {
	if (distance(gx, gy, px, py) < (goalSize + playerSize)) {
		score += 1;
		gPos = getGoalPosition();
		gx = gPos[0], gy = gPos[1];
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
		vx *= -1;
	} else if (px < (0 + playerSize)) {
		px = playerSize;
		vx *= -1;
	}

	// If player touching bottom or top wall
	if (py > (canvas.height - playerSize)) {
		py = canvas.height - playerSize;
		vy *= -1;
	} else if (py < (0 + playerSize)) {
		py = playerSize;
		vy *= -1;
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
function drawGoal() {
	// Center colored part
	context.beginPath();
	context.arc(gx, gy, goalSize, 0, 2 * Math.PI);
	context.fillStyle = goalColor;
	context.fill();

	// Slightly off-color outline
	context.beginPath();
	context.arc(gx, gy, goalSize, 0, 2 * Math.PI);
	context.strokeStyle = goalOutlineColor;
	context.lineWidth = 2;
	context.stroke();
}


//
// Draws the player at it's updated position
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


//
// Draws out helpful information for debugging purposes
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
				left = true;
		} else left = false;

		// ↑
		if (keys[38] || keys[87]) {
			if (vy > -maxSpeed)
				up = true;
		} else up = false;

		// →
		if (keys[39] || keys[68]) {
			if (vx < maxSpeed)
				right = true;
		} else right = false;

		// ↓
		if (keys[40] || keys[83]) {
			if (vy < maxSpeed)
				down = true;
		} else down = false;
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


function boost() {

}

//
// Set new goal position, min of 200 away from player
//
function getGoalPosition() {
	do {
		x = (Math.random() * (canvas.width - (2 * margin))) + margin;
		y = (Math.random() * (canvas.height - (2 * margin))) + margin;
		dist = distance(x, y, px, py);
		console.log("distance: " + dist);
	} while (dist < minGoalDist);

	return [x, y];
}

//
// Calculate distance between to points, (x1, y1) and (x2, y2)
//
function distance(x1, y1, x2, y2) {
	var dist;
	dist = Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
	return dist;
}
