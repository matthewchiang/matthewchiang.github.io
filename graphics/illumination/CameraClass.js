//camera class

const w_KEYCODE = 87
const s_KEYCODE = 83
const a_KEYCODE = 65
const d_KEYCODE = 68
const j_KEYCODE = 74
const k_KEYCODE = 75
const space_KEYCODE = 32
const up_KEYCODE = 38
const down_KEYCODE = 40



function initCamera() {
	var camera = {
		// key: value pairs
		// amount to scale movement
		moveSpeed : 0.1,
		// was our eye
		position : vec3.fromValues(0.0, 0.0, 0.0),
		// was target, looking down –Z axis
		viewDirection : vec3.fromValues(0.0, 0.0, -1.0),
		// which direction is up for camera
		upVector : vec3.fromValues(0.0, 1.0, 0.0),
		// matrix to hold our camera (viewMatrix)
		cameraTransformationMatrix : mat4.create() ,

		// function that creates viewMatrix based on current values
		// of position, viewDirection and upVector.
		// returns the cameraTransformationMatrix. to be sent to GPU
		getCameraTransformationMatrix: function(){
			//if you travel off the floor onto the water, you get reset to original position
			if ((Math.abs(this.position[0]) > 10) || (Math.abs(this.position[2]) > 10))
				this.resetLocation();

			let v1 = vec3.create(); // create temp vector to hold
			// position + viewDirection vector
			// adds the viewDirection vector to position => new
			// target/view direction
			vec3.add(v1, this.position, this.viewDirection);
			// create new camera (viewMatrix) and return it
			// store in this variable,
			mat4.lookAt(this.cameraTransformationMatrix,
			// EYE, new target, UP
			this.position, v1, this.upVector);

		},

		resetLocation: function() {
			this.position = vec3.fromValues(0.0, 0.0, 0.0);
			this.viewDirection = vec3.fromValues(0.0, 0.0, -1.0);
			this.upVector = vec3.fromValues(0.0, 1.0, 0.0);
			this.getCameraTransformationMatrix();
		},

		// now add other member functions
		// update the position by adding a scaled viewDirection to position
		// called when user presses “w” key on keyboard
		moveForward: function() {
			// temp vector to hold a scaled viewDirection vector.
			let scaled_viewDirection = vec3.create();
			vec3.scale(scaled_viewDirection, this.viewDirection, this.moveSpeed);
			vec3.add(this.position, this.position, scaled_viewDirection);
			// update matrix with new values
			this.getCameraTransformationMatrix();
		},
		moveBack: function() {
			// temp vector to hold a scaled viewDirection vector.
			let scaled_viewDirection = vec3.create();
			vec3.scale(scaled_viewDirection, this.viewDirection, this.moveSpeed);
			vec3.subtract(this.position, this.position, scaled_viewDirection);
			// update matrix with new values
			this.getCameraTransformationMatrix();
		},

		moveLeft: function() {
			// temp vector to hold a scaled vector.
			// up x view = left
			let scaled_crossProd = vec3.create();
			vec3.cross(scaled_crossProd, this.upVector, this.viewDirection);
			vec3.scale(scaled_crossProd, scaled_crossProd, this.moveSpeed);
			vec3.add(this.position, this.position, scaled_crossProd);

			// update matrix with new values
			this.getCameraTransformationMatrix();
		},
	
		moveRight: function() {
			// temp vector to hold a scaled vector.
			// view x up = right
			let scaled_crossProd = vec3.create();
			vec3.cross(scaled_crossProd, this.viewDirection, this.upVector);
			vec3.scale(scaled_crossProd, scaled_crossProd, this.moveSpeed);
			vec3.add(this.position, this.position, scaled_crossProd);

			// update matrix with new values
			this.getCameraTransformationMatrix();
		},
		
		rotateLeft: function() {
			let origin = vec3.fromValues(0,0,0);
			let angle = Math.PI/32;
			vec3.rotateY(this.viewDirection, this.viewDirection, origin, angle);
			this.getCameraTransformationMatrix();
		},
		
		rotateRight: function() {
			let origin = vec3.fromValues(0,0,0);
			let angle = -Math.PI/32;
			vec3.rotateY(this.viewDirection, this.viewDirection, origin, angle);
			this.getCameraTransformationMatrix();
		},

		jump: function() {
			let scaled_up = vec3.create();
			vec3.scale(scaled_up, this.upVector, this.moveSpeed);
			vec3.add(this.position, this.position, scaled_up);
			this.getCameraTransformationMatrix();
		},

		fall: function() {
			let scaled_up = vec3.create();
			vec3.scale(scaled_up, this.upVector, -this.moveSpeed);
			vec3.add(this.position, this.position, scaled_up);
			this.getCameraTransformationMatrix();
		}
		

	}; // end of Camera Object

	// add keyboard event listener
	window.addEventListener("keydown", processKeyPressed, false);

	return camera;

} //end initCamera



/*
This function is executed every time the user presses a key on
	the keyboard. Based on the key pressed, it calls the 
	appropriate method in the camera object.
*/
function processKeyPressed(e){
	switch(e.keyCode) {
		case w_KEYCODE:
			Camera.moveForward();
			break;
		case s_KEYCODE:
			Camera.moveBack();
			break;
		case a_KEYCODE:
			Camera.moveLeft();
			break;
		case d_KEYCODE:
			Camera.moveRight();
			break;
		case j_KEYCODE:
			Camera.rotateLeft();
			break;
		case k_KEYCODE:
			Camera.rotateRight();
			break;
		case up_KEYCODE: //move camera up
			Camera.jump();
			break;
		case down_KEYCODE: //move camera down
			Camera.fall();
			break;
		case space_KEYCODE: //begin firing!
			shot=0;
			break;

	} //end switch
} //end processKeyPressed
