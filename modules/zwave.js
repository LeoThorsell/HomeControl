var OZW = require('openzwave-shared');
var log = require('../modules/log.js');
var util = require('util');
var main = {
	nodes: [],
	me: {},
	events: [],
	running:false,
	on : (msg,nodeid,fn)=>{
		if(!main.events[msg])
			main.events[msg]=[];
		if(!main.events[msg][nodeid])
			main.events[msg][nodeid] = [];
		main.events[msg][nodeid].push(fn);
	},
	raise: (eventName, nodeid, obj)=>{
		if(!main.events[eventName])
			return;
		if(!main.events[eventName][nodeid])
			return;
		var cbs = main.events[eventName][nodeid];
		if(!cbs)
			return;
		for(var i=0;i<cbs.length;i++){
			cbs[i](obj);
		}
	},
	init: ()=>{
		if(main.running)
			return;
		main.running = true;
		var zwave = new OZW({
			Logging: false,     // disable file logging (OZWLog.txt)
			ConsoleOutput: true  // enable console logging
		});
		zwave.connect('/dev/ttyUSB0');
		zwave.on('connected', function(homeid) {log.debug('zwave connected to homeid: ' + homeid);});
		zwave.on('driver ready', (homeid)=> {log.debug('Driver ready');});
		zwave.on('notification', (nodeid, notif, help)=> {	
			log.info(util.format('node%d: notification(%d): %s', nodeid, notif, help));
		});
		zwave.on('driver failed', function() {
			log.error('failed to start zwave driver');
			zwave.disconnect();
		});
		zwave.on('node added', function(nodeid) {
			log.info('=================== NODE ADDED:'+nodeid+'! ====================');
			main.nodes[nodeid] = {
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
		});
		zwave.on('value added', function(nodeid, comclass, value) {
			if (!main.nodes[nodeid]['classes'][comclass])
				main.nodes[nodeid]['classes'][comclass] = {};
			main.nodes[nodeid]['classes'][comclass][value.index] = value;
		});
		zwave.on('value changed', function(nodeid, comclass, value) {
			if (main.nodes[nodeid]['ready']) {
			//	console.log(new Date() + 'node%d: changed: %d:%s:%s->%s', nodeid, comclass,
			//			value['label'],
			//			main.nodes[nodeid]['classes'][comclass][value.index]['value'],
			//			value['value']);
			}
			main.nodes[nodeid]['classes'][comclass][value.index] = value;
			main.raise('changed', nodeid, value);
		});
		zwave.on('scan complete', function(){log.info('zwave scan complete');});
		zwave.on('node ready', function(nodeid, nodeinfo) {
			log.info('node ' + nodeid + ' ready!');
			var node = main.nodes[nodeid];
			node['manufacturer'] = nodeinfo.manufacturer;
			node['manufacturerid'] = nodeinfo.manufacturerid;
			node['product'] = nodeinfo.product;
			node['producttype'] = nodeinfo.producttype;
			node['productid'] = nodeinfo.productid;
			node['type'] = nodeinfo.type;
			node['name'] = nodeinfo.name;
			node['loc'] = nodeinfo.loc;
			node['ready'] = true;
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
			for (var comclass in main.nodes[nodeid]['classes']) {
				switch (comclass) {
					case 0x25: // COMMAND_CLASS_SWITCH_BINARY
					case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
						zwave.enablePoll(nodeid, comclass);
						break;
				}
				var values = main.nodes[nodeid]['classes'][comclass];
				console.log('node%d: class %d', nodeid, comclass);
				for (var idx in values)
					console.log('node%d:   %s=%s', nodeid, values[idx]['label'], values[idx]['value']);
			}
		});
	}
};
var test = {
	a:'hemligt',
	init:function(){
		console.log(this.a);
	}
}
exports.init = main.init;
exports.on = main.on;
