
// Simple PRNG
function rnd(i){
	return (Math.sin(Math.sin(1e9*i)*1e6)+1)*0.5;
};

// Dimple function to create a canvas, set height and width and init a 2d context
function mc(s){var c=document.createElement('canvas');c.width=c.height=s;return [c,c.getContext('2d')];}

var cSize=512; //default canvas size

// Dimond squared - clouds texture
function cloud(t){
	var data=[[.5,.5],[.5,.5]];
	var c=mc(cSize);
	var d=c[1].createImageData(cSize,cSize);
	var height=1.5;
	for(var i=0;i<9;i++){
		var output=[];
		height/=2;
		var s=data.length*2-1;
		for(var x=0;x<s;x++){
			var a=[];
			output.push(a);
			for(var y=0;y<s;y++){
				var x1=(x/2)|0,y1=(y/2)|0,x2=(x/2+.5)|0,y2=(y/2+.5)|0;
				var val=data[x1][y1]+data[x1][y2]+data[x2][y1]+data[x2][y2];
				a.push(val*0.25+(rnd((x%(s-1)+1)*(y%(s-1)+1)*t)-0.5)*height);
				if(i==8){
					var j=(y*cSize+x)*4;
					d.data[j]=d.data[j+1]=d.data[j+2]=output[x][y]*255;
					d.data[j+3]=255;
				}
			}
		}
		data=output;
	}
	c[1].putImageData(d,0,0);
	return c;
};

// Creates a noise texture
function noise(){
	var c=mc(cSize);
	var d=c[1].createImageData(cSize,cSize);
	var l=cSize*cSize*4;
	for(var i=0;i<l;i+=4){
		d.data[i]=d.data[i+1]=d.data[i+2]=rnd(i)*255;
		d.data[i+3]=255;
	}
	c[1].putImageData(d,0,0);
	return c;
}

//Creates brick and tile textures
function brick(offset,cnt,b1){
	var c=mc(cSize);
	var x=c[1];
	x.fillStyle="#888";
	x.fillRect(0,0,cSize,cSize);
	x.lineWidth=0.5;
	var cnt2=cSize/cnt;
	var b2=cSize/b1;
	function draw(col,a){
		x.beginPath();
		x.strokeStyle=col;
		for(var i=0;i<cnt;i++){
			for(var j=0;j<cnt;j++){
				x.moveTo(j*cnt2+a,i*cnt2+a+rnd(i*j)*1.5)
				x.lineTo((j+1)*cnt2+a,i*cnt2+a+rnd(i*(j+1))*1.5);
			}
			for(var j=0;j<b1;j++){
				var o=(j*b2*2+(i%2==0?0:offset))%cSize;
				x.moveTo(o+a,i*cnt2+a);
				x.lineTo(o+a,(i+1)*cnt2+a);
			}
		}
		x.stroke();
	}
	draw('#fff',-1);
	draw('#000',1);
	return c;
}

// Merge multiple textures into different channels so we can include multiple textures in on texture unit
function merge(a,b,e){
	var c=mc(cSize);
	var d=c[1].createImageData(cSize,cSize);
	var d1=a[1].getImageData(0,0,cSize,cSize);
	var d2=b[1].getImageData(0,0,cSize,cSize);
	var d3=e[1].getImageData(0,0,cSize,cSize);
	var l=cSize*cSize*4;
	for(var i=0;i<l;i+=4){
		d.data[i]=d1.data[i];
		d.data[i+1]=d2.data[i];
		d.data[i+2]=d3.data[i];
		d.data[i+3]=255;
	}
	c[1].putImageData(d,0,0);
	return c;
};

// Function to optimise the generation of shader code for the different textures
var shaderMats=function(){
	var coord=function(x,y){return 'coord*vec2('+x.toFixed(5)+','+y.toFixed(5)+')'}; // Set cords
	var texture=function(t,c,v){return 'texture2D(texture'+t+','+c+').'+v+v+v}; // Get texture sample
	var colorize=function(t,r,g,b){return t+'*vec3('+r.toFixed(5)+','+g.toFixed(5)+','+b.toFixed(5)+')'}; // Set color
	var mix=function(a,b,c){return 'mix('+a+','+b+','+c+')'}; // Mix two textures
	var range=function(a,b,c){return 'clamp(('+a+'-'+b.toFixed(5)+')/('+c.toFixed(5)+'-'+b.toFixed(5)+'),0.,1.)' }; // Mix two textures
	var mul=function(a,b){return a+'*'+b}; // Multiply two units
	var bound=function(a,b,c){return a+'?'+b+':'+c}; // Different textures at different positions
	var condition=function(d,mat){return 'if(vNormal.'+d+'.707) tex='+mat+';'}; // side pick
	
	// Creates a material by setting different directions with different texturing
	var material=function(left,right,front,back,top,bottom){
		return [condition('x<-',left),condition('x>=',right),condition('y<-',front),condition('y>=',back),condition('z<-',top),condition('z>=',bottom)].join('else ');
	};
	
	// Combines all the materials
	var mats=function(mats){
		return mats.map(function(a,i){return 'if(mat=='+i+'.0) '+a+''}).join('  '); 
	};
	
	// Adds a 3d moss texture to a texture
	var domoss=function(tex){
		var dirt=mul(mul(texture(2,'vCoord.xy*.1','b'),texture(2,'vCoord.zx*.1','b')),texture(2,'vCoord.yz*.1','b'));
		var noise2=colorize(texture(1,coord(4,4),'g'),.1,.1,0);
		var mixer=range(dirt,0.03,1.);
		return mix(tex,noise2,'clamp('+mul(mixer,'3.')+',0.,.95)');
	};
	
	var c1=coord(1,1);
	var noise=texture(1,coord(1,1),'g');
	var floor=domoss( mul(texture(1,coord(.3,.3),'g'),texture(2,coord(.3,.3),'r')) );
	var wood=domoss(  colorize(texture(1,coord(.5,.05),'g'),.3,.2,.1)  );
	var wood2=domoss(  colorize(texture(1,coord(.05,.5),'g'),.3,.2,.1)  );
	var black='tex=vec3(.02);';
	
	var water=colorize(mix(texture(2,'coord*.5+time*.0001','b'),texture(2,'coord*.4+time*.0002','b'),'.8'),.0,.08,.1);
	var portal=mix(texture(2,'coord*.5+time*.0001','b'),texture(2,'coord*.4+time*.0002','b'),'.5');
	var pannelwood=mul(wood2,mul(texture(1,coord(0.01,0.2),'r'),'2.'));
	
	var rooftile=domoss( colorize( mul(noise,texture(1,coord(0.25,0.27),'r')) ,.8,.2,.1) );
	
	var concreat=domoss(mul(mix(colorize(mix(texture(2,coord(.3,.3),'b'),texture(1,coord(.5,.5),'b'),'.2'),.9,.8,.7),noise,'.4'),texture(1,coord(.4,.4),'r')));
	
	return mats([
		material(concreat,concreat,concreat,concreat,floor,floor),
		material(wood,wood,wood,wood,wood,wood),
		material(pannelwood,pannelwood,pannelwood,pannelwood,pannelwood,pannelwood),
		black,
		material(rooftile,rooftile,rooftile,rooftile,rooftile,rooftile),
		'tex='+water+';',
		material(portal,portal,portal,portal,portal,portal),
		material(pannelwood,pannelwood,pannelwood,pannelwood,pannelwood,pannelwood)
	]);
};

