// Adding method to the String class to get byte representation of it
String.prototype.toByteString = function(){
	var bytemsg = "";
	for (var i = 0; i < this.length; i++) {
		var bytestr = "00";
		bytestr+=this.charCodeAt(i).toString(16);
	    bytemsg += bytestr.substr(-2)+" ";
	}
	return bytemsg.trim();
}

// 10000....00 that needs to be added to the message
String.prototype.pad = function(){
	var str = this;
	/*
	Adding flag bit 1 and trailing zeroes.
	As you can't enter less than 1 byte in the input string,
	next byte will be 1000 0000 anyways (it's 0x80)
	*/
	str += String.fromCharCode(0x80);
	while((str.length) % (512/8) != (512-64)/8){
		str += String.fromCharCode(0x00);
	}
	return str.substr(this.length);
}

// 64-bit integer length
String.prototype.bitlen = function(){
	return String.fromCharCode.apply(null, (this.length * 8).toByteArray());
}

String.prototype.normalize = function(){
	return this + this.pad() + this.bitlen();
}

String.prototype.toInt = function(){
	return (parseInt("0x"+this.toByteString().replace(/ /g, ""))>>>0);
}

String.prototype.spliceEvery = function(num=2){
	res = "";
	for (var i = 0; i < this.length; i+=num) {
		res += this.substr(i,num)+" ";
	}
	return res;
}

// number to 8 byte array conversion
Number.prototype.toByteArray = function(len = 8) {
    // we want to represent the input as a 8-bytes array
    var long = this;
    var byteArray = [];

    for ( var index = 0; index < len; index ++ ) {
        var byte = long & 0xff;
        byteArray.unshift(byte);
        long = (long - byte) / 256 ;
    }

    return byteArray;
};

Number.prototype.rotateRight = function(shift = 1, len = 32){
	return (this >>> shift) | ((this << (len - shift)) % (Math.pow(2,len)));
}

Number.prototype.toBinaryString = function(len=32){
	var str = "";
	for (var i = 0; i < len; i++) {
		str+="0";
	}
	return (str+(this >>> 0).toString(2)).substr(-len);
}

Number.prototype.toByteString = function(len=4){
	var str = "";
	for (var i = 0; i < len; i++) {
		str += "00";
	}
	str += this.toString(16);
	str = str.substr(-len*2);
	res = "";
	for (var i = 0; i < str.length; i+=2) {
		res += str.substr(i,2)+" ";
	}
	return res;
}

// we will store all data for hashing here
var scope = {};

// display options
var display = {
	init: { // which h and k to show on step 2
		h: 0,
		k: 0,
	},
	word: {
		chunk: 0,
		w: 0,
	}
};

primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61,
67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137,
139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211,
223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283,
293, 307, 311];

function get_hk(i, root = 2){
	var d = {
		i: i,
		prime: primes[i],
	};
	d.root = Math.pow(d.prime, 1 / root);
	d.fraction = d.root - Math.floor(d.root);
	d.value = parseInt("0x"+d.fraction.toString(16).substr(2,8));
	d.str = String.fromCharCode.apply(null, d.value.toByteArray(4)).toByteString();
	return d;
}

var debug;

function sha256(msg){
	var d = {
		message: msg,
		h: [],
		k: [],
		chunks: [],
		hash: "nothing yet",
	}
	for (var i = 0; i < 8; i++) {
		d.h.push(get_hk(i));
	}
	for (var i = 0; i < 64; i++) {
		d.k.push(get_hk(i, 3));
	}
	var chunknum = scope.message.normalize().length/64;
	for (var i = 0; i < chunknum; i++) {
		var chunk = {
			message: scope.message.normalize().substr(64*i,64),
			words: []
		};
		for (var j = 0; j < 16; j++) {
			var word = {
				str: chunk.message.substr(4*j,4),
				s0: null,
				s1: null,
			}
			word.value = word.str.toInt();
			chunk.words.push(word);
		}
		for (var j = 16; j < 64; j++) {
			var word = {
			}
			s0 = (chunk.words[j-15].value.rotateRight(7) ^
				chunk.words[j-15].value.rotateRight(18) ^
				(chunk.words[j-15].value >>> 3))>>>0;
			word.s0 = s0;

			s1 = (chunk.words[j-2].value.rotateRight(17) ^
				chunk.words[j-2].value.rotateRight(19) ^
				(chunk.words[j-2].value >>> 10))>>>0;
			word.s1 = s1;

			word.value = ((s0 + s1 + chunk.words[j-16].value + chunk.words[j-7].value)%(Math.pow(2,32))>>>0)
			chunk.words.push(word);
		}
		d.chunks.push(chunk);
	}
	return d;
}

