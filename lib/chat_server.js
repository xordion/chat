var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

//main controller
//open a socket.io server
exports.listen = function (server) {
    io = socketio.listen(server);
    io.set('log level', 1);

    io.sockets.on('connection', function (socket) {//defines the logic for each user after signed-in
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);//give user a name
        joinRoom(socket, 'Lobby');//initially, put the user in chat room 'Lobby' when signed in

        //handle users' updates
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        //the list of occupied chat rooms
        socket.on('rooms', function () {
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);//defines the logic used to clear the user after disconnect
    });
};

//ally functions

//assign user name
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;//connect nickname with client id
    socket.emit('nameResult', {
        success: true,
        name: name
    });
    namesUsed.push(name);//push the known nickname into arry
    return guestNumber + 1;//user number count plus one
}

//enter a chat room
function joinRoom(socket, room) {
    socket.join(room);//let user join in a room
    currentRoom[socket.id] = room;//record the current room user is in
    socket.emit('joinResult', {room: room});//let the users know they are in a new room
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + ' has joined' + room + '.'
    });//print text in chat room make all roommate know that their room has new guest

    var usersInRoom = io.sockets.clients(room);//get the users in current room
    if (usersInRoom.length > 1) {//print the list of all user in current room if there is more than two of them
        var usersInRoomSummary = 'Users currently in ' + room + ': ';
        for (var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', {text: usersInRoomSummary});//print this summary for user
    }
}

//change user name
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function (name) {
        if (name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: "Names cannot begin with 'Guest'."
            });
        } else {
            if (namesUsed.indexOf(name) == -1) {//if the new name is not exist, user can change the old one with the new one
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete  namesUsed[previousNameIndex];//delete the previous name so that other users may use it
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' is now known as ' + name + '.'
                });
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use.'
                });
            }
        }
    });
}

//send messages
function handleMessageBroadcasting(socket) {
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

//create a new room
function handleRoomJoining(socket) {
    socket.on('join', function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

//disconnect
function handleClientDisconnection(socket) {
    socket.on('disconnect', function () {//remove user info from nicknames and namesUsed
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}
