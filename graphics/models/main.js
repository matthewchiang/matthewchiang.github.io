// Matthew Chiang
// Final Project


//rotation
let prevTime = 0
let objMovement = 0

//camera
let Camera = 0;

//lighting vars
let dirSourceX = 1;
let dirSourceY = 100;
let dirSourceZ = 100;
let ambientLightColor = 60;
let shininess = 80;

//objects
let cow;
let dummy = [];
let sand;
let water;
let background;
let treeCrown;
let treeTrunk;

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
let shaderSelect = 3;
let shaderProgram = [null, null, null, null];
let renderSelect = 0;
let toggleMovement = 1;
let toggleBackground = 0;

// Some classes for shapes
class Shape {
	constructor(model, texturl) {
		this.numIndices = model.indices.length;
		this.buffers = initShapeBuffers(model.vertexPositions, model.vertexNormals, model.vertexTextureCoords, model.indices);
		this.texture = loadTexture(texturl);
		this.ambient = vec3.fromValues(ambientLightColor/255, ambientLightColor/255, ambientLightColor/255);
		this.diffuse = vec3.fromValues(1, 1, 1);
		this.shininess = shininess;
		this.specular = vec3.fromValues(.5, .5, .5);
		this.shadingm = 1;
	}
	get_numIndices() {
		return this.numIndices;
	}
	get_buffers(index) {
		return this.buffers[index];
	}
	get_texture() {
		return this.texture;
	}
	get_ambient() {
		return this.ambient;
	}
	get_diffuse() {
		return this.diffuse;
	}
	get_shininess() {
		return this.shininess;
	}
	get_specular() {
		return this.specular;
	}
	get_shadingm() {
		return this.shadingm;
	}
};
class Obj3D {
	constructor(ModelAttributeArray, ModelMaterialsArray, texturl) {
		this.numIndices = ModelAttributeArray.indices.length;
		this.buffers = initShapeBuffers(ModelAttributeArray.vertices, ModelAttributeArray.normals, ModelAttributeArray.texturecoords, ModelAttributeArray.indices);
		this.texture = loadTexture(texturl);
		this.ambient = vec3.fromValues(ModelMaterialsArray.ambient[0], ModelMaterialsArray.ambient[1], ModelMaterialsArray.ambient[2]);
		this.diffuse = vec3.fromValues(ModelMaterialsArray.diffuse[0], ModelMaterialsArray.diffuse[1], ModelMaterialsArray.diffuse[2]);
		this.shininess = ModelMaterialsArray.shininess;
		this.specular = vec3.fromValues(ModelMaterialsArray.specular[0], ModelMaterialsArray.specular[1], ModelMaterialsArray.specular[2]);
		this.shadingm = ModelMaterialsArray.shadingm;
	}
	get_numIndices() {
		return this.numIndices;
	}
	get_buffers(index) {
		return this.buffers[index];
	}
	get_texture() {
		return this.texture;
	}
	get_ambient() {
		return this.ambient;
	}
	get_diffuse() {
		return this.diffuse;
	}
	get_shininess() {
		return this.shininess;
	}
	get_specular() {
		return this.specular;
	}
	get_shadingm() {
		return this.shadingm;
	}

};

