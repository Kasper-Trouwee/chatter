const express = require('express');
const indexRouter = require('./routes/index.js');
const { auth } = require('express-openid-connect');
require('dotenv').config();

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.BASEURL,
    clientID: process.env.CLIENTID,
    issuerBaseURL: process.env.ISSUERBASEURL,
};

const app = express();
app.set('views', 'views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.use('/', indexRouter);

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getFirstUser
} = require('./utils/users');

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
    });
});

server.listen(3000, () => {
    console.log("Running on 3000");
});