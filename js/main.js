
// Declare variables
var scene, camera, renderer, gui;
var WIDTH, HEIGHT;


// The draw material
var material;

// The currentLine object
var currentLine;

// The eraser config (start as false)
var eraserConfig;

// Mouse variables
var	mouseIsPressed = false;
var mouseX, pMouseX, mouseY, pMouseY;

function init() {

	// Scene object
	scene = new THREE.Scene();
	gui = new dat.GUI();
		

	// Let's use the whole display
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;

	// Because we are drawing in 2D, we don't need a perspective camera
	camera = new THREE.OrthographicCamera( 0, WIDTH, 0, HEIGHT, 0, 0.1 );
	camera.lookAt (new THREE.Vector3 (0,0,0));

	renderer = new THREE.WebGLRenderer( {antialias: true});
	
	// Because we don't use multiple transparent materials sortObjects isn't needed
	renderer.sortObjects = false;
	
	renderer.setSize( WIDTH, HEIGHT );
	
	// Add renderer to page
	document.body.appendChild( renderer.domElement );

	// Call function resize() on window resize
	window.addEventListener( 'resize', resize );
	
	
	
	// add Mouse Event Listener to functions and update mouse pos
	renderer.domElement.addEventListener ('mousedown', function () {
		mouseX = event.clientX;
		mouseY = event.clientY;
		mouseIsPressed = true; 
		onMousePressed();
	});
	renderer.domElement.addEventListener ('mousemove', function () { 
		pMouseX = mouseX;
		pMouseY = mouseY;
		mouseX = event.clientX;
		mouseY = event.clientY;
		if (mouseIsPressed) {
			onMouseDragged(); 
		}
	});
	
	renderer.domElement.addEventListener ('mouseup', function () { 
		mouseIsPressed = false; 
	});
	
	
	// Creating background color config
	var backgroundConfig = {background : 0x00000};
	gui.addColor(backgroundConfig, 'background').onChange( (colorValue) => {
		scene.background = new THREE.Color(colorValue);
	});
	
	// Creating eraser config
	eraserConfig = { eraser : false};
	gui.add(eraserConfig, 'eraser').onChange ((value) => {
		if(value){
			document.body.style.cursor = 'cell';
		}else{
			document.body.style.cursor = 'default';
		}
	}) ;
	
	// Create starting material with color green
	material = new THREE.LineBasicMaterial ( {color:0x14ac00, depthWrite:false } );
	var colorConfig = { color : '#14ac00' };    
	
	// On every change of the color picker, create a new material with the updated color
	gui.addColor(colorConfig, 'color').onChange( (colorValue) => {
		material = new THREE.LineBasicMaterial ( {color:colorValue, depthWrite:false } );
	});
	
	// Creating invert colors button
	var invertConfig = {invert : invertColors};
	gui.add(invertConfig, 'invert');
	
	
	render();
}




// Reshape window
function resize() {
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	camera.right = WIDTH;
	camera.bottom = HEIGHT;
	camera.updateProjectionMatrix();
	renderer.setSize(WIDTH,HEIGHT);
	render();
}


// The render loop
function render () {
	requestAnimationFrame( render );
	renderer.render( scene, camera );
};


// If mouse is pressed and eraser not currentLine, start a new line
function onMousePressed() {
	if(!eraserConfig['eraser']){
		var newGeo = new THREE.Geometry();
		newGeo.vertices.push (new THREE.Vector3 (mouseX,mouseY,0));
		var line = new THREE.Line (newGeo, material);
		scene.add (line);
		currentLine = line;
	}
}

// If mouse is being pressed and moved
function onMouseDragged() {
	var line = currentLine;
	var point = new THREE.Vector3 (mouseX,mouseY,0);

	if(!eraserConfig['eraser']){
		// If eraser is not currentLine add a new entry to the lines vertices and update it's geometry
		var newVerts = line.geometry.vertices;
		newVerts.push(point);
		var newGeo = new THREE.Geometry();
		newGeo.vertices = newVerts;
		line.geometry = newGeo;
	}else{
		
		// Store all lines in scene
		var allLines = []
		
		scene.traverse( function( object ) {
			if ( object.isLine ) allLines.push(object);
		} );
		
		// Iterate over all lines in scene and remove object if distance between mouse pos and one of its vertices <10
		allLines.forEach(l => {
			for (var i = 0; i< l.geometry.vertices.length;i+=1)
			{
				var a = new THREE.Vector2(l.geometry.vertices[i].x, l.geometry.vertices[i].y);
				if(a.distanceTo(new THREE.Vector2(mouseX, mouseY)) <10){
					l.geometry.dispose();
					l.material.dispose();
					scene.remove(l);
				}
			}
		});
	}
}

function invertColors(){
	
	// List to store all already inversed materials, because if an even number of lines have the same color it will get inverserd even times, which results in the color not changing
	alreadyInversed = [];
	
	// Iterate over all line objects
	scene.traverse( function( object ) {
		
		if (object.isLine){
			if(! alreadyInversed.includes(object.material.uuid)){
				var r = object.material.color.r;
				var g = object.material.color.g;
				var b = object.material.color.b;
				object.material.color.setRGB(1-r, 1-g,1-b);
				alreadyInversed.push(object.material.uuid);
			}
		}
	});
}


// Start the program
init();
