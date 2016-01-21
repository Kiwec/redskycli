var Config = require('./config');
var fs = require('fs');
var readline = require('readline');
var SkyChatO = require('node-skychat');
var SkyChat = new SkyChatO(Config);

SkyChat.on('newmessage', log);
SkyChat.on('server_info', function(msg) {
	if(msg.message !== 'undefined') log(msg);
});

function log(msg) {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	msg = SkyChat.format(msg);
	console.log(msg);
	fs.appendFile('log.txt', msg + '\n');
	rl.prompt(true);
}

var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt(Config.username + '> ');
rl.on('line', function(line) {
	var rng = Math.round(Math.random() * 63);
	SkyChat.send('/shop mask buy ' + rng);
  SkyChat.send(line);
  rl.prompt(true);
});
