//class Chat
var Chat = function (socket) {
    this.socket = socket;
};

Chat.prototype.sendMessage = function (room, text) {
    var message = {
        room: room,
        text: text
    };
    this.socket.emit('message', message);
};

Chat.prototype.changeRoom = function (room) {
    this.socket.emit('join', {
        newRoom: room
    });
};

Chat.prototype.processCommand = function (command) {
    var words = command.split(' ');//make command string to an arry
    var command = words[0].substring(1, words[0].length).toLowerCase();//get the key word in arry and lower its case, start from 1 because we dont need '/' in the first word
    var message = false;

    switch (command) {
        case 'join':
            words.shift();//remove the first element in words
            var room = words.join(' ');//make the words to string and separate words with space' '
            this.changeRoom(room);
            break;
        case 'nick':
            words.shift();
            var name = words.join(' ');
            this.socket.emit('nameAttempt', name);
            break;

        default:
            message = 'Unrecognized command.';
            break;
    }
    return message;
};

