class Transform
		{
			constructor()
			{
				this.forward = [0,0,1];
				this.right = [1,0,0];
				this.up = [0,1,0];
			}

			doRotations(RotAngles)
			{
				this.xRot = [
							[1,0,0,0],
							[0,Math.cos(RotAngles[0]),-1*Math.sin(RotAngles[0]),0],
							[0,Math.sin(RotAngles[0]),Math.cos(RotAngles[0]),0],
							[0,0,0,1]
						];
				this.yRot = [
						[Math.cos(RotAngles[1]),0,Math.sin(RotAngles[1]),0],
						[0,1,0,0],
						[-1*Math.sin(RotAngles[1]),0,Math.cos(RotAngles[1]),0],
						[0,0,0,1]
						];
				this.zRot = [
							[Math.cos(RotAngles[2]),-1*Math.sin(RotAngles[2]),0,0],
							[Math.sin(RotAngles[2]),Math.cos(RotAngles[2]),0,0],
							[0,0,1,0],
							[0,0,0,1]
						]
				//this.forward = this.crossMultiply(xRot,[0,0,1,0]);
				this.forward = this.crossMultiply(this.zRot,this.crossMultiply(this.yRot,this.crossMultiply(this.xRot,[0,0,1,0])))
				this.right = this.crossMultiply(this.zRot,this.crossMultiply(this.yRot,this.crossMultiply(this.xRot,[1,0,0,0])))
				this.up = this.crossMultiply(this.zRot,this.crossMultiply(this.yRot,this.crossMultiply(this.xRot,[0,1,0,0])))
			}
			crossMultiply(M,V)
			{
			// console.log(M[0][3]);
			// console.log(V[3]);
			var temp = [
						M[0][0]*V[0]+M[0][1]*V[1]+M[0][2] * V[2]+ M[0][3]*V[3],
						M[1][0]*V[0]+M[1][1]*V[1]+M[1][2] * V[2]+ M[1][3]*V[3],
						M[2][0]*V[0]+M[2][1]*V[1]+M[2][2] * V[2]+ M[2][3]*V[3],
						M[3][0]*V[0]+M[3][1]*V[1]+M[3][2] * V[2]+ M[3][3]*V[3]
						]
			// console.log(temp);
				return temp;
			}

		}


class GameObject
{
	constructor()
	{
		this.loc = [0,0,0];
		this.rot = [0,0,0];
		this.isTrigger = false;
		this.collisionRadius = 1.0;
		this.velocity = [0,0,0];
		this.angVelocity = [0,0,0];
		this.name = "default";
		this.id = 0;
		this.prefab;
		this.transform = new Transform();
	}

	Move()
	{
		var tempP = [0,0,0]
		for(var i =0; i< 3;i ++)
		{
			tempP[i] = this.loc[i];
			tempP[i] += this.velocity[i];
			this.rot[i] += this.angVelocity[i];
		}
		if(!this.isTrigger)
		{
			var clear = true;
			for(var so in m.Solid)
			{
				if(m.Solid[so] != this)
				{
					if(m.CheckCollision(tempP,this.collisionRadius,m.Solid[so].loc,m.Solid[so].collisionRadius))
					{
						clear = false;
						this.OnCollisionEnter(m.Solid[so]);
						try {
							m.Solid[so].OnCollisionEnter(this);
						}
						catch (error) {
							// Object was deleted
						}
					}
				}
			}
			if(clear)
			{
				this.loc = tempP;
			}
		}
		else
		{
			this.loc = tempP;
			for (var so in m.Solid) {
				if (m.Solid[so] != this) {
					if (m.CheckCollision(tempP, this.collisionRadius, m.Solid[so].loc, m.Solid[so].collisionRadius)) {
						clear = false;
						this.OnTriggerEnter(m.Solid[so]);
						try {
							m.Solid[so].OnTriggerEnter(this);
						}
						catch (error) {
							// Object was deleted
						}
					}
				}
			}
		}
	}

	Update()
	{
		console.error(this.name +" update() is NOT IMPLEMENTED!");
	}

