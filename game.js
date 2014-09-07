

// Prefix removal
o.requestPointerLock = o.requestPointerLock ||
			     o.mozRequestPointerLock ||
			     o.webkitRequestPointerLock;
document.exitPointerLock = document.exitPointerLock ||
			   document.mozExitPointerLock ||
			   document.webkitExitPointerLock;
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame;
})();

// Set up the canvas
var canvas=document.getElementById("canvas");
canvas.width=700;
canvas.height=window.innerHeight/window.innerWidth*700;

// Get webgl context
var gl = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});

// Setup depth and face culling
gl.depthMask(true);
gl.disable(gl.CULL_FACE); 

// Parse the map data into mesh
// See blend file, blenderexport.py and blenderconvert.html for map generation  
var meshes=parseCSG('BS2,3.76,.25T,4.84,-.04A,.45,.2,10|bS1.58,9.39,4.99R,,-.12,.99T-1.64,8.78,3.32|bS17.72,9.96,3.3T15.63,-1.4,3.09D1|BS18.78,2.01,.14T15.06,7.5,1.86M2|BS.11,.11,1.45T2.69,5.65,.31A1.67,,,13M1|cS6.34,4.16,21.45R,.71,,.71T14.1,-6.78,-.37A,11.23,,2|BS.75,15.65,3.64T2.93,-1.23,3.21D5A11.32,,,3|bS1,4.51,1.52T4.97,-14.88,1.31|bS9.07,9.07,6.55T12.31,-37.03,2.07|bS1,5.36,1.53R.2,,,.98T4.97,-23.7,-.71|bS.67,2.24,1T31.03,10.75,3.01|bS4.03,1.94,1.21T33.2,14.65,3.23|bS5.72,12.32,3.83T-10.78,.65,3.62|bS5.23,5.23,2.23T40.84,-7.59,-4.91|bS23.11,.95,.97T12.57,-7.59,-6.18|bS2.07,12.32,3.83T-10.78,.65,-3.57U13U14|bS2.52,2.42,1.64R,,,1T-3.6,-6.77,1.58|cS1,2.41,3.98R,-.71,,.71T-4.11,-6.77,3.2|bS16.47,16.47,1.42T68.47,-4.7,1.94|bS18.86,18.86,1.07T68.47,-4.7,1.94D18|bS8.94,8.94,2.74T76.59,-4.23,3.61|bS5.05,2.84,2.84T43.62,-5.86,3.27|bS9.29,9.9,4.55T43.82,-1.56,5.42U19U20U21|bS15.88,1,1T19.81,-3.75,8.23|bS1.25,1.25,1.25T33.98,-9.52,2.24A,12.52,,2|bS.79,.79,.79T4.92,-3.9,6.75|cS1.46,1.46,4.69T44.98,3.73,-.56|bS3.51,3.51,1.18T46.57,2.35,-4.34|bS6.22,1,1T-22.69,11.15,.78|bS1,1,3.16T76.05,1.89,-.98|bS14.11,1,.78T63.43,1.89,-4.66|BS70.63,39.27,15.09T27.25,-17.92,-4.58D2D7D8D9D10D11D12D15D16D17D22D23D24D25D26D27D28D29D30|BS.97,.97,.28T4.97,-27.63,-4.4A,.78,.32,13|bS.28,.06,.3T16.23,-9.84,.01A,1.13,,6|BS.4,3.04,.05T16.24,-7.01,.3U33A2.02,,,4M1|BS2.71,11.68,.68T30.73,-2.48,.3|BS2.41,2.38,.18T-10.67,-6.93,-.41M2|BS.67,1.39,.18T48.58,-10.49,.9A-.67,,.35,18|BS1.42,4.91,.16T35.24,-6.94,7.06|BS2.43,.72,.11T44.76,3.01,-5.44A-.24,,.21,14|BS.27,.27,2.21T5,-3.9,1.76|BS1,1,.16T4.92,-3.9,3.94|bS2.99,2.99,7.53T10.44,-36.17,1.4|BS10.23,10.23,.19T12.06,-37.98,-.43A,,3.87,2D42|BS1.71,1,.19T10.38,-41.17,-4.31A,.7,.38,11|BS1.71,1,.17R,,.71,.71T15.32,-36.14,-.19A-.7,,.35,11|BS.36,11.58,.36T6.93,-38.14,-.87A3.64,,,4A,,4.01,2D42M1|BS1.67,11.55,.1R,.23,,.97T35.6,-2.21,3.68M4|BS.11,.11,1.94T36.8,-9.79,1.09A,4,,5M1|cS5.68,2.88,7.78R,-.71,,.71T75.34,-8.53,.53A,8.64,,2|BS.59,9.79,3.22T71.68,-4.59,3.66A8.88,,,2D49|BS.22,9.7,.22T69.4,-4.53,4.26A4.49,,,4M1|BS2.43,.72,.12R,,1,T46.88,4.44,-2.28A.24,,.24,7|BS-2.64,1,.12T44.41,4.73,-2.52|BS-2.64,1,.12T44.57,2.73,-.78|BS2.43,.73,.12T43.03,3.01,-.65A-.24,,.23,7|BS1.69,1.69,.66T44.97,3.73,.6D26|BS.12,.12,1T43.54,2.35,2.15A2.85,,,2A,2.85,,2M1|BS1.65,1.23,.06R.25,,,.97T44.87,2.71,3.54M4|BS1.65,1.23,.06R,.25,.97,T44.87,4.79,3.54M4|BS.09,1.54,.09T43.48,3.77,3.17A2.93,,,2M1|BS.09,.44,.09R.71,,,.71T43.48,3.73,3.66A2.93,,,2M1|BS23.87,-4.12,1T56.78,2.51,-6.41M5|BS37.53,-15.82,1T18.31,1.82,-8M5|BS37.53,-15.82,1T18.31,-34.69,-5.44M5|bS.01,.01,.56R.09,,,1T-.09,-.47,-.28|BS.35,.35,4.46T-7.84,12.13,3.46A,-4.19,,6|BS.13,.82,.82T-28.69,11.16,.81M6|BS.07,.07,.43T-13.2,12.47,.16A,-.86,,19M1|BS.05,8.75,.05T-13.2,4.96,.45M1|BS.06,.82,1.94T45.89,-11.64,-6.32M6|BS1.12,.05,1.77T5.01,-11.34,1.08M7|BS1.42,.08,1.56R,,-.71,.71T-8.77,-7.57,-5.85M7|BS1.12,.05,1.77R,,.71,.71T49.95,1.99,-4.7M7|BS.22,9.7,.22T36.28,-8.74,-4.02A4.49,,,3M1|bS.57,1,1T38.3,-9.27,-6.11|BS5.75,.21,2.42T40.81,-9.85,-4.73D75|BS9.59,-4.12,1T45.08,-5.77,-.43M5|oS.28,.29,.29R.35,.35,-.15,.85M100|E78S1,1,1T5.09,-3.91,4.66|E78S1,1,1T35.68,14.94,2.84|oS.08,.08,.13R.02,,,1T,-.2,.27|oS.04,.04,.16R.02,-.17,.22,.96T.11,-.11,.05|oS.05,.03,.17R-.13,.22,.38,.89T.11,-.15,-.18|oS.04,.05,.15R-.69,.04,.25,.67T-.13,-.41,|oS.05,.04,.18R-.41,.29,.14,.85T-.11,-.22,.06|oS.07,.07,.21R-.2,.01,.27,.94T.08,.02,-.28|oS.04,.04,.27R.06,-.03,.26,.96T.08,-.02,-.54|oS.04,.04,.27R.07,,.26,.96T-.1,-.02,-.56|oS.07,.07,.21R-.16,.13,.29,.93T-.07,.02,-.29|oS.11,.11,.28R.23,,.01,.97T,-.02,U81U82U83U84U85U86U87U88U89U65M3|E90S1.51,1.51,1.51R,,.37,.93T50.47,13.44,2.08|E90S1.51,1.51,1.51R,,.37,.93T29.79,15.85,3.13|E90S1.51,1.51,1.51R,,-.21,.98T16.84,-30.04,.91|E78S1,1,1T76.08,1.88,-4.8|E78S1,1,1T45.34,-3.49,-6.51|E90S1.51,1.51,1.51R,,-.67,.74T83.35,13.03,2.08|E90S1.51,1.51,1.51R,,-.79,.61T44.23,-10.87,-5.78|E90S1.51,1.51,1.51R,,-.96,-.27T40.17,-12.4,-5.78|E90S1.51,1.51,1.51R,,-.56,-.83T36.25,-11.31,-5.78');

