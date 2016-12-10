// number to 8 byte array conversion
function toByteArray(/*long*/long, len = 8) {
    // we want to represent the input as a 8-bytes array
    var byteArray = [];

    for ( var index = 0; index < len; index ++ ) {
        var byte = long & 0xff;
        byteArray.unshift(byte);
        long = (long - byte) / 256 ;
    }

    return byteArray;
};

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

// 64-bit length
String.prototype.bitlen = function(){
	return String.fromCharCode.apply(null, toByteArray(this.length * 8));
}

String.prototype.normalize = function(){
	return this + this.pad() + this.bitlen();
}

// we will store all data for hashing here
var scope = {
};

// display options
var display = {
	init: { // which h and k to show on step 2
		h: 0,
		k: 0
	}
};

// appending 100000...<64bit-integer-len> to the message
function prepare_message(msg){
	return msg;
}

primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61,
67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137,
139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211,
223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283,
293, 307, 311];

function render(){

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
	display.init.h = (display.init.h + 8) % 8;
	var h = display.init.h;
	$("#h .num").html(h);
	$("#h .prime").html(primes[h]);
	var v = primes[h]**(1/2);
	$("#h .dec").html(v.toString().substr(0,12));
	v = v - Math.floor(v);
	$("#h .frac").html(v.toString().substr(0,12));
	$("#h .hex").html(v.toString(16).substr(0,12));
	var finalh = parseInt("0x"+v.toString(16).substr(2,8));
	var strh = String.fromCharCode.apply(null,toByteArray(finalh, 4)).toByteString();
	$("#h .final").html(strh);

	display.init.k = (display.init.k + 64) % 64;
	var k = display.init.k;
	$("#k .num").html(k);
	$("#k .prime").html(primes[k]);
	var v = primes[k]**(1/3);
	$("#k .dec").html(v.toString().substr(0,12));
	v = v - Math.floor(v);
	$("#k .frac").html(v.toString().substr(0,12));
	$("#k .hex").html(v.toString(16).substr(0,12));
	var finalk = parseInt("0x"+v.toString(16).substr(2,8));
	var strk = String.fromCharCode.apply(null,toByteArray(finalk, 4)).toByteString();
	$("#k .final").html(strk);
}

function recalc(){
	render();
}

$(document).ready(function(){
	scope.message = $('#message').val();

	$("#message").change(function(){
		scope.message = $('#message').val();
		recalc();
	});

	$("#message").keyup(function(){
		scope.message = $('#message').val();
		recalc();
	});

	$("#nexth").click(function(e){
		e.preventDefault();
		display.init.h--;
		render();
	});
	$("#prevh").click(function(e){
		e.preventDefault();
		display.init.h++;
		render();
	});

	$("#nextk").click(function(e){
		e.preventDefault();
		display.init.k--;
		render();
	});
	$("#prevk").click(function(e){
		e.preventDefault();
		display.init.k++;
		render();
	});

	recalc(message);

	// $("#message").focus();
	$("#message").select();
});