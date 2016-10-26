var OZW = require('openzwave-shared');
var log = reqiore('log.js');


exports = {
	var nodes = [];
	var init = ()=>{
		var zwave = new OZW({
			Logging: false,     // disable file logging (OZWLog.txt)
			ConsoleOutput: true  // enable console logging
		});
		zwave.connect('/dev/ttyUSB0');
	};
	zwave.on('connected', function(homeid) {
		log.debug('zwave connected to homeid: '+ homeid);
	});
	zwave.on('driver ready', function(homeid) {
		log.debug('Driver ready');
	});
	zwave.on('notification', function(nodeid, notif, help) {
		log.info('node%d: notification(%d): %s', nodeid, notif, help);
	});
	zwave.on('driver failed', function() {
		log.error('failed to start zwave driver');
		zwave.disconnect();
	});
	zwave.on('node added', function(nodeid) {
		console.log('=================== NODE ADDED:'+nodeid+'! ====================');
		nodes[nodeid] = {
			manufacturer: '',
			manufacturerid: '',
			product: '',
			producttype: '',
			productid: '',
			type: '',
			name: '',
			loc: '',
			classes: {},
			ready: false,
		};
	};
	zwave.on('value added', function(nodeid, comclass, value) {
		console.log('value added nodeid: ' + nodeid);
		if (!nodes[nodeid]['classes'][comclass])
			nodes[nodeid]['classes'][comclass] = {};
		nodes[nodeid]['classes'][comclass][value.index] = value;
	});
	zwave.on('value changed', function(nodeid, comclass, value) {
		//console.log(new Date() + 'nodeid: ' + nodeid + ' comclass: ' + comclass + ' to: ' + value);
		if(nodeid==8)
			return;	
		console.log(new Date() + 'nodeid: ' + nodeid + ' value: ');
		console.log(value);
		if (nodes[nodeid]['ready']) {
			console.log(new Date() + 'node%d: changed: %d:%s:%s->%s', nodeid, comclass,
					value['label'],
					nodes[nodeid]['classes'][comclass][value.index]['value'],
					value['value']);
		}
		nodes[nodeid]['classes'][comclass][value.index] = value;
	});
	zwave.on('scan complete', function(){
		log.info('zwave scan complete');
	});
	zwave.on('node ready', function(nodeid, nodeinfo) {
		nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
		nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
		nodes[nodeid]['product'] = nodeinfo.product;
		nodes[nodeid]['producttype'] = nodeinfo.producttype;
		nodes[nodeid]['productid'] = nodeinfo.productid;
		nodes[nodeid]['type'] = nodeinfo.type;
		nodes[nodeid]['name'] = nodeinfo.name;
		nodes[nodeid]['loc'] = nodeinfo.loc;
		nodes[nodeid]['ready'] = true;
		console.log('node%d: %s, %s', nodeid,
				nodeinfo.manufacturer ? nodeinfo.manufacturer
				: 'id=' + nodeinfo.manufacturerid,
				nodeinfo.product ? nodeinfo.product
				: 'product=' + nodeinfo.productid +
				', type=' + nodeinfo.producttype);
		console.log('node%d: name="%s", type="%s", location="%s"', nodeid,
				nodeinfo.name,
				nodeinfo.type,
				nodeinfo.loc);
		for (var comclass in nodes[nodeid]['classes']) {
			switch (comclass) {
				case 0x25: // COMMAND_CLASS_SWITCH_BINARY
				case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
					zwave.enablePoll(nodeid, comclass);
					break;
			}
			var values = nodes[nodeid]['classes'][comclass];
			console.log('node%d: class %d', nodeid, comclass);
			for (var idx in values)
				console.log('node%d:   %s=%s', nodeid, values[idx]['label'], values[idx]['value']);
		}
	});
	init();
});
