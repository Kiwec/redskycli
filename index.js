var cheerio = require('cheerio');
var io = require('socket.io-client');
var readline = require('readline');
var setcolor = require('ansi-color').set;
var fs = require('fs');

var Util = {
  filter: function(msg) {
    // Citation
    var citation = msg.match(/<bl.*?>(.*?)<\/b.*?e>/);
    if(citation) {
      var user_cite = citation[0].match(/.*?>Par (.*?)<.*?r>/);
      citation = citation[0].replace(/.*?r>/, '');
      var message = msg.replace(/.*?ote>/, '');
      msg = setcolor('[' + user_cite[1] + '] ' + citation, 'italic');
      if(message !== '') msg += '\n  -&gt; ' + message;
    }
    // Smileys
    var tags = msg.match(/<.*?>/g);
    if(tags) {
      for(var i = 0; i < tags.length; i++) {
        var alt = tags[i].match(/alt="(.*?)"/);
        if(alt && alt.length == 2) {
          msg = msg.replace(tags[i], alt[1]);
        } else {
          msg = msg.replace(tags[i], '');
        }
      }
    }

    // Code html
    var $ = cheerio.load('');
    msg = $('<p>' + msg + '</p>').text();

    return msg;
  },
  fixColor: function(color) {
    if(typeof color === 'undefined' || color === false) color = 'white';
    else if(color == '#ffab46') color = 'yellow';
    else if(color == '#ff358b') color = 'magenta';
    else if(color == '#000') color = 'white';
    else if(color == 'purple') color = 'cyan';
    else if(color == '#046380') color = 'cyan';
    return color;
  },
  showMessage: function(msg) { 
    if(msg.message_type == 'bot_message')
      chat.log('[BOT] ' + this.filter(msg.message), 'blue');
    else if(msg.message_type == 'user_message')
      chat.log('[' + setcolor(msg.pseudo, msg.color) + '] ' + this.filter(msg.message));
    else if(msg.message_type == 'user_me')
      chat.log(setcolor('* ' + setcolor(msg.pseudo, msg.color), 'italic') + ' ' +
	setcolor(this.filter(msg.message) + ' *', 'italic'));
    else if(msg.message_type == 'user_mp')
      chat.log(setcolor('[MP]', 'green') + ' [' + setcolor(msg.pseudo, msg.color) +
	'] ' + setcolor(this.filter(msg.message), 'green'));
    else if(msg.message_type == 'user_spoil')
      chat.log('[' + setcolor(msg.pseudo, msg.color) + ']' +
	setcolor(setcolor(' [SPOIL] ', 'red'), 'bold') + this.filter(msg.message));
    else chat.log('Message inconnu !', 'red');
  }
};

function Chat()
{
  this.buffer = [];
  this.connected = false;
  this.config = require('./Config');
}

Chat.prototype.init = function()
{
  this.username = this.config.username;

  this.sock = io.connect(this.config.address);
  this.sock.on('alert', this.onAlert.bind(this));
  this.sock.on('ban', this.onBan.bind(this));
  this.sock.on('clear', this.onClear.bind(this));
  this.sock.on('info', this.onInfo.bind(this));
  this.sock.on('log', this.onLog.bind(this));
  this.sock.on('message', this.onMessage.bind(this));
  this.sock.on('success', this.onSuccess.bind(this));
  this.sock.on('youtube_player', this.onYoutube.bind(this));

  this.sock.on('connect', this.relog.bind(this));
};

Chat.prototype.changeMask = function() {
  // 0-40, 54-56
  // Donc 0-43 et si > 40, on ajoute 13
  var randomMask = Math.floor(Math.random() * 44);
  if(randomMask > 40) randomMask += 13;
  this.sock.emit('message',{message:'/shop mask buy ' + randomMask});
};

Chat.prototype.relog = function() {
  this.sock.emit('log', {
    hash: this.config.hash,
    pseudo: this.config.username,
    id: this.config.id,
    mobile: false
  });
};

Chat.prototype.log = function(msg, color)
{
  if(typeof color !== 'undefined' && color !== false) {
    msg = setcolor(msg, color);
  }
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(msg);
  fs.appendFile('log.txt', msg + '\n', function(err){});
  rl.prompt(true);
};

Chat.prototype.onAlert = function(msg) {
  this.log(msg.message, 'red');
};
Chat.prototype.onBan = function(msg) {
  this.log('Banni :(', 'red');
  this.sock.disconnect();
};
Chat.prototype.onClear = function(msg) { this.log('= Chat clear =', 'blue'); };
Chat.prototype.onInfo = function(msg) {
  if(msg.message.indexOf('Vos donn') !== 0) this.log(msg.message, 'blue');
};
Chat.prototype.onLog = function(msg) {
  this.username = msg.pseudo;
  if(this.buffer.length > 0) {
    this.sock.emit('message',{message:this.buffer[0]});
    this.buffer.splice(0, 1);
    return;
  }

  this.connected = true;
  this.log('Connecte sous ' + msg.pseudo, 'green');
};
Chat.prototype.onMessage = function(msg) {
  if(msg.pseudo_lower == this.username) {
    if(Util.filter(msg.message) === '') this.log('SANDALE !', 'red');
    return;
  }

  for(var i in this.config.ignoreList) {
    if(this.config.ignoreList[i].toLowerCase() == msg.pseudo_lower) return;
  }

  msg.color = Util.fixColor(msg.color);
  Util.showMessage(msg);

  if(Util.filter(msg.message) == ':morsay:') this.send(':japfuck:');
};
Chat.prototype.onSuccess = function(msg) { this.log(msg.message, 'green'); };
Chat.prototype.onYoutube = function(msg) {
  this.log('Youtube : ' + msg.code, 'yellow');
};

// Envoie un message
Chat.prototype.send = function(msg) {
  this.sock.emit('message',{message:msg});
  setTimeout(this.changeMask.bind(this), 300);
};

var chat = new Chat();
chat.init();

var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('[' + setcolor(chat.username, 'cyan') + '] ');
rl.on('line', function(line) {
  chat.send(line);
  rl.prompt(true);
});