// Convert mesh into webgl buffers
var map=[];
for(i=0;i<meshes.length;i++){
	map.push([new GLBuffer(gl, new Float32Array(meshes[i][0]),"ARRAY_BUFFER"),new GLBuffer(gl, new Uint16Array(meshes[i][1]),"ELEMENT_ARRAY_BUFFER"),meshes[i][2],meshes[i][3],1]);
}

// Compile the shader program
var fs=document.getElementById("shader-fs").innerHTML;
fs=fs.replace('{{Textures}}',''+shaderMats()+'');
var program = new GLProgram(gl, document.getElementById("shader-vs").innerHTML, fs);

// Default Camera Projection
var pMatrix=new Float32Array([
2.4*innerHeight/innerWidth,0,0,0,
0,2.4,0,0,
0,0,-1.00002,-1,
0,0,-0.0200002,0]);

// Projection for ray
var rayMat=new Float32Array([
120,0,0,0,
0,120,0,0,
0,0,-1.00002,-1,
0,0,-0.0200002,0]);

// Create the main GLRenderer
var renderer=new GLRenderer(gl);

// Set the gl program to our shader
renderer.useProgram(program);

// Generate all the texutres
var bricks=brick(32,16,16);
var tiles=brick(0,4,8);
var noiseTexture=noise();
var clouds=cloud(5);
var clouds2=cloud(9);

