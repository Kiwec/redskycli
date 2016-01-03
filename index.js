var Config = require('./config');
var fs = require('fs');
var readline = require('readline');
var SkyChat = require('./skychat-chat');
var Util = require('./skychat-util');

SkyChat.on('newmessage', log);
SkyChat.on('server_info', function(msg) {
	if(msg.message !== 'undefined') log(msg);
});

function log(msg) {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	Util.showMessage(msg);
	fs.appendFile('log.txt', msg + '\n');
	rl.prompt(true);
}

var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt(Config.username + '> ');
rl.on('line', function(line) {
  SkyChat.send(line);
  rl.prompt(true);
});