function w_used_in(w){
	var arr = [];
	for (var i = 0; i < 16; i++) {
		arr.push(0);
	}
	if(w < 16){
		arr[w]++;
	}else{
		var warr = [];
		warr.push(w-16, w-7, w-15, w-2);
		for (var i = 0; i < warr.length; i++) {
			if(warr[i] < 16){
				arr[warr[i]]++;
			}else{
				var morew = w_used_in(warr[i]);
				for (var j = 0; j < morew.length; j++) {
					arr[j] += morew[j];
				}
			}
		}
	}
	return arr;
}

function max(arr){
	var v = 1;
	for (var i = 0; i < arr.length; i++) {
		if(arr[i] > v){
			v = arr[i];
		}
	}
	return v;
}

function check_display(){
	// checking if we got negative indexes to display
	display.init.h = (display.init.h + 8) % 8;
	display.init.k = (display.init.k + 64) % 64;
	display.word.w = (display.word.w + 64) % 64;
	if(display.word.w >= 16){
		$(".w-calc").show();
	}else{
		$(".w-calc").hide();
	}
	var chunknum = Math.floor(scope.message.normalize().length/64);
	display.word.chunk = (display.word.chunk + 64) % chunknum;
	if(chunknum == 1){
		$(".multichunks").hide();
	}else{
		$(".multichunks").show();
	}
}

function render(){

	check_display();

	// Step 1. Preparing message
	$("*[data='len']").html(scope.message.length * 8);
	$("*[data='bytelen']").html(scope.message.length);

	$("*[data='bytemsg']").html(scope.message.toByteString());
	$("*[data='normalized']").html(
		scope.message.toByteString() + " " +
		"<span class='pad'>"+scope.message.pad().toByteString()+"</span>" + " " +
		"<span class='len'>"+scope.message.bitlen().toByteString()+"</span>"
	);

	// Step 2. Initial values for h and k
	var h = scope.h[display.init.h];
	$("#h .num").html(h.i);
	$("#h .prime").html(h.prime);
	$("#h .dec").html(h.root.toString().substr(0,12));
	$("#h .frac").html(h.fraction.toString().substr(0,12));
	$("#h .hex").html(h.fraction.toString(16).substr(0,12));
	$("#h .final").html(h.str);

	var k = scope.k[display.init.k];
	$("#k .num").html(k.i);
	$("#k .prime").html(k.prime);
	$("#k .dec").html(k.root.toString().substr(0,12));
	$("#k .frac").html(k.fraction.toString().substr(0,12));
	$("#k .hex").html(k.fraction.toString(16).substr(0,12));
	$("#k .final").html(k.str);

	// Step 3. Words and chunks
	var w = display.word.w;
	var chunk = display.word.chunk;
	var chunkmsg = scope.chunks[chunk].message;
	var chunkstr = chunkmsg.toByteString();
	$("#w .num").html(w);
	$(".chunk").html(chunk);
	if(w<16){
		$("#w-source").html("Directly from message");
		$("*[data='w-msg']").html(
			chunkstr.substr(0,w*12)+
			"<span class='final'>"+chunkstr.substr(w*12,12)+"</span>"+
			chunkstr.substr((w+1)*12)
		);
	}else{
		$("#w-source").html("Calculated from previous words. Bytes that influence the result are shown in shades of orange depending on usage frequency.");
		var w_arr = w_used_in(w);
		var maxw = max(w_arr);
		colors = ["#F5A623","#EDA530","#E6A73E","#D7A859","#CFA766","#C8A874","#C0A881","#B9A98F","#B1A99C","#AAAAAA"];
		var str = "";
		$("*[data='w-msg']").html("");
		for (var i = 0; i < chunkmsg.length; i+=4) {
			$("*[data='w-msg']").html(
				$("*[data='w-msg']").html()+
				"<span class='used' style='color: "+colors[colors.length-1-Math.floor((w_arr[i/4])/maxw*colors.length)]+"'>"+chunkmsg.substr(i,4).toByteString()+"</span> "
			);
		}
		$("*[data='wx']").each(function(i){
			var offs = +$(this).attr('data-offset');
			var repr = $(this).attr('data-repr');
			var str = scope.chunks[chunk].words[w-offs].value.toByteString();
			var rotate = +($(this).attr('data-rotate') || 0);
			var shift = +($(this).attr('data-shift') || 0);
			var v = (scope.chunks[chunk].words[w-offs].value.rotateRight(rotate) >>> shift);
			if(repr == 'note'){
				var sfx = "";
				if(rotate!=0){
					sfx = " >>> "+rotate.toString();
				}
				if(shift!=0){
					sfx = " >> "+shift.toString();
				}
				str = "w<sub>"+(w-offs).toString()+"</sub>"+sfx+" &nbsp; ("+
					v.toByteString()+")";
			}
			if(repr == 'bin'){
				str = v.toBinaryString().spliceEvery(4);
				if(rotate!=0 || shift!=0){
					var ind = (rotate || shift);
					ind += Math.floor(ind/4);
					str = "<b>"+str.substr(0,ind)+"</b>"+str.substr(ind);
				}
			}
			$(this).html(str)
		});

		$("*[data='s0']").html(
			"s<sub>0</sub> ("+
			scope.chunks[chunk].words[w].s0.toByteString()+")"
		);
		$("*[data='s0-bin']").html(
			scope.chunks[chunk].words[w].s0.toBinaryString().spliceEvery(4)
		);
		$("*[data='s1']").html(
			"s<sub>1</sub> ("+
			scope.chunks[chunk].words[w].s1.toByteString()+")"
		);
		$("*[data='s1-bin']").html(
			scope.chunks[chunk].words[w].s1.toBinaryString().spliceEvery(4)
		);
	}
	$("*[data='w']").html(
		scope.chunks[chunk].words[w].value.toByteString()
	);

}

