const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getFirstUser
} = require('./utils/users');
const { emit } = require('process');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));


io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    socket.emit('ai_message', formatMessage(`Welcome to ${user.room}!`));
    socket.broadcast.to(user.room).emit('ai_message', formatMessage(`${user.username} has joined the chat`));
    io.to(user.room).emit('roomUsers', {room: user.room, users: getRoomUsers(user.room)});
  });

  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit('ai_message', formatMessage(`${user.username} has left the chat`));
      io.to(user.room).emit('roomUsers', {room: user.room, users: getRoomUsers(user.room)});
    }
  });

  socket.on('kick', id => {
    const currentUser = getCurrentUser(socket.id);
    const admin = getFirstUser(currentUser.room);

    if (currentUser.id === admin.id && currentUser.id != id){
      const user = userLeave(id);
      socket.emit('ai_message', formatMessage(`${user.username} has been kicked`));
      socket.broadcast.to(user.room).emit('on_kicked');
      io.to(user.room).emit('roomUsers', {room: user.room, users: getRoomUsers(user.room)});      
    }
  })
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