// Attach to gl textures
renderer.addTexture(0,merge(bricks,noiseTexture,clouds)[0]);
renderer.addTexture(1,merge(tiles,noiseTexture,clouds2)[0]);

// Set the texture uniforms
renderer.setUniform("texture1",0);
renderer.setUniform("texture2",1);

// Function to the the ray distance using the shader
var rayDistance=function(ray,point){
	var pixels = new Uint8Array(4);
	
	// Consruct the view matrix from the ray direction
	var raymat=new Float32Array([ray[1],ray[2],ray[0], point[0],ray[2],ray[0],ray[1], point[1],ray[0],ray[1],ray[2], point[2],0,0,0,1]);
	
	// Set program uniforms for ray casing
	renderer.setUniform("uPMatrix",rayMat);
	renderer.setUniform("uMVMatrix",inverseTransposeMat4(raymat));
	
	// We are stuffing the ray result into only 1 pixel so no point in rendering whole viewport
	gl.viewport(0, 0, 1, 1);
	
	// Clear previous rendered data
	renderer.clear();
	
	// Set the uniform flag to switch to raycast output in gl program
	renderer.setUniform("dist",1.0);
	
	// Render all object in the world
	renderLevel();
	
	// Read back the result of the ray
	gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	
	//Returns distance and normal data decoded from pixels
	return [pixels[0],normalize([(pixels[1]/255)-0.5,(pixels[2]/255)-0.5,(pixels[3]/255)-0.5])];
};
var colors=[[1,0.2,0.1], [.2,1,0.1],[.2,.1,1], [0,0,0]];

// Simple function to render all visible objects;
var renderLevel=function(){
	var c=0;
	for(i=0;i<map.length;i++){
		if(map[i][2]==100) renderer.setUniform('ecolor',colors[c++]);
		if(map[i][4]){
			renderer.setUniform('mat',map[i][2]);
			renderer.useBuffer(map[i][0]);
			renderer.useElements(map[i][1]);
			renderer.drawElements();
		}
	}
};

