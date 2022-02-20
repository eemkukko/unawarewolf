import flask as flask
from flask import request, session, render_template, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
import wolfGameHandler as wgh
import eventlet
import uuid

app = flask.Flask(__name__)
app.secret_key = os.urandom(16)
socketio = SocketIO(app)
CORS(app)

DEV_MODE = False

funnynames = ["Bilbo", "Zebra", "Blub-Blub", "Martin", "Miranda", "Felicity", "Boblin", "Gary", "Orion"]
connected_players = {} # {key: sid, value: [username, readyStatus(bool)]}
gh = None

@app.route('/', methods=['GET'])
def index():
    return render_template("index.html")

@app.route('/lib/<scriptname>')
def send_script(scriptname):
    if scriptname in ['wolf_client.js', 'wolf_client.min.js', 'wolf_client_test.js']:
        return send_from_directory('js', scriptname)
    else:
        return "Invalid script name", 404

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file("favicon.ico")

@socketio.on('connect')
def connect():
    print(f"A new user connected with SID: {request.sid}")

@socketio.on('loginMessage')
def login(username):
    result = check_username(username)
    if (result[0]):
        connected_players[request.sid] = [username, False]
        print("Username confirmed: " + username)
        session['username'] = username
        emit('name_confirmed', username, broadcast=False)
        socketio.emit('playerListUpdate', list(connected_players.values()), broadcast=True, json=True)
    else:
        print("Username rejected: " + username)
        emit('nameFeedback', result[1])

@socketio.on('disconnect')
def disconnect():
    if "username" in session:
        old_username = session['username']
        session['username'] = ""
        print("User disconnected: " + str(old_username))
    else:
        print("User with SID: " + request.sid + " disconnected")
    connected_players.pop(request.sid, None)
    if not gh.hasGame:
        socketio.emit('playerListUpdate', list(connected_players.values()), broadcast=True, json=True)

@socketio.on('join_room')
def handle_join_room(data):
    #TODO
    pass

@socketio.on('getGameSettings')
def handle_get_settings():
    emit('gameSettingsMessage', gh.get_settings(), json=True)

@socketio.on('setGameSettings')
def handle_set_settings(data):
    gh.set_roles(data["roles"])
    if "timer" in data:
        gh.timer = data["timer"]
    socketio.emit('gameSettingsMessage', gh.get_settings(), json=True, broadcast=True)

@socketio.on('getPlayerList')
def send_playerlist():
    emit('playerListUpdate', list(connected_players.values()), json=True)

@socketio.on('togglePlayerReady')
def handle_ready():
    print(f"Got a ready message from {session['username']}")
    connected_players[request.sid][1] = not connected_players[request.sid][1]
    if not gh.hasGame:
        socketio.emit('playerListUpdate', list(connected_players.values()),
            broadcast=True, json=True)
    if gh.game_is_starting:
        gh.game_is_starting = False
        socketio.emit('serverMessage', "Game no longer starting", broadcast=True)
    elif everybody_ready():
        try:
            if not gh.hasGame:
                start_game()
            else:
                for timer in range(5, -1, -1):
                    socketio.emit("serverMessage", f"The night begins in {timer}", broadcast=True)
                    eventlet.sleep(1)
                emit("serverMessage", "") # Clear server message
                start_night()
        except ValueError as error:
            # Unready all players
            for sid in connected_players:
                connected_players[sid][1] = False
            socketio.emit('playerListUpdate', list(connected_players.values()),
            broadcast=True, json=True)
            socketio.emit('serverMessage', str(error), broadcast=True)

@socketio.on('debug_getStatus')
def getStatus():
    if DEV_MODE:
        broadcast_gameStateUpdate()
    else:
        emit("serverMessage", "Development mode is not active")

@socketio.on('debug_setTurn')
def set_turn(data):
    print(f"Got debug set turn message: {data}")
    if DEV_MODE:
        gh.set_current_turn(data)
        broadcast_gameStateUpdate()
    else:
        emit("serverMessage", "Development mode is not active")

