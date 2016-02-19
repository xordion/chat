function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}//display messages from user, using 'text' to prevent assault from unknown code

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}//display messages from system, with italic font style

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    var systemMessage;

    if (message.charAt(0) == '/') {//if the input content is starting with '/', then it is a command
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage($('#room').text(), message);//broadcast message with socket
        $('#messages').append(divEscapedContentElement(message));//print messages on message board
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));//adjust scroll
    }
    $('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function () {
    var chatApp = new Chat(socket);

    //show result on name changing attempt
    socket.on('nameResult', function (result) {
        var message;

        if (result.success) {
            message = 'You are no know as ' + result.name + '.';
        } else {
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    });

    //show result on room changing attempt
    socket.on('joinResult', function (result) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement("Room changed. "));
    });

    //show result on messages received
    socket.on('message', function (message) {
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });

    //show the list of available rooms
    socket.on('rooms', function (rooms) {
        $('#room-list').empty();

        for (var room in rooms) {
            room = room.substring(1, room.length);
            if (room != '') {
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        $('#room-list div').click(function () {//you can change your room by click on the room's name in this list
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });

    //sent request for the available room list in each 1s
    setInterval(function () {
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();

    //send chat messages by submit the form
    $('#send-form').submit(function () {
        processUserInput(chatApp, socket);
        return false;
    });
});