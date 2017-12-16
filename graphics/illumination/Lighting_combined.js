//Matthew Chiang
//Lighting Example: 

//rotation
let prevTime = 0
let objRotation = 0

//camera
let Camera = 0;

//lighting vars
let dirSourceX = 1;
let dirSourceY = 1;
let dirSourceZ = -1;
let ambientLightColor = 20;
let shininess = 10;


// moon
// const moon_url = "images/moon-surface2.jpg"
//const moon_url = "images/globe.jpeg"
const moon_obj = uvSphere();
let moon_buffers = [null, null, null, null, null]; //position, normals, texCoord, indic, texture

// treeBark
// treeBark_url = "images/rcube.png"
// const treeBark_url = "images/bark.jpg"
const treeBark_obj = cube();
let treeBark_buffers = [null, null, null, null, null]; 

// tree crown
// const treeCrown_url = "images/treeCrown.jpg"
const treeCrown_obj = uvCone();
let treeCrown_buffers = [null, null, null, null, null];


//other matrices
let modelMatrix = mat4.create();
let iMatrix = mat4.create();
let perspectiveMatrix = mat4.create();

let transIntoView = [	1,	0,	0,	0,
						0, 	1, 	0, 	0,
						0,	0, 	1, 	0,
						0,	0,	-5,	1];


//canvas and shaders
let gl = 0;
let shaderSelect = 0;
let shaderProgram = [null, null, null, null];


function startWebGL() {

	gl = createWebGLContext();

	// init objects and event listeners
	Camera = initCamera();
	initActionListeners();

	// treeBark_buffers[4] = loadTexture(treeBark_url);
	initShapeBuffers(treeBark_obj, treeBark_buffers);

	// moon_buffers[4] = loadTexture(moon_url);
	initShapeBuffers(moon_obj, moon_buffers);

	// treeCrown_buffers[4] = loadTexture(treeCrown_url);
	initShapeBuffers(treeCrown_obj, treeCrown_buffers);

	// create shader programs
	shaderProgram[0] = createShaders_orig();
	shaderProgram[1] = createShaders_g_g();
	shaderProgram[2] = createShaders_g_p();
	shaderProgram[3] = createShaders_p_p();

	// set up screens for drawing
	gl.clearColor(0.5, 0.5, 0.5, 0.9);
	gl.enable(gl.DEPTH_TEST);

	//set up perspective matrix
	mat4.perspective(perspectiveMatrix, Math.PI/3, screen.width/screen.height, 1, 100);

	drawloop(0);
}


function createWebGLContext() {
	/*================Creating a canvas=================*/
	var canvas = document.getElementById('draw_surface');
	var gl = canvas.getContext('experimental-webgl'); 
	return gl;
}



function createShaders_orig() {
	/*=========================Shaders========================*/

	// vertex shader source code
	var vertCode = `
		attribute vec3 coordinates;

		uniform mat4 uPerspectiveMatrix;
		uniform mat4 uViewMatrix;
		uniform mat4 uModelMatrix;

		varying vec4 v_vertices;
		
		void main(void) {
			v_vertices = uViewMatrix * uModelMatrix * vec4(coordinates, 1.0);
			gl_Position = uPerspectiveMatrix * v_vertices;
		}`;

	// Create a vertex shader object
	var vertShader = gl.createShader(gl.VERTEX_SHADER);

	// Attach vertex shader source code
	gl.shaderSource(vertShader, vertCode);

	// Compile the vertex shader
	gl.compileShader(vertShader);

	// fragment shader source code
	var fragCode = `
		precision mediump float;


		uniform vec4 uShapeColor;

		void main(void) {

			gl_FragColor = uShapeColor;

		}`;
			 
	// Create fragment shader object
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

	// Attach fragment shader source code
	gl.shaderSource(fragShader, fragCode);

	// Compile the fragment shader
	gl.compileShader(fragShader);

	// Create a shader program object to store
	// the combined shader program
	var shaderProg_ret = gl.createProgram();

	// Attach a vertex shader
	gl.attachShader(shaderProg_ret, vertShader); 

	// Attach a fragment shader
	gl.attachShader(shaderProg_ret, fragShader);

	// Link both programs
	gl.linkProgram(shaderProg_ret);

	// Use the combined shader program object
	gl.useProgram(shaderProg_ret);

	return shaderProg_ret;
}