@socketio.on('debug_setRole')
def set_role(data):
    print(f"Got debug set role message: {data}")
    if DEV_MODE:
        gh.set_role(session["username"], data)
        broadcast_gameStateUpdate()
    else:
        emit("serverMessage", "Development mode is not active")

@socketio.on('debug_finishGame')
def finish_game():
    print("Got request to finish game")
    results = gh.submit_votes()
    socketio.emit("resultAnnouncement", results, broadcast=True, JSON=True)
    for player in connected_players:
        connected_players[player][1] = False # Unready all players
    reset_gameHandler()

@socketio.on('clientGameUpdate')
def handle_clientUpdate(data):
    if gh.hasGame:
        print(f"Got client update: {data}")
        if not "cards" in data:
            data["cards"] = []
        if not "details" in data:
            data["details"] = None
        if not "moveType" in data:
            data["moveType"] = None
        result = gh.handle_move(request.sid, data["cards"],  data["moveType"], data["details"])
        if result[0]:
            if result[1]:
                emit("roleInfo",result[1], to=request.sid, json=True)
                broadcast_gameStateUpdate()
        else:
            print(result[1])
            emit("serverMessage", "Invalid move")
    else:
        print(f"Got gameupdate: {str(data)}, but there is no game")

@socketio.on('clientGameVote')
def handle_vote(data):
    if gh.hasGame:
        print(f"Got client vote from {connected_players[request.sid][0]} to kill {data['vote']}")
        if "vote" in data:
            gh.register_vote(request.sid, data["vote"])
    else:
        print(f"Got a client vote, but there is no active game")

def check_username(username):
    if not username:
        return (False, "Please enter your name.")
    if len(username) > 20:
        return (False, "Name too long (max. 20 characters).")
    name = username.translate(str.maketrans('','','åÅäÄöÖ-_ '))
    if not name.isalnum():
        return (False, "Name cannot contain special characters.")
    if username in [connected_players[p][0] for p in connected_players]:
        return (False, "Your name is already in use.")
    return (True, "")


def broadcast_gameStateUpdate():
    socketio.emit("gameStateUpdate", create_gameStateUpdate_data(), broadcast=True, json=True)

def create_gameStateUpdate_data():
    if not gh.hasGame:
        return {'has_game': False}
    data = gh.get_state(DEV_MODE)
    data['devmode'] = DEV_MODE
    return data

def send_gameStartInfo():
    for sid in connected_players:
        start_info=gh.get_start_info(sid)
        emit("gameStartInfo", start_info, to=sid, json=True)

def send_roleInfo(sid, data):
    emit("roleInfo", data, to=sid, json=True)

def everybody_ready():
    for sid in connected_players:
        if not connected_players[sid][1]:
            return False
    return True


def start_game():
    if not gh.game_is_starting:
        gh.game_is_starting = True
        for timer in range(5, -1, -1):
            socketio.emit("serverMessage", f"The game is starting in {timer}", broadcast=True)
            eventlet.sleep(1)
            if not gh.game_is_starting:
                raise ValueError("Game no longer starting")
        gh.setup_game(dict([[p, connected_players[p][0]] 
            for p in connected_players]))
        for player in connected_players:
            connected_players[player][1] = False
        gh.game_is_starting = False
        send_gameStartInfo()
    else:
        raise ValueError("Game cancelled: game already in progress")

def start_night():
    socketio.emit("nightBeginsMessage", "", broadcast=True)
    gh.night_loop()
    gh.voting_loop()
    if gh.hasGame:
        finish_game()


def reset_gameHandler(kick_players=False):
    roles = gh.settings["roles"]
    gh.reset()
    gh.settings["roles"] = roles
    print("Game handler has been reset")
    if kick_players:
        connected_players.clear()
        socketio.emit("serverResetMessage", "The game has been reset.", broadcast=True)

if __name__ == '__main__':
    print("Starting werewolf game server")
    gh = wgh.WolfGameHandler(broadcast_gameStateUpdate, send_roleInfo)
    socketio.run(app, host='0.0.0.0')
