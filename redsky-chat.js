var Config = require('./config');
var io = require('socket.io-client');
var request = require('request');
var Util = require('./skychat-util');

function SkyChat() {
	this.events = {};
	this.loggedin = false;
	this.sock = io.connect('http://skychat.fr:8054');
	this.lastTms = 0;

	var eventList = ['alert', 'connected_list', 'info', 'success'];
	for (var i in eventList) {
		this.sock.on(eventList[i], (function(eventArgs) {
			this.fireEvent(eventList[i], eventArgs);
		}).bind(this));
	}

	this.sock.on('connect', this.onConnect.bind(this));
	this.sock.on('log', this.onLog.bind(this));

	setTimeout((function(){
		this.sock.on('message', this.onMessage.bind(this));
	}).bind(this), 5000);
}

// Calls registered event callbacks
SkyChat.prototype.fireEvent = function(eventName, eventArgs) {
	switch(eventName) {
		case 'alert':
		case 'info':
		case 'success':
			this.onServerInfo(eventArgs);
			break;
		default:
	}

	if(typeof this.events[eventName] !== 'undefined') {
		for (var i in this.events[eventName]) {
			this.events[eventName][i](eventArgs);
		}
	}
};

SkyChat.prototype.mp = function(user, msg) {
	this.send('/w ' + user + ' ' + msg);
};

// Registers a new event
SkyChat.prototype.on = function(event, callback) {
	if(typeof this.events[event] === 'undefined') {
		this.events[event] = [];
	}
	this.events[event].push(callback);
};

SkyChat.prototype.onConnect = function() {
	var getHash = function(err, res, body) {
		if(err) {
			console.log(err);
			return;
		}

		body = JSON.parse(body);

		this.sock.emit('log', {
			hash: body.hash,
			pseudo: body.pseudo,
			id: body.id,
			tms: body.tms,
			mobile: Config.mobile
		});
	};

	var options = {
		url: 'http://skychat.fr/ajax/account/api.php',
		form: {
			pseudo: Config.username,
			pass: Config.password
		}
	};

	request.post(options, getHash.bind(this));
};

SkyChat.prototype.onMessage = function(msg) {
	var cleanMsg = Util.filter(msg);
	if(msg.tms < this.lastTms) return;
	this.lastTms = msg.tms;
	if(msg.message.indexOf('!') === 0) {
		var subArg = cleanMsg.indexOf(' ') + 1;
		this.fireEvent('command', {
			user: msg.pseudo,
			name: cleanMsg.substring(1).split(' ')[0],
			args: subArg ? cleanMsg.substring(subArg) : '',
			nbArgs: cleanMsg.split(' ').length - 1
		});
	} else if(msg.pseudo == 'SkychatBot') {
		// Points transfer
		if(cleanMsg.indexOf('de commission') !== -1) {
			var giveMsg = msg.message.match(/<b>(.*?)<\/b>/g);
			this.fireEvent('givepoints', {
				from: Util.removeHTML(giveMsg[2]),
				amount: parseInt(Util.removeHTML(giveMsg[1]), 10),
				to: Util.removeHTML(giveMsg[0])
			});
		// Random number generation
		} else if(cleanMsg.indexOf('tiré par') !== -1) {
			var match = cleanMsg.match(/t (.*) t.*?r (.*): (.*)/);
			this.fireEvent('rand', {
				max: parseInt(match[1], 10),
				pseudo: match[2],
				number: parseInt(match[3], 10)
			});
		}
	} else {
	  this.fireEvent('newmessage', msg);
	}
};

SkyChat.prototype.onLog = function(args) {
	if(this.loggedin) return;
	this.loggedin = true;
	this.fireEvent('log_once', args);
};

SkyChat.prototype.onServerInfo = function(args) {
	this.fireEvent('server_info', args);
	if(typeof args.message === 'undefined') return;
	var msg = Util.filter(args.message);
	var match = msg.match(/attendre (.*?) millis/);
	if(match && match.length == 2 && typeof this.lastMessage !== 'undefined') {
		console.log('Retrying sending message');
		this.sendLater(this.lastMessage, match[1]);
	}
};

SkyChat.prototype.send = function(message) {
	this.sock.emit('message', { message: message });
	this.lastMessage = message;
};

SkyChat.prototype.sendLater = function(msg, delay) {
		// 400ms = safe delay between messages
	if(typeof delay === 'undefined') delay = 1000;
	setTimeout((function() { this.send(msg); }).bind(this), delay);

};

module.exports = new SkyChat();

