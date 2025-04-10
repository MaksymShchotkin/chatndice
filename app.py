import eventlet
eventlet.monkey_patch()
import random
from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO, join_room, leave_room, emit
from collections import defaultdict
import os
import json
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'

socketio = SocketIO(app)
rooms = defaultdict(lambda: {"users": [], "host": None})

rooms = {} 


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        username = request.form['username']
        room_id = request.form['room']
        if not room_id:
            room_id = str(uuid.uuid4())[:8]  # generate room ID
        return redirect(url_for('room', room_id=room_id, username=username))
    return render_template('index.html')


@app.route('/room/<room_id>')
def room(room_id):
    username = request.args.get('username', 'Guest')
    return render_template('room.html', room_id=room_id, username=username)


@socketio.on('join')
def handle_join(data):
    username = data['username']
    room = data['room']

    if room not in rooms:
        rooms[room] = {'members': set(), 'messages': [], 'host': username}

    rooms[room]['members'].add(username)
    join_room(room)

    emit('update_users', {'users': list(rooms[room]['members']), 'host': rooms[room]['host']}, room=room)
    emit('chat', {'username': 'System', 'msg': f'{username} has joined the room.'}, room=room)


@socketio.on('disconnect_user')
def handle_disconnect(data):
    username = data['username']
    room = data['room']
    leave_room(room)

    if room not in rooms:
        return

    room_data = rooms[room]
    if username in room_data['members']:
        room_data['members'].remove(username)

    if not room_data['members']:
        del rooms[room]
        return

    if username == room_data['host']:
        room_data['host'] = next(iter(room_data['members']), None)

    emit('chat', {'username': 'System', 'msg': f"{username} has left the room."}, room=room)
    emit('update_users', {'users': list(room_data['members']), 'host': room_data['host']}, room=room)


@socketio.on('chat')
def handle_chat(data):
    emit('chat', data, room=data['room'])


@socketio.on('roll_dice')
def handle_dice_roll(data):
    username = data['username']
    room = data['room']
    sides = int(data['sides'])
    count = int(data['count'])

    rolls = [random.randint(1, sides) for _ in range(count)]
    result_msg = f"{username} rolled {count}d{sides}: " + \
        ', '.join(map(str, rolls))

    emit('chat', {'username': 'DiceBot', 'msg': result_msg}, room=room)


if __name__ == '__main__':
    if not os.path.exists('logs'):
        os.makedirs('logs')
    socketio.run(app, debug=True)
