let obj;
let ModelMaterialsArray = [];
let ModelAttributeArray = [];
let imgToLoad = 2;

//loadExternalJSON('./images/cow.json');
function fetchMain() {

	//gl = createWebGLContext();

	loadExternalJSON('./images/cow.json');
	loadExternalJSON('./images/dummy_obj.json');
}

function createMaterialsArray(json_obj) {
	// console.log('In createMaterialsArray()...');
	// console.log('Meshes length: ' + json_obj.meshes.length);

	const MAT_LEN = json_obj.materials.length;
	let idx = 0;
	for (idx = 0; idx < MAT_LEN; idx++) {
		let met = {};
		met.shadingm = json_obj.materials[idx].properties[1].value;
		met.ambient = json_obj.materials[idx].properties[2].value;
		met.diffuse = json_obj.materials[idx].properties[3].value;
		met.specular = json_obj.materials[idx].properties[4].value;
		met.shininess = json_obj.materials[idx].properties[6].value;

		ModelMaterialsArray.push(met);
	}
}

function createModelAttributeArray(json_obj) {

	const numMeshIndices = json_obj.meshes.length;
	let idx = 0;
	for (idx = 0; idx < numMeshIndices; idx++) {
		let modelObj = {};

		modelObj.vertices = json_obj.meshes[idx].vertices;
		modelObj.normals = json_obj.meshes[idx].normals;

		// faces is given as array of arrays, want to flatten
		// '...' expands faces so we can concat together
		modelObj.indices = [].concat(...json_obj.meshes[idx].faces);

		// which material index to use for this set of indices?
		modelObj.matIndex = json_obj.meshes[idx].materialindex;

		if (json_obj.meshes[idx].texturecoords !== undefined)
			modelObj.texturecoords = json_obj.meshes[idx].texturecoords[0];

		// push onto array
		ModelAttributeArray.push(modelObj);
	}
}


function loadExternalJSON(url) {
	fetch(url)
	.then((resp) => {
		if (resp.ok)
			return resp.json();
		throw new Error(`Could not get ${url}`);
	})
	.then(function (ModelInJson) {
		obj = ModelInJson;
		createMaterialsArray(ModelInJson);
		createModelAttributeArray(ModelInJson);
		imgToLoad -= 1;
		if (imgToLoad == 0) //done loading images
			startWebGL();
	})
	.catch(function(error) {
		alert(error);
	});

}