// Start the game when button clicked
P.onclick=function(){
	startTime=+new Date;
	lastTime=+new Date;
	
	// Hide title and request pointer lock
	o.requestPointerLock();
	K.style.display='none';
	
	// Show welcome Message
	showMessage(messages[4]);
	
	// Initial a new camera
	camera=new GLCamera; 
	
	// Set Playing flag and start gameloop
	flash=1;
	playing=true;
	gameLoop();
};

// In game messages
var messages=['Well done, you\'ve found an element - there may be hope!', 'Two down. Doors will open but hurry, there isn\'t much time', 'There\'s still hope - the last element may require a leap of faith', 'Well done but your light is dwindling - you must find the portal back', 'You have entered the Shadow Realm. Find the elements and the portal back to Krull - you haven\'t much time...your light is limited. Remember, avoid the shadow guards; they will drain your light and hasten your defeat', 'You have failed in your quest - darkness has fallen forever.<br>Press F5 to try again', 'Krull is safe with the elements restored; your people are prosperous once more.<br>Press F5 to play again'];

var messageTime;

// Displays a message to the player
var showMessage=function(message, time){
	if(!time) time=0;
	M.innerHTML=message;
	messageTime=time+new Date;
};

var elementsCollected=0;
var baddieDistance=1e5;
var nearestLight=[0,0,0];

// Detect collitions with shadow guards and elements
var processInteractions=function(){
	var mindist=1e5;
	var mindistl=1e5;
	for(i=0;i<map.length;i++){
		var p1=map[i][3], p2=camera.position, m=camera.matrix;
		// Calc Distance between camera and map element
		var a=p1[0]-p2[0],b=p1[1]-p2[1],c=p1[2]-p2[2];
		var d=a*a+b*b+c*c;
		
		//exit portal
		if(map[i][2]==6 && d<1.5 && elementsCollected==4){
			showMessage(messages[6],1e5);
			playing=false;
			document.exitPointerLock();
			totalTime=1;
		}
		
		if(map[i][2]==100 && map[i][4]){
			// We only light up the nearest element to make things simpler so find the nearest
			if(d<mindistl){
				nearestLight=p1;
				mindistl=d;
			}
			// Detect the element collision
			if(d<.5){
				map[i][4]=0;
				elementsCollected++;
				Z.innerHTML=elementsCollected;
				showMessage(messages[elementsCollected-1]);
				camera.vel[0]*=-2;camera.vel[1]*=-2;camera.vel[2]*=-2;
				flash=100;
				playSound(pickup);
			}
		}
		// Detect proximity to baddies so we can drain the light
		if(map[i][2]==3 && map[i][4]){
			if(mindist>d){
				mindist=d;
				var dir=-m[2]*a-m[6]*b-m[10]*c;
				baddieDistance=dir>0?d/dir:1e5;
			}
		}
		// Open the closed doors when two elements have been found
		if(map[i][2]==7){
			map[i][4]=elementsCollected<2;
		}
	}
	if(mindistl>1e4) nearestLight=[0,0,0];
};
var totalTime=120000; // Total time in ms to complete the game
var wallHit,floorDist;
var playing=false;