	Render(program)
	{
		// This is an easter egg
		var glorchFactor = 0
		if (Math.random() > 1 - m.glorch) {
			glorchFactor = Math.random() * -6;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

		var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
		var size = 3;          // 2 components per iteration
		var type = gl.FLOAT;   // the data is 32bit floats
		var normalize = false; // don't normalize the data
		var stride = (9 + glorchFactor)*Float32Array.BYTES_PER_ELEMENT;	//Size in bytes of each element     // 0 = move forward size * sizeof(type) each iteration to get the next position
		var offset = 0;        // start at the beginning of the buffer
		gl.enableVertexAttribArray(positionAttributeLocation);
		gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

		//Now we have to do this for color
		var colorAttributeLocation = gl.getAttribLocation(program,"vert_color");
		//We don't have to bind because we already have the correct buffer bound.
		size = 3;
		type = gl.FLOAT;
		normalize = false;
		stride = (9 + glorchFactor)*Float32Array.BYTES_PER_ELEMENT;	//Size in bytes of each element
		offset = 3*Float32Array.BYTES_PER_ELEMENT;									//size of the offset
		gl.enableVertexAttribArray(colorAttributeLocation);
		gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset);

		var normalAttributeLocation = gl.getAttribLocation(program,"vert_normal");
		//We don't have to bind because we already have the correct buffer bound.
		size = 3;
		type = gl.FLOAT;
		normalize = false; // The normals are already normalized, so this isn't needed?
		stride = (9 + glorchFactor)*Float32Array.BYTES_PER_ELEMENT;	//Size in bytes of each element
		offset = 6*Float32Array.BYTES_PER_ELEMENT;									//size of the offset
		gl.enableVertexAttribArray(normalAttributeLocation);
		gl.vertexAttribPointer(normalAttributeLocation, size, type, normalize, stride, offset);

		var tranLoc  = gl.getUniformLocation(program,'transform');
		gl.uniform3fv(tranLoc,new Float32Array(this.loc));
		var thetaLoc = gl.getUniformLocation(program,'rotation');
		gl.uniform3fv(thetaLoc,new Float32Array(this.rot));

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ibuffer);

		gl.drawElements(gl.TRIANGLES, this.indexOrder.length, gl.UNSIGNED_SHORT, 0);
	}

	OnCollisionEnter(other) {

	}

	OnTriggerEnter(other) {

	}
}

class Ground extends GameObject
{
	constructor()
	{
		super();
		this.buffer=gl.createBuffer();
		this.colorBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		this.vertices =
		[
			-1000,0,-1000,0.2,1,0.1,0,1,0,
			1000,0, -1000,0.2,1,0.1,0,1,0,
			-1000,0,1000,0.2,1,0.1,0,1,0,
			1000, 0,1000,0.2,1,0.1,0,1,0,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.indexOrder = [
			0, 1, 2,
			1, 2, 3
		];

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);

		this.loc=[0,0,0];
		this.rot=[0,0,0];
	}
	Update()
	{
		//Do Nothing
	}
}

class Camera extends GameObject
{
	constructor()
	{
		super();
		this.name = "camera";
		this.collisionRadius = 0.5;
		this.detection = 0;
	}

	Update()
	{
		var deltaX = 0;
		var deltaZ = 0;
		var deltaR = 0;
		if( "A" in m.Keys && m.Keys["A"])
		{
			this.rot[1] -=.025;
		}
		if("D" in m.Keys && m.Keys["D"])
		{
			this.rot[1] +=.025;
		}
		if("W" in m.Keys && m.Keys["W"])
		{
			this.transform.doRotations(this.rot);
			deltaX += this.transform.forward[0]*.15;
			deltaZ += this.transform.forward[2]*-.15;
		}
		if("S" in m.Keys && m.Keys["S"])
		{
			this.transform.doRotations(this.rot);
			deltaX -= this.transform.forward[0]*.15;
			deltaZ -= this.transform.forward[2]*-.15;
		}
		if("Q" in m.Keys && m.Keys["Q"])
		{
			this.transform.doRotations(this.rot);
			deltaX -= this.transform.right[0]*.15;
			deltaZ -= this.transform.right[2]*-.15;
		}
		if("E" in m.Keys && m.Keys["E"])
		{
			this.transform.doRotations(this.rot);
			deltaX += this.transform.right[0]*.15;
			deltaZ += this.transform.right[2]*-.15;
		}
		this.velocity[0] = deltaX;
		this.velocity[2] = deltaZ;
		this.Move()
		// console.log(this.loc)
		if (this.detection > 0) {
			this.detection -= 0.05
		}
		else {
			this.detection = 0;
		}
	}

	Render(program)
	{
		var camLoc  = gl.getUniformLocation(program,'worldLoc');
		gl.uniform3fv(camLoc,new Float32Array(this.loc));
		var worldLoc = gl.getUniformLocation(program,'worldRotation');
		gl.uniform3fv(worldLoc, new Float32Array(this.rot));

		var redFlash = gl.getUniformLocation(program,'redFlash');
		gl.uniform4fv(redFlash,new Float32Array([this.detection, 0, 0, 0]));
	}

	OnTriggerEnter(other) {
		if (other.name == "enemy") {
			this.detection += 0.1
			if (this.detection > 1) {
				this.loc = [0, 0, 60]
				this.rot = [0, 0, 0]
			}
		}
	}
}

