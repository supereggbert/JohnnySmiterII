
// The music data
// created from midi file thanks to excelent resourse at:
// http://www.colxi.info/portfolio/jsmidiparser-midi-binary-file-to-javascript-object-library/
var data='>bEbAb>b=b>Z@ZAfCVAV@VE>Z@ZJAZCZHEZ9V;VE<V9VAZDV;V@ZEVAVG@V>VH@ZBZCVJVHVFVE2V>VJAZ@9ZIZJ>5VEVHV@VA2VEVFV>VC1V@VEVCVA2V@V>4V=V>5VHVCVGVHV7V<5V4VA92V>VHV@VA>VEVGV8V@<ZE-VD/VE90V-V>5V<VG>8VA/V@4V>VH<9V5VJ;4V2VC<4VF7VE6V9V7VF>VE<VC:V92V@VAV>VFV5V70V.V<0VCVE2V0VJ6V9V;7V6V@8VGVH9V8VM9V=V>:V9VC;VJVL<V;VE=V@VJA>V8V@9VGVHVEVA>V5VF7V@VE=V4V>5V9V>;V2VC4V=V>>2V@VA9VJV@EV/V1ZA2V>VEV0V>:.ZCZE=-V4V9V+V>)V:+V@9)V7(VA9&V)V;(V&V<-VCVAV@)V>.V9VC:V)V92V@VA>V5V@9V;VE<V-V;(VBVC@ZEBV9V>VJVLD4V>V<V;VHE<9V>V@V9VE<5V@V9>V<VD>;V5VA4V2VE@<0V2VG>80V/VH<9-V7VE6V4V62VJVH>7VFVE@1V7VE5V4V5-VC4VEA2V@0V>2*VHVFVEVF+VEVC-VBVC.V>V@VFV@V@0V<.VB-VC+V9V:V@V=9V(V)VEV>.V5V7VAV@<V+V-VHVA2V9V;VEVC@V/V0VLVE5V=V>VHVGCV2V4VOVI4-VEVFV7VJE95V4VL2V1V52VIVJV)V2.VAVCVLVME1-VLVOVFVE2VMVLC4VJVI5VEVJAV>.VE-VG7+VH5-VC4VB2.V>VFCV+VE2V@VA9V5V:V>VC4V7V<V@VE5V9V>VAVF7V2V<4VCVE5V1V:2VAVC4V/V91V-VA2V>VE4V0V9/V-VJ/V8V6V8VL9-VIVGVI7VQJ5VE4VL2V1VM2VEVJ5V2VJ:VAVF7V4VI9V@VEVAVJ;VCVLA=V@VM>>VEVJ;VG7VC<VO@VMH9VL5VJ:V>VFCVLVIEV@VJAVMVFCVAV@VA>V@=VFVEVCVA>V<V>:V=9VF>7V9VC:V<VE>2V9V>VAV@9V;VL=V@VE5VI@VJ9VL=VM>2VJVOC:VF7VE41VLVQVOVM52VLCVJA74VI@VJ>95VHVFVEVC;V7V@=5V4V9>2V@VAV>VEV3V?62V0V>7.VB9VC:VFVHV0VB<.V-VC>+VEBVFCVJVKV7VJF+V5VI4-VEVQMVJVGVJVOLVIVEVIVMJ5VE2VF7VJVLVC1VE5VIVJVA2V@9VGVH-VCVB2.V>VFC>V+VE2V@VA9VE5VJ:VMJ.VLH0VOVM5VL8VJ9VHVF>VME2VD4VLVME9VJ;VL<V@VAAVJ5VH@7VGVH<V>V?VQHVOE>VN9VOE:VRVI@ZjJEA9ZjJGA8bE9Z@V>V@VGVI-VCVJB92VCVEVHVF>VCVHVEV>:VBVCVFV?7VCVEVHV>6VFVH9VKV:7VJVN<9VQV>:VOTQTR7VIVJVF>VE<VC:V9VBV@VCVBT';
		
// Creates a sound and sents volume for a byte array
var makeSound=function(sounds,vol){
	sounds=btoa(sounds);
	sounds=new Audio('data:audio/wav;base64,UklGRgWsAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YeGrAACA'+sounds);
	sounds.volume=vol;
	return sounds;
};

//Simple function to play a sound
var playSound=function(sound){
	sound.readyState!=0?sound.currentTime = 0:0;
	sound.play();
};

// Generate sound for all of the notes will be playing
var generateNotes=function(){
	var sounds=[];
	var i=55*.66;
	for(y=100;y--;){
		sounds[y]=''
		for(x=0;x<44e3;x++){
			var freq=x*i/22050*Math.PI;
			var wave=Math.sin(freq+Math.sin(4*freq)*Math.PI*0.25)*(y/100)+Math.pow(Math.sin(freq*2),10)*(1-y/100)*.5+Math.pow(Math.sin(freq*3),2)*(1-y/100)*.5;
			wave=Math.min(1,Math.max(-1,wave*((y/100)+1.5)));
			var trail=Math.exp(-x/44e3*(y/100*1.5+1));
			sounds[y]+=String.fromCharCode(wave*trail*128+128);
		}
		i*=1.059;
		sounds[y]=makeSound(sounds[y],.05);
	}
	return sounds;
};
		
var pnotes=generateNotes();
		
var idx=0;
		
// Parse the music data and play the notes
var playMusic=function(){
	idx=idx%data.length;
	var val;
	while((val=data.charCodeAt(idx++))<82){
		playSound(pnotes[99-(val-32)]);
	}
	setTimeout(playMusic,(val-82)*40)
};
playMusic();

// Create the element pick up sound
var pickupsound=function(){
	var sounds='',i=900;
	for(x=0;x<44e3;x++,i*=0.9995)
		sounds+=String.fromCharCode(Math.max(-1,Math.min(1,Math.pow(Math.cos(x*i/22050*Math.PI+Math.cos(x*.01)),5)/Math.pow(x/9000,1.5)*3))*127+128);
	return sounds;
}
var pickup=makeSound(pickupsound(),0.3);
		
		