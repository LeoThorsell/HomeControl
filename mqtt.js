var mqtt = require('mqtt');
var fs = require('fs');
var devices;

var init = ()=>{
	var initConfig = (config) =>{
		devices = config.devices;
	};
	fs.readFile('config.json', (err, data) =>{
		if(err){console.log(err);return;}
		initConfig(JSON.parse(data));
		deviceManager(devices);
		for(var i=0;i<devices.length;i++){
			((inx)=>{
				devices[i].on('change', (msg)=>{
					console.log(devices[inx].name + ': ' + msg); 
				});
			})(i);
		}
	});
};
init();
var deviceManager = (devices)=>{
	var client  = mqtt.connect('mqtt://localhost');
	devices.forEach((device)=>{
		console.log(device);
		device.onChangeCbs = [];
		device.on = (event, cb)=>{
			if(event == 'change')
				device.onChangeCbs.push(cb);
		};
	});
	client.on('connect', function () {
		console.log("connected");
		devices.forEach((device)=>{
			client.subscribe(device.queue);
			console.log('subscribing to queue: ' + device.queue);

		});
	});
	client.on('message', function (topic, message) {
		console.log('topic: ' + topic + ' message: ' + message.toString());
		for(var device in devices){
			if(topic != device.queue)
				continue;
			for(var cb in device.onChangeCbs)
				cb(message);
		}
	});
	client.on('error', function(){
		console.log('errrrror');
	});
};
