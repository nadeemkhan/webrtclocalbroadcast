const credentials = require('./credentials');
const express = require('express');
const app = express();
let broadcaster;
let server;
let port;
if (credentials.key && credentials.cert) {
    const https = require('https');
    server = https.createServer(credentials, app);
    port = 443;
} else {
    const http = require('http');
    server = http.createServer(app);
    port = 3000;
}
const io = require('socket.io')(server);
app.use(express.static(__dirname + '/public'));
io.sockets.on('error', e => console.log(e));
io.sockets.on('connection', function(socket) {
    socket.on('broadcaster', function() {
        console.log('broadcaster started');
        broadcaster = socket.id;
        socket.broadcast.emit('broadcaster');
    });
    socket.on('watcher', function() {
        console.log('watcher started');
        broadcaster && socket.to(broadcaster).emit('watcher', socket.id);
    });
    socket.on('offer', function(id /* of the watcher */ , message) {
        console.log('offer started');
        socket.to(id).emit('offer', socket.id /* of the broadcaster */ , message);
    });
    socket.on('answer', function(id /* of the broadcaster */ , message) {
        console.log('answer started');
        socket.to(id).emit('answer', socket.id /* of the watcher */ , message);
    });
    socket.on('candidate', function(id, message) {
        console.log('candidate');
        socket.to(id).emit('candidate', socket.id, message);
    });
    socket.on('disconnect', function() {
        console.log('disconnected');
        broadcaster && socket.to(broadcaster).emit('bye', socket.id);
    });
});
server.listen(port, () => console.log(`Server is running on port ${port}`));