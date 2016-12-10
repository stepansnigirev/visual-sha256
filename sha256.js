// number to 8 byte array conversion
function longToByteArray(/*long*/long) {
    // we want to represent the input as a 8-bytes array
    var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];

    for ( var index = 0; index < byteArray.length; index ++ ) {
        var byte = long & 0xff;
        byteArray [ 7-index ] = byte;
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
	return String.fromCharCode.apply(null, longToByteArray(this.length * 8));
}

String.prototype.normalize = function(){
	return this + this.pad() + this.bitlen();
}

// we will store all data for hashing here
var scope = {};

// appending 100000...<64bit-integer-len> to the message
function prepare_message(msg){
	return msg;
}

function display(){
	$("*[data='len']").html(scope.message.length * 8);
	$("*[data='bytelen']").html(scope.message.length);

	$("*[data='bytemsg']").html(scope.message.toByteString());
	$("*[data='normalized']").html(
		scope.message.toByteString() + " " +
		"<span class='pad'>"+scope.message.pad().toByteString()+"</span>" + " " +
		"<span class='len'>"+scope.message.bitlen().toByteString()+"</span>"
	);
}

function recalc(){
	display();
}

$(document).ready(function(){
	console.log("Ready to hash");
	scope.message = $('#message').val();

	$("#message").change(function(){
		scope.message = $('#message').val();
		recalc();
	});

	$("#message").keyup(function(){
		scope.message = $('#message').val();
		recalc();
	});

	recalc(message);
});