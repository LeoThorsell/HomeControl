var mqtt = require('mqtt');
var log = require('../modules/log.js');
var zwave = require('../modules/zwave.js');
var fs = require('fs');
var devices;

var main = {
	running:false,
	mqttClient: {},
	init: ()=>{
		if(main.running)
			return;
		main.running = true;
		var initConfig = (config) =>{
			main.mqttClient = mqtt.connect('mqtt://localhost');
			main.mqttClient.on('connect', ()=>{
				config.devices.forEach((device)=>{	
					zwave.on('changed', device.znodeid, (arg)=>{
						main.mqttClient.publish(device.queue, JSON.stringify({
							value:arg.value,
							unit:arg.units,
							label:arg.label,
						}));
					});
				});
			});
			zwave.init();	
		};
		fs.readFile('config.json', (err, data) =>{
			if(err){
				log.error(err);
				return;
			}
			initConfig(JSON.parse(data));
		});
	}
}
exports.start = main.init;
