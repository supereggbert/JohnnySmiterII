
/*
   Some Useful Helper Functions
*/

// Normalizes a 3 component array
var normalize=function(a){
	l=Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
	if(l==0) return a;
	a[0]/=l;a[1]/=l;a[2]/=l;
	return a;
};

// Generates a camera matrix given two angles and a position
var genCameraMatrix=function(angle,angle2,pos) {
	var cos1 = Math.cos(angle),
		sin1 = Math.sin(angle),
		cos2 = Math.cos(angle2),
		sin2 = Math.sin(angle2);
	
	return new Float32Array([cos2, - sin2*cos1, sin2*sin1,pos[0],
			sin2,cos1*cos2,-sin1*cos2,pos[1],
			0,sin1,cos1,pos[2],
			0,0,0,1]);
};

// Simplified function to inverse and transpose matrix for gl
var inverseTransposeMat4=function(mat){
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	
	var d =  - a20*a11*a02 + a10*a21*a02 +
			a20*a01*a12 - a00*a21*a12 - a10*a01*a22 + a00*a11*a22;

	return new Float32Array([( - a21*a12 + a11*a22)/d, ( a20*a12 - a10*a22)/d, ( - a20*a11 + a10*a21)/d, 0,
	( a21*a02 - a01*a22)/d, ( - a20*a02 + a00*a22)/d,  ( a20*a01 - a00*a21)/d, 0,
	( - a11*a02 + a01*a12)/d,  ( a10*a02 - a00*a12)/d, ( - a10*a01 + a00*a11)/d, 0,
	(a21*a12*a03 - a11*a22*a03 - a21*a02*a13 + a01*a22*a13 + a11*a02*a23 - a01*a12*a23)/d,(a10*a22*a03 - a20*a12*a03 + a20*a02*a13 - a00*a22*a13 - a10*a02*a23 + a00*a12*a23)/d,(a20*a11*a03 - a10*a21*a03 - a20*a01*a13 + a00*a21*a13 + a10*a01*a23 - a00*a11*a23)/d,1]);
};


/*
  Main webGL rendering classes
*/

/**
 * @constructor
 */
var GLCamera=function(){
	this.position=[-28,11,1];
	this.rotation=[-1.57,1.57];
	this.vel=[0,0,0];
	this.updateMatrix();
};
GLCamera.prototype.updateMatrix=function(){
	var r=this.rotation;
	this.matrix=genCameraMatrix(-r[0],-r[1],this.position);
	this.invMatrix=inverseTransposeMat4(this.matrix);
};
GLCamera.prototype.rotateV=function(rot){
	this.rotation[0]+=rot;
	this.updateMatrix();
};
GLCamera.prototype.rotateH=function(rot){
	this.rotation[1]+=rot;
	this.updateMatrix();
};
GLCamera.prototype.addVel=function(vel){
	this.vel[0]+=vel[0];
	this.vel[1]+=vel[1];
	this.vel[2]+=vel[2];
};
GLCamera.prototype.tick=function(deltaTime){
	this.position[0]+=this.vel[0]*deltaTime;
	this.position[1]+=this.vel[1]*deltaTime;
	this.position[2]+=this.vel[2]*deltaTime;
	this.vel[0]*=0.6;
	this.vel[1]*=0.6;
	if(this.vel[2]>0) this.vel[2]*=0.8;
		else  this.vel[2]*=0.9;
	this.updateMatrix();
};

/**
 * @constructor
 */
