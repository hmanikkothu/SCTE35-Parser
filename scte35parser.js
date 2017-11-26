/***

The MIT License (MIT)

Copyright (c) 2017 Hari Manikkothu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Reference: 
  1. SCTE-35 spec: http://www.scte.org/SCTEDocs/Standards/SCTE%2035%202016.pdf

**/
function SCTE35Parser() {
	
	this.init = function() {
		this.scte35_bitarray = new Array();
		this.spliceInfo = {};		
	}
	
	this.parseFromBase64 = function(data) {
		this.init();
		// Todo: Parse Base64 to hex string/dec array
	}
	
	this.parseFromHex = function(data) {
		this.init();
		if (!data || data.length < 0) {
			return 'no data';
		}
		for (var i = 0; i < data.length; i+=2) {
			var d = parseInt('0x' + data[i] + data[i+1]);
			this.writeToBitArray(parseInt(data[i] + data[i+1], 16));
		}
		this.parse();
		return this.spliceInfo;
	}
	
	this.parse = function() {
		var table_id = this.read(8);
		if (table_id == 0xfc) { // table_id – This is an 8-bit field. Its value shall be 0xFC for SpliceInfo. 
			var spliceInfo = this.spliceInfo;
			spliceInfo.table_id = table_id;
			spliceInfo.section_syntax_indicator = this.read(1);
			spliceInfo.private_indicator = this.read(1);
			//reserved 2 bits
			this.read(2); 
			spliceInfo.section_length = this.read(12);
			spliceInfo.protocol_version = this.read(8);
			spliceInfo.encrypted_packet = this.read(1);
			spliceInfo.encryption_algorithm = this.read(6);
			spliceInfo.pts_adjustment = this.read(33);
			spliceInfo.cw_index = this.read(8);
			spliceInfo.tier = this.read(12);
			spliceInfo.splice_command_length = this.read(12);
			
			spliceInfo.splice_command_type = this.read(8);

			if (spliceInfo.splice_command_type == 0x00) {
				this.parse_splice_null();
			} else if (spliceInfo.splice_command_type == 0x04) {
				this.parse_splice_schedule();
			} else if (spliceInfo.splice_command_type == 0x05) {
				spliceInfo.splice_command_type_text = 'splice_insert';
				this.parse_splice_insert();
			} else if (spliceInfo.splice_command_type == 0x06) {
				spliceInfo.splice_command_type_text = 'time_signal';				
				this.parse_time_signal();
			} else if (spliceInfo.splice_command_type == 0x07) {
				this.bandwidth_reservation();
			} else if (spliceInfo.splice_command_type == 0x06) {
				this.parse_private_command();
			}
			
			spliceInfo.descriptor_loop_length = this.read(16);
			spliceInfo.descriptors = [];
			for(var i = 0; i < spliceInfo.descriptor_loop_length; i++) {
				var descriptor = {};
				descriptor.splice_descriptor_tag = this.read(8);
				descriptor.descriptor_length = this.read(8);
				descriptor.identifier = this.read(32);
				for(var j=0; j < descriptor.descriptor_length; j++) {
					// private - 8 bits
					this.read(8);
				}
				spliceInfo.descriptors.push(descriptor);
			}
			
			/* //Not supported yet 
			for(i=0; i<N2; i++)
				alignment_stuffing 8 bit
			if(encrypted_packet)
				E_CRC_32 32 rpchof 
			CRC_32 32 rpchof 
			*/
			
		}
	}
	
	this.parse_splice_null = function() {
		throw 'command_type splice_null not supported yet';
	}
	
	this.parse_splice_schedule = function() {
		throw 'command_type splice_schedule not supported yet';
	}
	
	this.parse_splice_insert = function() {
		var splice_event = {};
		this.spliceInfo.splice_event = splice_event;
		splice_event.splice_event_id = this.read(32);
		splice_event.splice_event_cancel_indicator = this.read(1);
		//reserved 7 bits
		this.read(7);
		if (splice_event.splice_event_cancel_indicator == 0) {
			splice_event.out_of_network_indicator = this.read(1);
			splice_event.program_splice_flag = this.read(1);
			splice_event.duration_flag = this.read(1);
			splice_event.splice_immediate_flag = this.read(1);
			//reserved 4 bits
			this.read(4);
			if((splice_event.program_splice_flag == 1) && (splice_event.splice_immediate_flag == 0)) {
				this.parse_splice_time(this.spliceInfo.splice_event); 			
			}
			
			if(splice_event.duration_flag == 1) {
				this.parse_break_duration();
			}
			splice_event.unique_program_id = this.read(16);
			splice_event.avail_num = this.read(8);
			splice_event.avails_expected = this.read(8);
		}
	}

	this.parse_time_signal = function() {
		throw 'command_type time_signal not supported yet';
	}
	
	this.parse_bandwidth_reservation = function() {
		throw 'command_type bandwidth_reservation not supported yet';
	}
	
	this.parse_private_command = function() {
		throw 'command_type private_command not supported yet';
	}
	
	this.parse_splice_time = function (spliceEvent) {
		spliceEvent.time_specified_flag = this.read(1);
		 if(spliceEvent.time_specified_flag == 1) {
			 //reserved 6 bits
			 this.read(6);
			 spliceEvent.pts_time = this.read(33);
		 } else {
			 //reserved 7 bits
			 this.read(7);
		 } 		
	}
	
	this.parse_break_duration = function() {
		var break_duration = {};
		this.spliceInfo.splice_event.break_duration = break_duration;
		break_duration.auto_return = this.read(1);
		break_duration.reserved = this.read(6);
		break_duration.duration = this.read(33);
	}
	
	this.writeToBitArray = function(val) {
		var r = 128;
		for (var i=0; i<8; i++){
			var bVal = false;
			if(r & val) {
				bVal = true;
			}
			this.scte35_bitarray[this.scte35_bitarray.length] = bVal;
			r = r >> 1;
		}
	}
	
	this.read = function(size) {
		var a = this.scte35_bitarray.splice(0, size);
		var hSigNum = 0;
		if (size > 32) {
			for(var i = 0; i < size - 32; i++){
				hSigNum = hSigNum << 1;
				var aVal = a.shift();
				if (aVal) {
					hSigNum += 1;				
				}
			}
			hSigNum = hSigNum * Math.pow(2, 32);
			size = 32;
		}
		var num = 0;
		for(var i = 0; i < size; i++){
			num = num << 1;
			var aVal = a.shift();
			if (aVal) {
				num += 1;				
			}
		}
		if (size >= 32) {
			num = num>>>0;
		}
		return hSigNum + num;
	}
	



	this.test = function() {
		//var testString = 'fc300800000000000000001000067f234567890010020043554549400000007f9c00000000';
		var testString = 'fc302000000000000000fff00f05000000007fcfffa7f7abd400680001000088f3ebaf';
		console.log('testString = ' + testString);
		var spliceInfo = this.parseFromHex(testString);
		console.log(this.scte35_array);
		console.log(JSON.stringify(spliceInfo));
				
	}
		
}