function createShaders_g_g() {
	/*=========================Shaders========================*/

	// vertex shader source code
	var vertCode = `
		attribute vec3 coordinates;
		attribute vec3 normalVectors;
		//attribute vec2 textureCoords;

		uniform mat4 uPerspectiveMatrix;
		uniform mat4 uViewMatrix;
		uniform mat4 uModelMatrix;
		uniform mat4 uNormalMatrix;

		uniform vec3 uDirectionalLightColor;
		uniform vec3 uDirectionalLightVector;
		uniform vec3 uAmbientLightColor;

		uniform float shininess;
		uniform vec4 specColor;
		uniform vec4 specMatColor;

		varying vec4 outColor;
		//varying vec2 frag_textureCoords;
		
		void main(void) {
			vec4 vertices = uViewMatrix * uModelMatrix * vec4(coordinates, 1.0);
			gl_Position = uPerspectiveMatrix * vertices;

			vec4 I_amb = vec4(uAmbientLightColor, 1.0);
			vec4 I_dir = vec4(1.0, 1.0, 1.0, 1.0);

			vec3 normalizedDirecVec = normalize(uDirectionalLightVector - vec3(vertices));
			vec3 transformedNormal = normalize(vec3(uNormalMatrix * vec4(normalVectors, 0.0)));
			float cosTheta = max(dot(transformedNormal, normalizedDirecVec), 0.0);
			I_dir = vec4((uDirectionalLightColor * cosTheta), 1.0);

			outColor = I_amb + I_dir;

			//frag_textureCoords = textureCoords; //just pass attribute to frag shader
		}`;

	// Create a vertex shader object
	var vertShader = gl.createShader(gl.VERTEX_SHADER);

	// Attach vertex shader source code
	gl.shaderSource(vertShader, vertCode);

	// Compile the vertex shader
	gl.compileShader(vertShader);

	// fragment shader source code
	var fragCode = `
		precision mediump float;

		//varying vec2 frag_textureCoords; //texture coordinates
		varying vec4 outColor;

		uniform vec4 uShapeColor;
		// uniform sampler2D uTexture; //texture colors

		void main(void) {
			gl_FragColor = uShapeColor * outColor;
			//gl_FragColor = texture2D(uTexture, textureCoord);
		}`;
			 
	// Create fragment shader object
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

	// Attach fragment shader source code
	gl.shaderSource(fragShader, fragCode);

	// Compile the fragment shader
	gl.compileShader(fragShader);

	// Create a shader program object to store
	// the combined shader program
	var shaderProg_ret = gl.createProgram();

	// Attach a vertex shader
	gl.attachShader(shaderProg_ret, vertShader); 

	// Attach a fragment shader
	gl.attachShader(shaderProg_ret, fragShader);

	// Link both programs
	gl.linkProgram(shaderProg_ret);

	// Use the combined shader program object
	gl.useProgram(shaderProg_ret);

	return shaderProg_ret;
}

