// scripts.js
const socket = io(); // 👈 Move this outside so it's accessible globally

document.addEventListener('DOMContentLoaded', () => {
    const username = "{{ username }}";
    const room = "{{ room_id }}";

    socket.emit('join', { username, room });

    const chatBox = document.getElementById('chat');
    const msgInput = document.getElementById('msgInput');
    const rollButton = document.getElementById('rollDice');

    // Listen for chat messages
    socket.on('chat', (data) => {
        const msg = document.createElement('p');
        msg.innerHTML = `<strong>${data.username || 'System'}:</strong> ${data.msg}`;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Handle sending messages (Enter key for sending)
    msgInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const message = msgInput.value.trim();
            if (message) {
                socket.emit('chat', { username, msg: message, room });
                msgInput.value = ''; // Clear the input after sending
            }
        }
    });

    // Handle rolling dice
    rollButton.addEventListener('click', () => {
        const sides = parseInt(document.getElementById('diceType').value);
        const count = parseInt(document.getElementById('diceCount').value);

        if (count > 0 && sides > 0) {
            socket.emit('roll_dice', { username, room, sides, count });
        }
    });

    document.getElementById('leaveRoom').addEventListener('click', () => {
        socket.emit('disconnect_user', { username: "{{ username }}", room: "{{ room_id }}" });
        socket.disconnect();

        // Optional: redirect back to homepage
        window.location.href = "/";
    });
});

// Handle before unload to disconnect user
window.addEventListener('beforeunload', () => {
    socket.emit('disconnect_user', { username, room });
});

// Listen for the update_users event to update the user list in the room
socket.on('update_users', (data) => {
    const userList = document.getElementById('users');
    userList.innerHTML = '';  // Clear the current list

    // Loop through users and add them to the list
    data.users.forEach(user => {
        const li = document.createElement('li');
        const isHost = user === data.host;  // Check if the user is the host
        li.innerHTML = isHost ? `<strong>Host: ${user}</strong>` : user;  // Highlight host
        userList.appendChild(li);
    });
});