class Enemy extends GameObject
{
	constructor()
	{
		super();
		this.name = "enemy";

		this.collisionRadius = 6.0;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

		this.vertices = []
		this.indexOrder = []
		var model = parse_obj(enemy_object)
		for (var i = 0; i < model["vertices"].length; i++) {
			this.vertices = this.vertices.concat(model["vertices"][i])
		}
		for (var i = 0; i < model["faces"].length; i++) {
			var face = model["faces"][i]
			for (var j = 0; j < 3; j++) {
				this.indexOrder.push(face[j][0])
			}
		}

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);

		this.angVelocity = [0,0.1,0];
		this.velocity = [0.06, 0, 0.10]
	}

	Update()
	{
		if (m.hasWon) {
			var player = m.Solid["ID0"]
			var displacement = [
				player.loc[0] - this.loc[0],
				0,
				player.loc[2] - this.loc[2],
			]
			var distance = Math.sqrt(Math.pow(displacement[0], 2) + Math.pow(displacement[2], 2))
			this.velocity = [
				displacement[0] / distance * 0.12,
				0,
				displacement[2] / distance * 0.12,
			]
		}
		if (Math.abs(this.loc[0]) > 50) {
			this.velocity[0] *= -1
		}
		if (Math.abs(this.loc[2]) > 50) {
			this.velocity[2] *= -1
		}
		this.Move()
		// console.log(this.loc)
	}

	Render(program)
	{
		var spotlightLoc = gl.getUniformLocation(program,'spotlightLoc');
		gl.uniform3fv(spotlightLoc, new Float32Array([this.loc[0], 30, this.loc[2]]));
		super.Render(program)
	}
}

class Tree extends GameObject
{
	constructor()
	{
		super();
		this.name = "tree";
		this.collisionRadius = 0.5;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

		this.vertices = []
		this.indexOrder = []
		var model = parse_obj(tree_object)
		for (var i = 0; i < model["vertices"].length; i++) {
			this.vertices = this.vertices.concat(model["vertices"][i])
		}
		for (var i = 0; i < model["faces"].length; i++) {
			var face = model["faces"][i]
			for (var j = 0; j < 3; j++) {
				this.indexOrder.push(face[j][0])
			}
		}

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);

		this.loc = [0.0,0.0,0.0];
		this.rot = [0.0,0.0,0.0];
		this.angVelocity = [0,0,0];
	}
	Update()
	{
		this.Move();
	}
}

class Rock extends GameObject
{
	constructor()
	{
		super();
		this.name = "rock";
		this.collisionRadius = 1.0;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

		this.vertices = []
		this.indexOrder = []
		var model = parse_obj(rock_object)
		for (var i = 0; i < model["vertices"].length; i++) {
			this.vertices = this.vertices.concat(model["vertices"][i])
		}
		for (var i = 0; i < model["faces"].length; i++) {
			var face = model["faces"][i]
			for (var j = 0; j < 3; j++) {
				this.indexOrder.push(face[j][0])
			}
		}

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);

		this.loc = [0.0,0.0,0.0];
		this.rot = [0.0,0.0,0.0];
		this.angVelocity = [0,0,0];
	}
	Update()
	{
		this.Move();
	}
}


class Light extends GameObject
{
	constructor()
	{
		super();
		this.name = "light";
		this.collisionRadius = 1.0;
		// This will be set to true for the bluelight specil
		this.winner = false;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

		this.vertices = []
		this.indexOrder = []
		var model = parse_obj(light_object)
		for (var i = 0; i < model["vertices"].length; i++) {
			this.vertices = this.vertices.concat(model["vertices"][i])
		}
		for (var i = 0; i < model["faces"].length; i++) {
			var face = model["faces"][i]
			for (var j = 0; j < 3; j++) {
				this.indexOrder.push(face[j][0])
			}
		}

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);

		this.loc = [0.0,0.0,0.0];
		this.rot = [0.0,0.0,0.0];
		this.angVelocity = [0,0,0];
	}

	Update()
	{
		this.Move();
	}

	OnTriggerEnter(other) {
		if (other.name == "camera" && this.winner) {
			m.Win()
		}
	}
}


class Moon extends GameObject
{
	constructor()
	{
		super();
		this.name = "moon";

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

		this.vertices = []
		this.indexOrder = []
		var model = parse_obj(moon_object)
		for (var i = 0; i < model["vertices"].length; i++) {
			this.vertices = this.vertices.concat(model["vertices"][i])
		}
		for (var i = 0; i < model["faces"].length; i++) {
			var face = model["faces"][i]
			for (var j = 0; j < 3; j++) {
				this.indexOrder.push(face[j][0])
			}
		}

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);

		this.loc = [0.0,0.0,0.0];
		this.rot = [0.0,0.0,0.0];
		this.angVelocity = [0,0,0];
	}

	Update()
	{
		this.Move();
	}
}
