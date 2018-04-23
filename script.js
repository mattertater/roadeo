/* eslint browser: true */

//
// Variable initialization 
//
var canvas = document.querySelector("#roadeo");
canvas.width = canvas.height = 300;
var context = canvas.getContext('2d');
context.font = '1em Consolas';

var vx = 0;
var vy = 0;
var px = 100;
var py = 100;
var size = 13;
var friction = 0.97;
var playerColor = getRandomColor();
var keys = [];
var maxSpeed = 3;
var lastCalledTime;
var fps;


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
	movePlayer(); // updates player position
	drawPlayer(); // draws new position
}


//
// Calculates new player position
//
function movePlayer() {
	// Apply friction to slow things down real nice
	vy *= friction;
	vx *= friction;
	
	// Bounds checking
	if (px <= canvas.width && px >= 0){
		px += vx;
	} else resetPlayer();
	
	if (py <= canvas.height && py >= 0){
		py += vy;
	} else resetPlayer();
}


//
// Draws the player at it's updated position
//
function drawPlayer() {
	// Clear canvas
	context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Center colored part
  context.beginPath();
  context.arc(px, py, size, 0, 2 * Math.PI);
  context.fillStyle = playerColor;
  context.fill();
  
  // Black outline
  context.beginPath();
  context.arc(px, py, size, 0, 2 * Math.PI);
  context.fillStyle = "#000";
  context.lineWidth = 2;
  context.stroke();
	
	// Debugging text
	//context.fillText("fps: " + fps, 10, 15);
	context.fillText("vx: " + vx.toFixed(2), 10, 30);
	context.fillText("vy: " + vy.toFixed(2), 10, 45);
	context.fillText("px: " + px.toFixed(2), 10, 60);
	context.fillText("py: " + py.toFixed(2), 10, 75);
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
//
function keysPressed(e) {
  
  // Store entry if key is pressed
  keys[e.keyCode] = true;
  
	// ←
	if (keys[37] || keys[65]){
		if (vx > -maxSpeed)
			vx -= 1;
	}

	// ↑
	if (keys[38] || keys[87]){
		if (vy > -maxSpeed)
			vy -= 1;
	}

	// →
		if (keys[39] || keys[68]){
		if (vx < maxSpeed)
			vx += 1;
	}

	// ↓
	if (keys[40] || keys[83]){
		if (vy < maxSpeed)
			vy += 1;
	}   
	
	e.preventDefault();
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



//function requestAnimationFrame() {
//  if(!lastCalledTime) {
//     lastCalledTime = performance.now();
//     fps = 0;
//     return;
//  }
//  delta = (performance.now() - lastCalledTime)/1000;
//  lastCalledTime = performance.now();
//  fps = 1/delta;
//}