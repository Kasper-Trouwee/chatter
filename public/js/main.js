const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
let myMsg = false;

// Get username en room van URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

socket.emit('joinRoom', { username, room });

socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on('ai_message', (message) => {
  ai_outputMessage(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});


socket.on('message', (message) => {
  if (myMsg === true){
    outputMyMessage(message);
    myMsg = false;
  }
  else{
    outputMessage(message);

  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('on_kicked', () => {
  alert('you have been kicked');
  window.location = '../index.html';
});

// Message versturen
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  let msg = e.target.elements.msg.value;
  msg = msg.trim();

  if (!msg) {
    return false;
  }

  socket.emit('chatMessage', msg);

  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
  myMsg = true;
});

// maakt message style aan
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// maakt myMessage style aan
function outputMyMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.classList.add('message--my');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// maakt ai_message style aan
function ai_outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('ai_message');
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.username; //Dit is de tekst maar werkt funky omdat er geen username is
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

function outputRoomName(room) {
  roomName.innerText = room;
}

function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    li.setAttribute("onclick", "kickUser('"+user.id+"')");
    userList.appendChild(li);
  });
}

document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  if (leaveRoom) {
    window.location = '../index.html';
  }
});

function kickUser(id){
  socket.emit("kick", id);
}