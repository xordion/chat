var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    cache = {};

//response for error 404
function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource is not found.');
    response.end();
}

//response for request succeed 200
function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200,
        {"content-type": mime.lookup(path.basename(filePath))}
    );
    response.end(fileContents);
}

//check if the file requested is in the RAM, if yes, read it, else read it and save it in RAM. If the file is not exist, return 404
function serveStatic(response, cache, absPath) {
    if (cache[absPath]) {//check if the file is in RAM(cache)
        sendFile(response, absPath, cache[absPath]);//return the file from RAM if YES
    } else {
        fs.exists(absPath, function (exists) {//check if the file exists
            if (exists) {
                fs.readFile(absPath, function (err, data) {//read the file from hard drive if YES
                    if (err) {
                        send404(response);//return method send404 if error occurred
                    } else {
                        cache[absPath] = data;//save the data to RAM if reading successfully
                        sendFile(response, absPath, data);//and respond with method sendFile
                    }
                });
            } else {
                send404(response);//respond with http 404 if the file is not exist
            }
        });
    }
}

//a http server
var server = http.createServer(function (request, response) {
    var filePath = false;
    if (request.url == '/') {//what is request.url?
        filePath = 'public/index.html';//get the responsive HTML file
    } else {
        filePath = 'public' + request.url;//collect all file requested, and make URL a file
        console.log(filePath);
    }
    var absPath = './' + filePath;
    serveStatic(response, cache, absPath);//return static file
});

//set a port to start the server
server.listen(3300, function () {
    console.log("Server listening on port 3300.");
});

//set up socket server
var chatServer = require('./lib/chat_server');//this module is a socket.io server handler for chat service
chatServer.listen(server);//start the socket server
