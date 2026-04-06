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
			//console.log(M[0][3]);
			//console.log(V[3]);
			var temp = [
						M[0][0]*V[0]+M[0][1]*V[1]+M[0][2] * V[2]+ M[0][3]*V[3],
						M[1][0]*V[0]+M[1][1]*V[1]+M[1][2] * V[2]+ M[1][3]*V[3],
						M[2][0]*V[0]+M[2][1]*V[1]+M[2][2] * V[2]+ M[2][3]*V[3],
						M[3][0]*V[0]+M[3][1]*V[1]+M[3][2] * V[2]+ M[3][3]*V[3]
						]
			//console.log(temp);
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


class Player extends GameObject
{
	constructor()
	{
		super();
		this.name = "player";
		this.collisionRadius = 0.1;
		this.reload = 0;
	}

	Update()
	{
		this.velocity = [0,0,0]
		this.angVelocity = [0, 0, 0]

		var moveAmount = 0
		var moveDir = [
			-Math.sin(this.rot[1]),
			0,
			-Math.cos(this.rot[1]),
		]
		// Update camera
		if (m.Keys["W"]) {
			moveAmount = 0.05;
		}
		if (m.Keys["A"]) {
			this.rot[1] += 0.03;
		}
		if (m.Keys["S"]) {
			moveAmount = -0.05;
		}
		if (m.Keys["D"]) {
			this.rot[1] -= 0.03;
		}
		if (m.Keys["X"]) {
			this.velocity[1] = -0.03;
		}
		if (m.Keys["Z"]) {
			this.velocity[1] = 0.03;
		}

		this.velocity[0] = moveDir[0] * moveAmount;
		this.velocity[2] = moveDir[2] * moveAmount;
		this.Move();

		if (this.reload > 0) {
			this.reload--;
		}

		if (m.Keys[" "] && this.reload == 0) { // Space
			this.reload = 3;
			// A bit of random scattering
			var bulletPos = [
				this.loc[0] + (Math.random() - 0.5) * 0.05,
				this.loc[1] + (Math.random() - 0.5) * 0.05 - 0.05,
				this.loc[2] + (Math.random() - 0.5) * 0.05,
			]
			var bullet = m.CreateObject(2,Bullet,bulletPos,this.rot);
			bullet.velocity[0] = (Math.random() - 0.5) * 0.01 + moveDir[0] * 0.2;
			bullet.velocity[1] = (Math.random() - 0.5) * 0.01;
			bullet.velocity[2] = (Math.random() - 0.5) * 0.01 + moveDir[2] * 0.2;
		}
	}

	Render() {
		// The player isn't actually rendered; their position controls the camera
	}
}


class Bullet extends GameObject
{
	constructor()
	{

		super();
		this.name = "bullet";
		this.collisionRadius = 0.2;
		this.lifetime = 180;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		this.vertices = [
			0.02, 0.0, 0.05, 0, 1, 1,
			0.0, 0.01, 0.05, 0, 1, 1,
			0.0, 0.0, 0.1, 1, 1, 1,
			-.02, 0.0, 0.05, 0, 1, 1,
			0.0, -.01, 0.05, 0, 1, 1,
			0.0, 0.0, -.1, 0, 0, 1,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.indexOrder = [
			0, 1, 2,
			0, 2, 4,
			0, 4, 5,
			0, 5, 1,

			3, 1, 2,
			3, 2, 4,
			3, 4, 5,
			3, 5, 1,
		];

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);
	}

	Update()
	{
		this.Move();

		// Bullets that have existed for too long die to avoid hogging resources
		this.lifetime--;
		if (this.lifetime <= 0) {
			m.DestroyObject(this.id);
		}
	}


	OnTriggerEnter(other) {
		if (other.name == "asteroid") {
			m.DestroyObject(this.id);
			other.hp--;
			if (other.hp <= 0) {
				m.IncrementScore();
				m.DestroyObject(other.id);
			}
		}
	}
}

class Asteroid extends GameObject
{
	constructor()
	{

		super();
		this.name = "asteroid";
		this.collisionRadius = 0.1;
		this.hp = 3;

		this.buffer=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		this.vertices = [
			0.1, 0.0, 0.0, 1, 0, 0,
			0.0, 0.1, 0.0, 0, 1, 0,
			0.0, 0.0, 0.1, 0, 0, 1,
			-.1, 0.0, 0.0, 0, 1, 1,
			0.0, -.1, 0.0, 1, 0, 1,
			0.0, 0.0, -.1, 1, 1, 0,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.indexOrder = [
			0, 1, 2,
			0, 2, 4,
			0, 4, 5,
			0, 5, 1,

			3, 1, 2,
			3, 2, 4,
			3, 4, 5,
			3, 5, 1,
		];

		this.ibuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexOrder), gl.STATIC_DRAW);
	}

	Update()
	{
		this.Move();
	}
}
