const path = require('path');
const http = require('http');

const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const { generateMessage, generateLocationMessage } = require('./utils/message');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
// express does this in the back already but we want it here so that we are able to configure socket.io
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirPath = path.join(__dirname, '../public');

const roomStatic = 'abd';

app.use(express.static(publicDirPath));

// let count = 0;
io.on('connection', (socket) => {
    socket.on('join', (options, callback) => {

        const { error, user } = addUser({ id: socket.id, ...options });

        if (error) {
            return callback(error);
        };

        socket.join(user.room);
        socket.emit('message', generateMessage('System', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('System', `${user.username} joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    });

    const filter = new Filter();
    socket.on('sendMessage', (msg, callback) => {
        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed');
        }

        const user = getUser(socket.id);

        io.to(user.room).emit('message', generateMessage(user.username, msg));
        callback();
    });

    socket.on('shareLocation', (location, callback) => {
        const gMapUrl = `www.google.com/maps?q=${location.latitude},${location.longitude}`;

        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, gMapUrl));
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('System', `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
});

server.listen(port, () => {
    console.log('Express Chat-App listening on port', port);
});