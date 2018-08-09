# SCTE35-Parser

This is a helper file to parse the SCTE-35 data in the form of a hex string (usually extracted from the mpeg stream from the encoder / packager), or in the form of base64 encoded string (in HLS manifests) 

## Sample usage: 
```
var parser = new SCTE35Parser()
var testString = 'fc302000000000000000fff00f05000000007fcfffa7f7abd400680001000088f3ebaf';
var spliceInfo = parser.parseFromHex(testString);
console.log(JSON.stringify(spliceInfo));


// Sample output
{
  "table_id": 252,
  "section_syntax_indicator": 0,
  "private_indicator": 0,
  "section_length": 32,
  "protocol_version": 0,
  "encrypted_packet": 0,
  "encryption_algorithm": 0,
  "pts_adjustment": 0,
  "cw_index": 0,
  "tier": 4095,
  "splice_command_length": 15,
  "splice_command_type": 5,
  "splice_command_type_text": "splice_insert",
  "splice_event": {
    "splice_event_id": 0,
    "splice_event_cancel_indicator": 0,
    "out_of_network_indicator": 1,
    "program_splice_flag": 1,
    "duration_flag": 0,
    "splice_immediate_flag": 0,
    "time_specified_flag": 1,
    "pts_time": 7112993748,
    "unique_program_id": 104,
    "avail_num": 0,
    "avails_expected": 1
  },
  "descriptor_loop_length": 0,
  "descriptors": []
}
```
