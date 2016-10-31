var zwaveToMqtt = require('./modules/zwave_to_mqtt.js');
var mqtt = require('mqtt');

var client = mqtt.connect('mqtt://localhost');
zwaveToMqtt.start();
client.on('connect', ()=>{
	client.subscribe('home/basement/sensor');
});
client.on('message', (topic, msg)=>{
	console.log(topic + ': ' + msg.toString('utf8'));
});