// The main game loop
var gameLoop=function(){
	// process Player interactions with world elements
	processInteractions();
	
	// Change message opacity
	var time=+new Date;
	var deltaTime=time-lastTime;
	lastTime=time;
	messageTime++;
	M.style.opacity=Math.pow(Math.log(5000+1-(time-messageTime))/Math.log(5000),3).toFixed(2);
	
	// Find time since game started
	var dt=totalTime-time+startTime;
	
	// If near baddie drain remaining Light
	if(baddieDistance<10) startTime-=50;
	
	// Update Light %
	X.style.width=X.innerHTML=Math.max(0,Math.round(dt/totalTime*100))+'%';
	
	// Check if game over
	if(dt<0 && elementsCollected!=4){
		playing=false;
		document.exitPointerLock();
		showMessage(messages[5],1e5);
	}
	// Adjust the flashing brightness and flashing based on remaining time and proximity to shadow guards
	flash=(flash+Math.pow(Math.log(1+dt)/Math.log(totalTime),3))*0.5;
	flash*=Math.min(1,baddieDistance/20+.2);
	if(Math.random()>flash*1.3) flash*=.5;
	renderer.setUniform("flash",flash);
	

	
	// Check for collisions in the direction of the camera velocity and react if too close
	var v=camera.vel;
	wallHit=rayDistance(normalize([-v[0],-v[1],-v[2]]),camera.position);
	if(wallHit[0]<30 && wallHit[0]>0){
		var d=v[0]*wallHit[1][0]+v[1]*wallHit[1][1]+v[2]*wallHit[1][2];
		if(wallHit[0]<15) d*=0.02/Math.abs(d);
		v[0]-=d*wallHit[1][0];
		v[1]-=d*wallHit[1][1];
		v[2]-=d*wallHit[1][2];
	}
	
	// Check distance from floor so we can fall or adjust
	floorDist=rayDistance([0,0,1],camera.position);
	if(floorDist[0]>25){
		camera.addVel([0,0,-0.002]);
	}else if(floorDist[0]<25){
		camera.addVel([0,0,0.001]);
	}
	// Process camera velocity and update
	camera.tick(deltaTime);
	
	// Sets the viewport to full canvas
	gl.viewport(0, 0, canvas.width, canvas.height);
	
	// Clear ready for rendering
	renderer.clear();
	
	// Set program uniforms
	renderer.setUniform("uPMatrix",pMatrix);
	renderer.setUniform("uMVMatrix",camera.invMatrix);
	renderer.setUniform("dist",0.0);
	renderer.setUniform("time",dt);
	renderer.setUniform("cameraPos",camera.position);
	renderer.setUniform("nearestLight",nearestLight);
	
	// Render game elements
	renderLevel();
	
	// If playing continue game looping
	if(playing) requestAnimFrame(gameLoop);
};

// Render the initial title screen view
var flash=1;
var camera=new GLCamera;
var startTime=+new Date;
var lastTime=+new Date;
gameLoop();

// Default walking speed
var speed=0.005;

// User Interactions
var drag=false;

// Sets the draging to true if we have pointer lock
document.onpointerlockchange=document.onwebkitpointerlockchange=document.onmozpointerlockchange=function(e){
	drag=document.pointerLockElement!=null|document.mozPointerLockElement!=null|document.webkitPointerLockElement!=null;
};

// incase we don't have pointer lock let the user use left click and drag
o.onmousedown=function(e){
	drag=[e.clientX,e.clientY];
	e.preventDefault();
	return false;
};
o.onmousemove=function(e){
	//check for movements and use if available
	var dx = e.movementX || e.mozMovementX || e.webkitMovementX,
	  dy = e.movementY || e.mozMovementY || e.webkitMovementY;
	
	if(drag){
		// If we don't have and movment calculate from the drag start point
		if(!dx && !dy){
			dx=e.clientX-drag[0];
			dy=e.clientY-drag[1];
		}
		
		// Rotate the camera based on the change in mouse posiiton/movment
		if(dx) camera.rotateH(dx*0.01);
		if(dy) camera.rotateV(dy*0.01);
		
		// Set drag position to current event position so we can use next time to find movement
		drag[0]=e.clientX;
		drag[1]=e.clientY;
	}
};

// Monitor keyboards events
var keys=[];
document.onmouseup=function(e){drag=false;if(playing) o.requestPointerLock();};
document.addEventListener("keydown",function(e){
	keys[e.keyCode]=true;
},false);
document.addEventListener("keyup",function(e){
	keys[e.keyCode]=false;
},false);

// Process keypressed when game in progress
setInterval(function(){
	if(playing){
		// Use the camera matrix to determine the directions to add velocitys
		var m=camera.matrix;
		if(keys[87]) camera.addVel([-m[2]*speed,-m[6]*speed,0]);
		if(keys[83]) camera.addVel([m[2]*speed,m[6]*speed,0]);
		if(keys[65]) camera.addVel([-m[0]*speed,-m[4]*speed,0]);
		if(keys[68]) camera.addVel([m[0]*speed,m[4]*speed,0]);
	}
},15);

document.getElementById('l').style.display='none';