function log(){
	console.log("fired!");
}

function recalc(){
	scope = sha256(scope.message);
	render();
}

svgelements = ["#Ain","#Bin","#Cin","#Din","#Ein","#Fin","#Gin","#Hin",
"#Aout","#Bout","#Cout","#Dout","#Eout","#Fout","#Gout","#Hout",
"#Chgate","#Majgate","#S1gate","#S0gate","#kin","#win","#tsumgate","#t1gate",
"#S1plus","#S0plus","#Majplus","#Dplus","#hchplus","#wkplus"]

$(document).ready(function(){
	scope.message = $('#message').val();
	$("#message").select();

	$("#message").change(function(){
		scope.message = $('#message').val();
		recalc();
	});

	$("#message").keyup(function(){
		scope.message = $('#message').val();
		recalc();
	});

	$("#nexth").click(function(e){
		// e.preventDefault();
		display.init.h--;
		render();
	});
	$("#prevh").click(function(e){
		// e.preventDefault();
		display.init.h++;
		render();
	});

	$("#nextk").click(function(e){
		// e.preventDefault();
		display.init.k--;
		render();
	});
	$("#prevk").click(function(e){
		// e.preventDefault();
		display.init.k++;
		render();
	});

	$(".nextchunk").click(function(e){
		// e.preventDefault();
		display.word.chunk--;
		render();
	});
	$(".prevchunk").click(function(e){
		// e.preventDefault();
		display.word.chunk++;
		render();
	});

	$("#nextw").click(function(e){
		// e.preventDefault();
		display.word.w--;
		render();
	});
	$("#prevw").click(function(e){
		// e.preventDefault();
		display.word.w++;
		render();
	});

	$("#show-s").click(function(){
		$("#scalc").toggle();
		if($("#scalc").is(':visible')){
			$(this).html("Hide how to calculate s<sub>0</sub> and s<sub>1</sub>");
		}else{
			$(this).html("Show how to calculate s<sub>0</sub> and s<sub>1</sub>");
		}
	});

    $('#svgholder').load('sha256.svg', null, function(){
    	$("#Ain").addClass("focus");
    	for (var i = 0; i < svgelements.length; i++) {
    		$(svgelements[i]).click(function(){
    			for (var i = 0; i < svgelements.length; i++) {
    				$(svgelements[i]).removeClass("focus");
    			}
    			$(this).addClass("focus");
    		});
    	}
    });

	recalc(message);
});