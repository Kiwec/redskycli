var Config = require("./config");
var readline = require("readline");
var SkyChat = require("node-skychat").init(Config);

SkyChat.on("newmessage", log);
SkyChat.on("server_info", msg => {
	if (msg.message !== "undefined") log(msg);
});

function log(msg) {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	msg = SkyChat.format(msg);
	console.log(msg);
	rl.prompt(true);
}

var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt(Config.username + "> ");
rl.on("line", line => {
	SkyChat.send(line);
	rl.prompt(true);
});

SkyChat.on("log", () =>
	log({
		color: "#ef4848",
		message_type: "bot_message",
		message: " Connecté au SkyChat.",
		pseudo: "skychatcli"
	})
);
