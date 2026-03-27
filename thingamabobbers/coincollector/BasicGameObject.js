class Transform {
	constructor() {
		this.forward = [0, 0, 1];
		this.right = [1, 0, 0];
		this.up = [0, 1, 0];
	}

	doRotations(RotAngles) {
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

	crossMultiply(M,V) {
		console.log(M[0][3]);
		console.log(V[3]);
		var temp = [
			M[0][0]*V[0]+M[0][1]*V[1]+M[0][2] * V[2]+ M[0][3]*V[3],
			M[1][0]*V[0]+M[1][1]*V[1]+M[1][2] * V[2]+ M[1][3]*V[3],
			M[2][0]*V[0]+M[2][1]*V[1]+M[2][2] * V[2]+ M[2][3]*V[3],
			M[3][0]*V[0]+M[3][1]*V[1]+M[3][2] * V[2]+ M[3][3]*V[3]
		]
		console.log(temp);
		return temp;
	}

}

class GameObject {
	constructor() {
		this.loc = [0,0,0];
		this.rot = [0,0,0];
		this.isTrigger = false;
		this.collisionRadius = 0.1;
		this.velocity = [0,0,0];
		this.angVelocity = [0,0,0];
		this.name = "default";
		this.id = 0;
		this.prefab;
		this.tranform = new Transform();

	}

	Move() {
		var tempP = [0, 0, 0];
		for (var i = 0; i < 3; i++) {
			tempP[i] = this.loc[i];
			tempP[i] += this.velocity[i];
			this.rot[i] += this.angVelocity[i];
		}
		if (!this.isTrigger) {
			var clear = true;
			for (var so in m.Solid) {
				if (m.Solid[so] != this) {
					if (m.CheckCollision(tempP, this.collisionRadius, m.Solid[so].loc, m.Solid[so].collisionRadius)) {
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
			if (clear) {
				this.loc = tempP;
			}
		}
		else {
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

	Update() {
		console.error(this.name +" update() is NOT IMPLEMENTED!");
	}

	Render(program) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

		var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
		var size = 3;          // 2 components per iteration
		var type = gl.FLOAT;   // the data is 32bit floats
		var normalize = false; // don't normalize the data
		var stride = 6*Float32Array.BYTES_PER_ELEMENT;	//Size in bytes of each element     // 0 = move forward size * sizeof(type) each iteration to get the next position
		var offset = 0;        // start at the beginning of the buffer
		gl.enableVertexAttribArray(positionAttributeLocation);
		gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

		//Now we have to do this for color
		var colorAttributeLocation = gl.getAttribLocation(program,"vert_color");
		//We don't have to bind because we already have the correct buffer bound.
		size = 3;
		type = gl.FLOAT;
		normalize = false;
		stride = 6*Float32Array.BYTES_PER_ELEMENT;	//Size in bytes of each element
		offset = 3*Float32Array.BYTES_PER_ELEMENT;									//size of the offset
		gl.enableVertexAttribArray(colorAttributeLocation);
		gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset);

		var tranLoc  = gl.getUniformLocation(program,'transform');
		gl.uniform3fv(tranLoc,new Float32Array(this.loc));
		var thetaLoc = gl.getUniformLocation(program,'rotation');
		gl.uniform3fv(thetaLoc,new Float32Array(this.rot));

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ibuffer);

		gl.drawElements(gl.TRIANGLES,this.indexOrder.length,gl.UNSIGNED_SHORT,0);
	}

	OnCollisionEnter(other) {

	}

	OnTriggerEnter(other) {

	}
}

class Ship extends GameObject
{
	constructor()
	{
		super();
		this.name = "ship";
		this.collisionRadius = 0.05;
		this.reload = 0;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		this.vertices = [
			0.00, 0.10, 0.00, 1, 0, 0,
			0.10, -.10, 0.00, 0, 1, 0,
			-.10, -.10, 0.00, 0, 0, 1,
			0.00, -.02, 0.10, 0, 0, 0,
			0.00, -.02, -.10, 0, 0, 0,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.indexOrder = [
			0, 1, 3,
			0, 1, 4,
			0, 2, 3,
			0, 2, 4,
			1, 3, 4,
			2, 3, 4,
		];

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);
	}

	Update() {
		this.Move();
		this.rot[1] += -0.05;
		if (this.reload > 0) {
			this.reload--;
		}
	}

	OnCollisionEnter(other) {
		if (other.name == "enemy") {
			m.DestroyObject(this.id);
			document.getElementById("status").innerHTML = "GAME OVER!!!";
		}
	}
}

class Coin extends GameObject
{
	constructor()
	{
		super();
		this.name = "coin";
		this.collisionRadius = 0.15;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		this.vertices = [
			0.0, 0.0, 0.01, 1, 1, 1,
			0.0, 0.0, -.01, 1, 1, 1,
			0.07, -.07, 0.00, 1, 1, 0,
			0.10, 0.00, 0.00, 1, 1, 0,
			0.07, 0.07, 0.00, 1, 1, 0,
			0.00, 0.10, 0.00, 1, 1, 0,
			-.07, 0.07, 0.00, 1, 1, 0,
			-.10, 0.00, 0.00, 1, 1, 0,
			-.07, -.07, 0.00, 1, 1, 0,
			0.00, -.10, 0.00, 1, 1, 0,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.indexOrder = [
			0, 2, 3,
			0, 3, 4,
			0, 4, 5,
			0, 5, 6,
			0, 6, 7,
			0, 7, 8,
			0, 8, 9,
			0, 9, 2,

			1, 2, 3,
			1, 3, 4,
			1, 4, 5,
			1, 5, 6,
			1, 6, 7,
			1, 7, 8,
			1, 8, 9,
			1, 9, 2,
		];

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);
	}

	Update() {
		this.rot[1] += -0.05;
		this.Move();
	}

	OnTriggerEnter(other) {
		if (other.name == "ship") {
			m.DestroyObject(this.id);
			m.AddScore();
		}
	}
}

class Wall extends GameObject
{
	constructor()
	{
		super();
		this.name = "wall";

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		this.vertices = [
			0.1, 0.1, 0.0, 0.5, 0.5, 0.5,
			-.1, 0.1, 0.0, 0.5, 0.5, 0.5,
			0.1, -.1, 0.0, 0.3, 0.3, 0.3,
			-.1, -.1, 0.0, 0.3, 0.3, 0.3,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.indexOrder = [
			0, 1, 2,
			1, 2, 3,
		];

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);
	}

	Update() {

	}
}


class Enemy extends GameObject
{
	constructor()
	{
		super();
		this.name = "enemy";
		this.hp = 3;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		this.vertices = [
			0.0, 0.0, 0.1, 0, 0, 0,
			0.0, 0.0, -.1, 0, 0, 0,

			0.10, -.10, 0.00, 1, 0, 0,
			0.07, 0.00, 0.00, 1, 0, 0,
			0.10, 0.10, 0.00, 1, 0, 0,
			0.00, 0.07, 0.00, 1, 0, 0,
			-.10, 0.10, 0.00, 1, 0, 0,
			-.07, 0.00, 0.00, 1, 0, 0,
			-.10, -.10, 0.00, 1, 0, 0,
			0.00, -.07, 0.00, 1, 0, 0,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.indexOrder = [
			0, 2, 3,
			0, 3, 4,
			0, 4, 5,
			0, 5, 6,
			0, 6, 7,
			0, 7, 8,
			0, 8, 9,
			0, 9, 2,

			1, 2, 3,
			1, 3, 4,
			1, 4, 5,
			1, 5, 6,
			1, 6, 7,
			1, 7, 8,
			1, 8, 9,
			1, 9, 2,
		];

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);
	}

	Update() {
		this.rot[0] += 0.01;
		this.rot[1] += 0.01;
		this.rot[2] += 0.1;
		this.Move();
	}

	OnCollisionEnter(other) {
		var relative = [
			this.loc[0] - other.loc[0],
			this.loc[1] - other.loc[1],
			this.loc[2] - other.loc[2],
		]
		var relSpeed = Math.sqrt(
			Math.pow(relative[0], 2) +
			Math.pow(relative[1], 2) +
			Math.pow(relative[2], 2)
		);

		this.velocity[0] = relative[0] * 0.01 / relSpeed;
		this.velocity[1] = relative[1] * 0.01 / relSpeed;
	}
}

class Bullet extends GameObject
{
	constructor()
	{
		super();
		this.name = "bullet";
		this.collisionRadius = 0.03;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		this.vertices = [
			0.00, 0.05, -.03, 1, 1, 1,
			0.03, 0.00, 0.03, 0, 1, 1,
			-.03, 0.00, 0.03, 0, 1, 1,
			0.00, -.10, 0.00, 0, 0, 1,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.indexOrder = [
			0, 1, 2,
			0, 1, 3,
			0, 2, 3,
			1, 2, 3,
		];

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);
	}

	Update() {
		this.rot[1] += 0.1;
		this.Move();
	}

	OnTriggerEnter(other) {
		if (other.name == "wall") {
			m.DestroyObject(this.id);
		}
		if (other.name == "enemy") {
			m.DestroyObject(this.id);
			other.hp--;
			if (other.hp <= 0) {
				m.DestroyObject(other.id);
			}
		}
	}
}