function startWebGL() {

	gl = createWebGLContext();

	// init objects and event listeners
	Camera = initCamera();
	initActionListeners();
	
	cow = new Obj3D(ModelAttributeArray[0], ModelMaterialsArray[0], "./images/cow_Diff.jpg");
	// dummy is more than one array for attributes
	for (i = 1; i < ModelAttributeArray.length; i++) {
		dummy[i-1] = new Obj3D(ModelAttributeArray[i], ModelMaterialsArray[1], "./images/dummy_wood.jpg");
	}
	sand = new Shape(cube(), "./images/sand.jpg");
	background = new Shape(cube(), "images/treeCrown.jpg");
	treeCrown = new Shape(uvCone(), "images/treeCrown.jpg");
	treeTrunk = new Shape(cube(), "images/bark.jpg");
	water = new Shape(cube(), "images/water.jpg");

	// create shader programs
	shaderProgram[0] = createShaders_orig();
	shaderProgram[1] = createShaders_g_g();
	shaderProgram[2] = createShaders_g_p();
	shaderProgram[3] = createShaders_p_p();

	// set up screens for drawing
	gl.clearColor(0.5, 0.5, 0.5, 0.9);
	gl.enable(gl.DEPTH_TEST);

	//set up perspective matrix
	mat4.perspective(perspectiveMatrix, Math.PI/3, screen.width/screen.height, 1, 10000);

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
		attribute vec2 textureCoords;

		uniform mat4 uPerspectiveMatrix;
		uniform mat4 uViewMatrix;
		uniform mat4 uModelMatrix;

		varying vec2 v_textureCoords; //texture coordinates
		
		void main(void) {
			vec4 vertices = uViewMatrix * uModelMatrix * vec4(coordinates, 1.0);
			gl_Position = uPerspectiveMatrix * vertices;
			v_textureCoords = textureCoords; //just pass attribute to frag shader
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

		varying vec2 v_textureCoords; //texture coordinates

		uniform sampler2D uTexture; //texture colors

		void main(void) {
			gl_FragColor = texture2D(uTexture, v_textureCoords);
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
		attribute vec2 textureCoords;

		uniform mat4 uPerspectiveMatrix;
		uniform mat4 uViewMatrix;
		uniform mat4 uModelMatrix;
		uniform mat4 uNormalMatrix;

		uniform vec3 uDirectionalLightColor;
		uniform vec3 uDirectionalLightSource;
		uniform vec3 uAmbientLightColor;

		uniform float shininess;
		uniform vec4 specColor;
		uniform vec4 specMatColor;

		varying vec4 outColor;
		varying vec2 v_textureCoords;
		
		void main(void) {
			vec4 vertices = uViewMatrix * uModelMatrix * vec4(coordinates, 1.0);
			gl_Position = uPerspectiveMatrix * vertices;

			vec4 I_amb = vec4(uAmbientLightColor, 1.0);
			vec4 I_dir = vec4(1.0, 1.0, 1.0, 1.0);

			vec3 normalizedDirecVec = normalize(uDirectionalLightSource - vec3(vertices));
			vec3 transformedNormal = normalize(vec3(uNormalMatrix * vec4(normalVectors, 0.0)));
			float cosTheta = max(dot(transformedNormal, normalizedDirecVec), 0.0);
			I_dir = vec4((uDirectionalLightColor * cosTheta), 1.0);

			outColor = I_amb + I_dir;

			v_textureCoords = textureCoords; //just pass attribute to frag shader
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

		varying vec2 v_textureCoords; //texture coordinates
		varying vec4 outColor;

		uniform sampler2D uTexture; //texture colors

		void main(void) {
			gl_FragColor = outColor * texture2D(uTexture, v_textureCoords);
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
		attribute vec2 textureCoords;

		uniform mat4 uPerspectiveMatrix;
		uniform mat4 uViewMatrix;
		uniform mat4 uModelMatrix;
		uniform mat4 uNormalMatrix;

		uniform vec3 uDirectionalLightColor;
		uniform vec3 uDirectionalLightSource;
		uniform vec3 uAmbientLightColor;

		uniform float shininess;
		uniform vec4 specColor;
		uniform vec4 specMatColor;

		varying vec4 outColor;
		varying vec2 v_textureCoords;
		
		void main(void) {
			vec4 vertices = uViewMatrix * uModelMatrix * vec4(coordinates, 1.0);
			gl_Position = uPerspectiveMatrix * vertices;

			vec4 I_amb = vec4(uAmbientLightColor, 1.0);
			vec4 I_dir = vec4(1.0, 1.0, 1.0, 1.0);
			vec4 I_spec = vec4(0.0, 0.0, 0.0, 1.0);

			vec3 normalizedDirecVec = normalize(uDirectionalLightSource - vec3(vertices));
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

			v_textureCoords = textureCoords; //just pass attribute to frag shader
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

		varying vec2 v_textureCoords; //texture coordinates
		varying vec4 outColor;

		uniform sampler2D uTexture; //texture colors

		void main(void) {
			gl_FragColor = outColor * texture2D(uTexture, v_textureCoords);
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
		attribute vec2 textureCoords;

		uniform mat4 uPerspectiveMatrix;
		uniform mat4 uViewMatrix;
		uniform mat4 uModelMatrix;
		uniform mat4 uNormalMatrix;

		varying vec3 v_normals;
		varying vec4 v_vertices;
		varying vec2 v_textureCoords;
		
		void main(void) {
			v_vertices = uViewMatrix * uModelMatrix * vec4(coordinates, 1.0);
			gl_Position = uPerspectiveMatrix * v_vertices;

			v_normals = normalize(vec3(uNormalMatrix * vec4(normalVectors, 0.0)));
			v_textureCoords = textureCoords; //just pass attribute to frag shader
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
		uniform vec3 uDirectionalLightSource;
		uniform vec3 uAmbientLightColor;
		uniform float shininess;
		uniform vec4 specColor;
		uniform vec4 specMatColor;
		uniform sampler2D uTexture; //texture colors

		varying vec3 v_normals;
		varying vec4 v_vertices;
		varying vec2 v_textureCoords; //texture coordinates

		void main(void) {
			vec4 I_amb = vec4(uAmbientLightColor, 1.0);
			vec4 I_dir = vec4(1.0, 1.0, 1.0, 1.0);
			vec4 I_spec = vec4(0.0, 0.0, 0.0, 1.0);

			// -l = vector of light -> vertex = light_position - vertex_position
			vec3 normalizedDirecVec = normalize(uDirectionalLightSource - vec3(v_vertices));
			
			float cosTheta = max(dot(v_normals, normalizedDirecVec), 0.0);

			if (cosTheta > 0.0) {
				vec3 e = normalize(-vec3(v_vertices));
				vec3 r = reflect(-normalizedDirecVec, v_normals);
				float spec = pow(max(dot(e, r), 0.0), shininess);
				I_spec = spec * specMatColor * specColor;
			}
			I_dir = vec4((uDirectionalLightColor * cosTheta), 1.0);

			vec4 outColor = I_amb + I_dir + I_spec;

			gl_FragColor = outColor * texture2D(uTexture, v_textureCoords);

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


function initShapeBuffers(vertexPositions, vertexNormals, vertexTextureCoords, indices) {

	retArray = [null, null, null, null];

	//position
	retArray[0] = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, retArray[0]);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);

	//normals
	retArray[1] = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, retArray[1]);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

	//texture coord
	retArray[2] = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, retArray[2]);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);

	//indices
	retArray[3] = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, retArray[3]);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	return retArray;
}

// check if we can create mipmap
// https://stackoverflow.com/questions/600293/how-to-check-if-a-number-is-a-power-of-2
function powerOfTwo(x) {
	return (x != 0) && ((x & (x - 1)) == 0);
}

function loadTexture(url) {

	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// before the image loads, put in a placeholder color + 1 pixel
	// prevents error of trying to use image before load
	// https://stackoverflow.com/questions/21954036/dartweb-gl-render-warning-texture-bound-to-texture-unit-0-is-not-renderable
	let placeholder_color = new Uint8Array([0, 0, 0, 0]);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, placeholder_color);

	let image = new Image();
	image.src = url;
	image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flips images so cow loads correctly
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		if (powerOfTwo(image.width) && powerOfTwo(image.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		else {
			//parameters
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		}

		//S and T coordinates start in a different corner than regular coordinates
	}

	return texture;
}


//listen for HTML changes
function initActionListeners() {

	document.getElementById("renderSelect").addEventListener("change", function() {
		renderSelect = document.getElementById("renderSelect").value;
	});

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

	document.getElementById("toggleMovement").addEventListener("change", function() {
		toggleMovement = document.getElementById("toggleMovement").checked;
	});

	document.getElementById("toggleBackground").addEventListener("change", function() {
		toggleBackground = document.getElementById("toggleBackground").checked;
	});

}


// calls draw for each shape
function drawloop(now) {

	// calculate time between calls
	now *= 0.001;  // convert to seconds
	if (toggleMovement == 1) {
		objMovement += (now - prevTime); // add change in time to rotation
		if (objMovement > 20) objMovement = 0
	}
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
	drawObjAndTexture(sand, 0, -1, 0, 0, 0, 0, 70, 1, 70);
	drawObjAndTexture(water, 0, -4.5, 0, 0, 0, 0, 2000, 1, 2000);
	if (toggleBackground == 1) {
		drawObjAndTexture(background, 0, 0, -1000, 0, 0, 0, 5000, 300, 1);
		drawObjAndTexture(background, 1000, 0, 0, 0, 0, 0, 1, 300, 5000);
		drawObjAndTexture(background, -1000, 0, 0, 0, 0, 0, 1, 300, 5000);
		drawObjAndTexture(background, 0, 0, 1000, 0, 0, 0, 5000, 300, 1);
	}
	drawObjAndTexture(treeCrown, -2, 1, -5, -Math.PI/2, 0, 0, 1, 1, 1);
	drawObjAndTexture(treeTrunk, -2, 0, -5, 0, 0, 0, 1, 1, 1);
	drawObjAndTexture(treeCrown, 1, 1, -5, -Math.PI/2, 0, 0, 1, 1, 1);
	drawObjAndTexture(treeTrunk, 1, 0, -5, 0, 0, 0, 1, 1, 1);
	drawObjAndTexture(cow, 3, -.5, -3+objMovement, 0, 0, 0, .001, .001, .001);
	for (i = 0; i < dummy.length; i++) {
		drawObjAndTexture(dummy[i], 3, -.5, -5+objMovement*1.07, 0, 0, 0, .01, .01, .01);
	}
	drawObjAndTexture(cow, -10, -.5, -5+objMovement*1.09, 0, 0, 0, .001, .001, .001);
	for (i = 0; i < dummy.length; i++) {
		drawObjAndTexture(dummy[i], -10, -.5, -3+objMovement, 0, 0, 0, .01, .01, .01);
	}

	//recursive call
	window.requestAnimationFrame(drawloop);

} //end drawloop



function drawObjAndTexture(objToDraw, x, y, z, xrotate, yrotate, zrotate, xscale, yscale, zscale) {

	// vertex position
	gl.bindBuffer(gl.ARRAY_BUFFER, objToDraw.get_buffers(0));
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
	gl.bindBuffer(gl.ARRAY_BUFFER, objToDraw.get_buffers(1));
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

	// texture coords
	gl.bindBuffer(gl.ARRAY_BUFFER, objToDraw.get_buffers(2));
	const texCoord = gl.getAttribLocation(shaderProgram[shaderSelect], "textureCoords");
	gl.vertexAttribPointer(
		texCoord, //attribute location
		2,  //item size
		gl.FLOAT, //data type
		false, //normalize?
		0, //should I skip any bytes? Space between vertices
		0); // where to start reading
	gl.enableVertexAttribArray(texCoord);

	// Pass down indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objToDraw.get_buffers(3));

	// Calculate transformations / scaling / rotation
	x = x || 0;
	y = y || 0;
	z = z || 0;
	const translateVec = vec3.fromValues(x, y, z);
	xrotate = xrotate || 0;
	yrotate = yrotate || 0;
	zrotate = zrotate || 0;
	xscale = xscale || 1;
	yscale = yscale || 1;
	zscale = zscale || 1;
	const scaleVec = vec3.fromValues(xscale, yscale, zscale);

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

	gl.uniform3fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uDirectionalLightColor'), objToDraw.get_diffuse());
	gl.uniform3fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uDirectionalLightSource'), vec3.fromValues(dirSourceX, dirSourceY, dirSourceZ));
	gl.uniform3fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'uAmbientLightColor'), objToDraw.get_ambient());

	gl.uniform1f(gl.getUniformLocation(shaderProgram[shaderSelect], 'shininess'), objToDraw.get_shininess());

	gl.uniform4fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'specColor'), vec4.fromValues(objToDraw.get_specular()[0], objToDraw.get_specular()[1], objToDraw.get_specular()[2], 1));
	gl.uniform4fv(gl.getUniformLocation(shaderProgram[shaderSelect], 'specMatColor'), vec4.fromValues(objToDraw.get_shadingm(), objToDraw.get_shadingm(), objToDraw.get_shadingm(), 1));

	// Send down texture
	gl.activeTexture(gl.TEXTURE0); // might need to add more for multiple textures / object
	gl.bindTexture(gl.TEXTURE_2D, objToDraw.get_texture()); // pass down colors
	gl.uniform1i(gl.getUniformLocation(shaderProgram[shaderSelect],'uTexture'), 0); // bound to texture unit 0

	// Draw wires depending on HTML
	if (renderSelect == 1)
		gl.drawElements(gl.LINES, objToDraw.get_numIndices(), gl.UNSIGNED_SHORT, 0);
	else
		gl.drawElements(gl.TRIANGLES, objToDraw.get_numIndices(), gl.UNSIGNED_SHORT, 0);
}