function createShaders_g_p() {
	/*=========================Shaders========================*/

	// vertex shader source code
	var vertCode = `
		attribute vec3 coordinates;
		attribute vec3 normalVectors;
		//attribute vec2 textureCoords;

		uniform mat4 uPerspectiveMatrix;
		uniform mat4 uViewMatrix;
		uniform mat4 uModelMatrix;
		uniform mat4 uNormalMatrix;

		uniform vec3 uDirectionalLightColor;
		uniform vec3 uDirectionalLightVector;
		uniform vec3 uAmbientLightColor;

		uniform float shininess;
		uniform vec4 specColor;
		uniform vec4 specMatColor;

		varying vec4 outColor;
		//varying vec2 frag_textureCoords;
		
		void main(void) {
			vec4 vertices = uViewMatrix * uModelMatrix * vec4(coordinates, 1.0);
			gl_Position = uPerspectiveMatrix * vertices;

			vec4 I_amb = vec4(uAmbientLightColor, 1.0);
			vec4 I_dir = vec4(1.0, 1.0, 1.0, 1.0);
			vec4 I_spec = vec4(0.0, 0.0, 0.0, 1.0);

			vec3 normalizedDirecVec = normalize(uDirectionalLightVector - vec3(vertices));
			vec3 transformedNormal = normalize(vec3(uNormalMatrix * vec4(normalVectors, 0.0)));
			float cosTheta = max(dot(transformedNormal, normalizedDirecVec), 0.0);

			if (cosTheta > 0.0) {
				vec3 e = normalize(-vec3(vertices));
				vec3 r = reflect(-normalizedDirecVec, transformedNormal);
				float spec = pow(max(dot(e, r), 0.0), shininess);
				I_spec = spec * specMatColor * specColor;
			}
			I_dir = vec4((uDirectionalLightColor * cosTheta), 1.0);

			outColor = I_amb + I_dir + I_spec;

			//frag_textureCoords = textureCoords; //just pass attribute to frag shader
		}`;

	// Create a vertex shader object
	var vertShader = gl.createShader(gl.VERTEX_SHADER);

	// Attach vertex shader source code
	gl.shaderSource(vertShader, vertCode);

	// Compile the vertex shader
	gl.compileShader(vertShader);

	// fragment shader source code
	var fragCode = `
		precision mediump float;

		//varying vec2 frag_textureCoords; //texture coordinates
		varying vec4 outColor;

		uniform vec4 uShapeColor;
		// uniform sampler2D uTexture; //texture colors

		void main(void) {
			gl_FragColor = uShapeColor * outColor;
			//gl_FragColor = texture2D(uTexture, textureCoord);
		}`;
			 
	// Create fragment shader object
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

	// Attach fragment shader source code
	gl.shaderSource(fragShader, fragCode);

	// Compile the fragment shader
	gl.compileShader(fragShader);

	// Create a shader program object to store
	// the combined shader program
	var shaderProg_ret = gl.createProgram();

	// Attach a vertex shader
	gl.attachShader(shaderProg_ret, vertShader); 

	// Attach a fragment shader
	gl.attachShader(shaderProg_ret, fragShader);

	// Link both programs
	gl.linkProgram(shaderProg_ret);

	// Use the combined shader program object
	gl.useProgram(shaderProg_ret);

	return shaderProg_ret;
}



function createShaders_p_p() {
	/*=========================Shaders========================*/

	// vertex shader source code
	var vertCode = `
		attribute vec3 coordinates;
		attribute vec3 normalVectors;
		//attribute vec2 textureCoords;

		uniform mat4 uPerspectiveMatrix;
		uniform mat4 uViewMatrix;
		uniform mat4 uModelMatrix;
		uniform mat4 uNormalMatrix;

		//varying vec4 v_outColor;
		varying vec3 v_normals;
		varying vec4 v_vertices;
		//varying vec2 frag_textureCoords;
		
		void main(void) {
			v_vertices = uViewMatrix * uModelMatrix * vec4(coordinates, 1.0);
			gl_Position = uPerspectiveMatrix * v_vertices;

			v_normals = normalize(vec3(uNormalMatrix * vec4(normalVectors, 0.0)));
			//frag_textureCoords = textureCoords; //just pass attribute to frag shader
		}`;

	// Create a vertex shader object
	var vertShader = gl.createShader(gl.VERTEX_SHADER);

	// Attach vertex shader source code
	gl.shaderSource(vertShader, vertCode);

	// Compile the vertex shader
	gl.compileShader(vertShader);

	// fragment shader source code
	var fragCode = `
		precision mediump float;

		uniform vec3 uDirectionalLightColor;
		uniform vec3 uDirectionalLightVector;
		uniform vec3 uAmbientLightColor;
		uniform float shininess;
		uniform vec4 specColor;
		uniform vec4 specMatColor;
		uniform vec4 uShapeColor;
		// uniform sampler2D uTexture; //texture colors

		//varying vec4 v_outColor;
		varying vec3 v_normals;
		varying vec4 v_vertices;
		//varying vec2 frag_textureCoords; //texture coordinates

		void main(void) {
			vec4 I_amb = vec4(uAmbientLightColor, 1.0);
			vec4 I_dir = vec4(1.0, 1.0, 1.0, 1.0);
			vec4 I_spec = vec4(0.0, 0.0, 0.0, 1.0);

			vec3 normalizedDirecVec = normalize(uDirectionalLightVector - vec3(v_vertices));
			
			float cosTheta = max(dot(v_normals, normalizedDirecVec), 0.0);

			if (cosTheta > 0.0) {
				vec3 e = normalize(-vec3(v_vertices));
				vec3 r = reflect(-normalizedDirecVec, v_normals);
				float spec = pow(max(dot(e, r), 0.0), shininess);
				I_spec = spec * specMatColor * specColor;
			}
			I_dir = vec4((uDirectionalLightColor * cosTheta), 1.0);

			vec4 outColor = I_amb + I_dir + I_spec;

			gl_FragColor = uShapeColor * outColor;
			//gl_FragColor = texture2D(uTexture, textureCoord);

		}`;
			 
	// Create fragment shader object
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

	// Attach fragment shader source code
	gl.shaderSource(fragShader, fragCode);

	// Compile the fragment shader
	gl.compileShader(fragShader);

	// Create a shader program object to store
	// the combined shader program
	var shaderProg_ret = gl.createProgram();

	// Attach a vertex shader
	gl.attachShader(shaderProg_ret, vertShader); 

	// Attach a fragment shader
	gl.attachShader(shaderProg_ret, fragShader);

	// Link both programs
	gl.linkProgram(shaderProg_ret);

	// Use the combined shader program object
	gl.useProgram(shaderProg_ret);

	return shaderProg_ret;
}



