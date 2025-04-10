const socket = io();
const username = "{{ username }}";
const room = "{{ room_id }}";

let hasLeft = false;

function leaveRoom() {
    if (hasLeft) return;
    hasLeft = true;
    socket.emit('disconnect_user', { username, room });
    socket.disconnect();
    window.location.href = "/";
}

document.addEventListener('DOMContentLoaded', () => {
    socket.emit('join', { username, room });

    const chatBox = document.getElementById('chat');
    const chatForm = document.getElementById('chatForm');
    const msgInput = document.getElementById('msgInput');
    const rollButton = document.getElementById('rollDice');

    socket.on('chat', (data) => {
        const msg = document.createElement('p');
        msg.innerHTML = `<strong>${data.username || 'System'}:</strong> ${data.msg}`;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    socket.on('user_left', (data) => {
        const msg = document.createElement('p');
        msg.innerHTML = `<em>${data.username} has left the chat.</em>`;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    document.getElementById('leaveRoom').addEventListener('click', () => {
        socket.emit('leave_room', { username, room });
    });

    chatForm.addEventListener('submit', () => {
        const message = msgInput.value.trim();
        if (message) {
            socket.emit('chat', { username, msg: message, room });
            msgInput.value = '';
        }
    });

    rollButton.addEventListener('click', () => {
        const sides = parseInt(document.getElementById('diceType').value);
        const count = parseInt(document.getElementById('diceCount').value);

        if (count > 0 && sides > 0) {
            socket.emit('roll_dice', { username, room, sides, count });
        }
    });
});

window.addEventListener('beforeunload', leaveRoom);

socket.on('update_users', (data) => {
    const userList = document.getElementById('users');
    userList.innerHTML = '';
    data.users.forEach(user => {
        const li = document.createElement('li');
        const isHost = user === data.host;
        li.innerHTML = isHost ? `<strong>Host: ${user}</strong>` : user;
        userList.appendChild(li);
    });
});
