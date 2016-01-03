var cheerio = require('cheerio');
var setcolor = require('ansi-color').set;
var $ = cheerio.load('');

module.exports = {};

module.exports.filter = function(msg) {
	var str = msg.message;
	if(typeof str === 'undefined') return 'UNDEFINED STR';
	str = this.fixSmileys(str);
	str = this.fixImages(str);
	str = this.fixCitation(str);
	str = this.removeHTML(str);
	return str;
};

module.exports.fixColor = function(color) {
	switch(color) {
		case '#ef4848': return 'red';
		case '#457dbb': return 'red';
		case '#bf00ff': return 'green';
		case '#??????': return 'blue';
		case '#85c630': return 'cyan';
		case '#ffab46': return 'yellow';
		case '#f5a6bf': return 'magenta';
		default: return 'white';
	}
};

module.exports.fixCitation = function(str) {
	var citation = str.match(/<bl.*?>(.*?)<\/b.*?e>/);
	if(citation) {
		var user_cite = citation[0].match(/.*?>Par (.*?)<.*?r>/);
		citation = citation[0].replace(/.*?r>/, '');
		var message = str.replace(/.*ote>/, '');
		str = '[' + user_cite[1] + '] ' + citation;
		if(message !== ' ') str += '\n -&gt; ' + message;
	}

	return str;
};

module.exports.fixImages = function(str) {
	return str.replace(/<img.?src="(.*?)".*?>/g, 'http://skychat.fr/$1'); 
}

module.exports.fixSmileys = function(str) {
	return str.replace(/<img.*?alt="(.*?)".*?>/g, '$1');
};

module.exports.removeHTML = function(str) {
	return $('<p>' + str + '</p>').text();
};

module.exports.showMessage = function(msg) {
	switch(msg.message_type) {
		case 'bot_message':
		case 'user_message':
			console.log('[' + setcolor(msg.pseudo, this.fixColor(msg.color)) +
									'] ' + this.filter(msg));
			break;
		case 'user_me':
			console.log('* ' + setcolor(msg.pseudo, this.fixColor(msg.color)) + ' ' +
								 setcolor(this.filter(msg), 'italic'));
			break;
		case 'user_mp':
			console.log(setcolor('[MP]', 'green') + ' [' +
									setcolor(msg.pseudo, this.fixColor(msg.color)) + '] ' +
									setcolor(this.filter(msg), 'green'));
			break;
		case 'user_spoil':
			console.log(setcolor(setcolor('[SPOIL]', red), 'bold') +
									setcolor(this.filter(msg), 'black'));
			break;
		default:
			if(typeof msg.message === 'undefined') return;
			console.log(setcolor(msg.message, 'red'));
	}
};