function initShapeBuffers(model, store) {

	//position buffer
	store[0] = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, store[0]);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertexPositions), gl.STATIC_DRAW);

	//normals
	store[1] = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, store[1]);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertexNormals), gl.STATIC_DRAW);

	//texture coord buffer
	store[2] = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, store[2]);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertexTextureCoords), gl.STATIC_DRAW);

	//index buffer
	store[3] = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, store[3]);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

}


function loadTexture(url) {

	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	//before the image loads, put in a placeholder color
	const placeholder_color = new Uint8Array([0, 0, 0, 0]);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, placeholder_color);

	const image = new Image();
	image.src = url;
	image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		//parameters
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		//S and T coordinates start in a different corner than regular coordinates
	}

	return texture;
}



//listen for HTML changes
function initActionListeners() {

	document.getElementById("shaderSelect").addEventListener("change", function() {
		shaderSelect = document.getElementById("shaderSelect").value;
	});

	document.getElementById("dirSourceX").addEventListener("input", function() {
		dirSourceX = document.getElementById("dirSourceX").value;
	});

	document.getElementById("dirSourceY").addEventListener("input", function() {
		dirSourceY = document.getElementById("dirSourceY").value;
	});

	document.getElementById("dirSourceZ").addEventListener("input", function() {
		dirSourceZ = document.getElementById("dirSourceZ").value;
	});

	document.getElementById("ambientLightColor").addEventListener("input", function() {
		ambientLightColor = document.getElementById("ambientLightColor").value;
	});

	document.getElementById("shininess").addEventListener("input", function() {
		shininess = document.getElementById("shininess").value;
	});

}


// calls draw for each shape
function drawloop(now) {

	// calculate time between calls
	now *= 0.001;  // convert to seconds
	objRotation += (now - prevTime); // add change in time to rotation
	prevTime = now; // update previous time

	// Clear the canvas
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Select GPU program
	gl.useProgram(shaderProgram[shaderSelect]);

	// Send perspective uniform to GPU
	gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uPerspectiveMatrix'), false, perspectiveMatrix);

	// Send camera uniform to GPU
	gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uViewMatrix'), false, Camera.cameraTransformationMatrix);	

	//draw objects
	drawObj(treeBark_buffers, treeBark_obj, 3, 0, 0, objRotation, 0, objRotation); //cube
	drawObj(treeCrown_buffers, treeCrown_obj, 0, 0, 0, -Math.PI/2 + objRotation, 0, objRotation); //cone
	drawObj(moon_buffers, moon_obj, -3, 0, 0, objRotation, 0, objRotation); //sphere

	//recursive call
	window.requestAnimationFrame(drawloop);

} //end drawloop