var GLProgram=function(gl,vShader,fShader){
	this.gl=gl;
	
	var program = gl.createProgram();
 
	var vs = this.createShader( gl, vShader, gl.VERTEX_SHADER );
	var fs = this.createShader(gl, fShader, gl.FRAGMENT_SHADER );
 
	gl.attachShader( program, vs );
	gl.attachShader( program, fs );
 
	gl.linkProgram( program );
	
	/*if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
		console.log( "ERROR:\n" +
					"VALIDATE_STATUS: " + gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + "\n" +
					"ERROR: " + gl.getError() + "\n\n" +""
					);
		return null;
	}*/
	
	this.uniforms=[];
	this.uniformNames={};
	var uniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

	for (var i=0;i<uniforms;i++) {
		var info=gl.getActiveUniform(program, i);
		info.location=gl.getUniformLocation(program, info.name);
		this.uniforms.push(info);
		this.uniformNames[info.name]=info;
	}
	this.attributes=[];
	var attributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	var offset=0;
	for (var i=0;i<attributes;i++) {
		var info=gl.getActiveAttrib(program, i);
		info.location=gl.getAttribLocation(program, info.name);
		info.offset=offset;
		info.num= info.type==gl.FLOAT_VEC3 ? 3 : info.type==gl.FLOAT_VEC4 ? 4 : 2 ;
		offset+= info.num;
		this.attributes.push(info);
		gl.enableVertexAttribArray(info.location);
	}
	this.totalStride=offset*4;
	this.totalOffset=offset;
	this.uniformCache={};
	
	this.program=program;
};

/**
 * @constructor
 */
GLProgram.prototype.createShader=function(gl, src, type) {
	var shader = gl.createShader( type );
	console.log(src);
	gl.shaderSource( shader, src );
	gl.compileShader( shader );
  	/*if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
		console.log( ( type == gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT" ) + " SHADER:\n" + gl.getShaderInfoLog( shader ) );
		return null;
	}*/
	return shader;
};
GLProgram.prototype.setUniform=function(name,value) {
	if(!this.uniformNames[name]) return;
	var v=value;
	if(v.length) v=value.unique;
	if(this.uniformCache[name]!=v || isNaN(v)){
		loc=this.uniformNames[name].location;
		if(this.uniformNames[name].type==gl.FLOAT_MAT4){
			gl.uniformMatrix4fv(loc,false,value);
		}else if(this.uniformNames[name].type==gl.SAMPLER_2D){
			gl.uniform1i(loc,value);
		}else if(this.uniformNames[name].type==gl.FLOAT){
			gl.uniform1f(loc,value);
		}else if(this.uniformNames[name].type==gl.FLOAT_VEC3){
			gl.uniform3fv(loc,value);
		}
		this.uniformCache[name]=v;
	}
};

/**
 * @constructor
 */
var GLBuffer=function(gl, data,type){
	this.data=data;
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl[type], buffer);

	gl.bufferData(gl[type], data, gl.STATIC_DRAW);
	this.buffer=buffer;
};
GLBuffer.prototype.offsets={
	aVertexPosition: 0,
	aVertexNormal: 12
};

/**
 * @constructor
 */
var GLRenderer=function(gl){
	this.gl=gl;
	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.DEPTH_TEST);
	this.clear();
};
GLRenderer.prototype.useProgram=function(program){
	var gl=this.gl;
	if(program!=gl.program){
		gl.program=program;
		this.program=program;
		gl.useProgram(program.program);
	}
};
GLRenderer.prototype.useBuffer=function(buffer){
	if(this.buffer!=buffer){
		var gl=this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
		if(this.program){
			var attributes=this.program.attributes;
			var len=attributes.length;
			for(var i=0;i<len;i++){
				gl.vertexAttribPointer(attributes[i].location, attributes[i].num, gl.FLOAT, false, this.program.totalStride, buffer.offsets[attributes[i].name]);
			}
		}
	}
};
GLRenderer.prototype.useElements=function(buffer){
	if(buffer!=this.elementsBuffer){
		var gl=this.gl;
		this.elementsBuffer=buffer;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.buffer);
	}
};
GLRenderer.prototype.drawElements=function(){
	var gl=this.gl;
	gl.drawElements(gl.TRIANGLES, this.elementsBuffer.data.length, gl.UNSIGNED_SHORT, 0);
};
GLRenderer.prototype.setUniform=function(name,value){
	var gl=this.gl;
	var program=this.program;
	program.setUniform(name,value);
};
GLRenderer.prototype.clear=function(){
	var gl=this.gl;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};
GLRenderer.prototype.addTexture=function(idx,image){
	var gl=this.gl;
	var texture=gl.createTexture();
	gl.activeTexture(gl["TEXTURE"+idx]);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.generateMipmap(gl.TEXTURE_2D);
};