function drawObj(bufs, obj, x, y, z, xrotate, yrotate, zrotate) {

	
	// vertex position
	gl.bindBuffer(gl.ARRAY_BUFFER, bufs[0]);
	const coord = gl.getAttribLocation(shaderProgram[shaderSelect], "coordinates");
	gl.vertexAttribPointer(
		coord, //attribute location
		3,  //item size
		gl.FLOAT, //data type
		false, //normalize?
		0, //should I skip any bytes? Space between vertices
		0); // where to start reading
	gl.enableVertexAttribArray(coord);

	if (shaderSelect > 0) {
	// normals coords
	gl.bindBuffer(gl.ARRAY_BUFFER, bufs[1]);
	const normCoord = gl.getAttribLocation(shaderProgram[shaderSelect], "normalVectors");
	gl.vertexAttribPointer(
		normCoord, //attribute location
		3,  //item size
		gl.FLOAT, //data type
		false, //normalize?
		0, //should I skip any bytes? Space between vertices
		0); // where to start reading
	gl.enableVertexAttribArray(normCoord);
	}

	// // texture coords
	// gl.bindBuffer(gl.ARRAY_BUFFER, bufs[2]);
	// const texCoord = gl.getAttribLocation(shaderProgram[shaderSelect], "textureCoords");
	// gl.vertexAttribPointer(
	// 	texCoord, //attribute location
	// 	2,  //item size
	// 	gl.FLOAT, //data type
	// 	false, //normalize?
	// 	0, //should I skip any bytes? Space between vertices
	// 	0); // where to start reading
	// gl.enableVertexAttribArray(texCoord);


	// Pass down indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs[3]);

	// Calculate transformations / scaling / rotation
	x = x || 0;
	y = y || 0;
	z = z || 0;
	const translateVec = vec3.fromValues(x, y, z);
	xrotate = xrotate || 0;
	yrotate = yrotate || 0;
	zrotate = zrotate || 0;
	const scaleVec = vec3.fromValues(1,1,1);

	//calculate + send modelMatrix as uniform
	mat4.translate(modelMatrix, iMatrix, translateVec);
	mat4.scale(modelMatrix, modelMatrix, scaleVec);
	mat4.rotateX(modelMatrix, modelMatrix, xrotate);
	mat4.rotateY(modelMatrix, modelMatrix, yrotate);
	mat4.rotateZ(modelMatrix, modelMatrix, zrotate);
	mat4.multiply(modelMatrix, transIntoView, modelMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uModelMatrix'), false, modelMatrix); 

	// uniforms for shading
	var modelViewMatrix = mat4.create();
	mat4.multiply(modelViewMatrix, Camera.cameraTransformationMatrix, modelMatrix);
	var normalMatrix = mat4.create();
	mat4.invert(normalMatrix, modelViewMatrix);
	mat4.transpose(normalMatrix, normalMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uNormalMatrix'), false, normalMatrix);

	gl.uniform4fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uShapeColor'), vec4.fromValues(0/255, 0/255, 255/255, 255/255));
	gl.uniform3fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uDirectionalLightColor'), vec3.fromValues(1.0, 1.0, 1.0));
	gl.uniform3fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uDirectionalLightVector'), vec3.fromValues(dirSourceX, dirSourceY, dirSourceZ));
	gl.uniform3fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uAmbientLightColor'), vec3.fromValues(ambientLightColor/255, ambientLightColor/255, ambientLightColor/255));

	gl.uniform1f(gl.getUniformLocation(shaderProgram[shaderSelect], 'shininess'), shininess);

	gl.uniform4fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'specColor'), vec4.fromValues(1,1,1,1));
	gl.uniform4fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'specMatColor'), vec4.fromValues(1,1,1,1));


	gl.drawElements(gl.TRIANGLES, obj.indices.length, gl.UNSIGNED_SHORT, 0);
}

