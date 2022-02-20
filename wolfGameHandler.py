import werewolf as wf
import eventlet
from collections import Counter
'''
' WolfGameHandler
' Handles communication between the werewolf game and server routes
'
'''
class WolfGameHandler:
    def __init__(self, broadcast_function, emit_function):
        self.reset()
        self.broadcast_to_clients = broadcast_function
        self.send_to_client = emit_function

    def reset(self):
        self.game = wf.WerewolfGame()
        self.game_is_starting = False
        self.hasGame = False
        self.playerids = {}
        self.timer = 0
        self.night_in_progress = False
        self.voting_in_progress = False
        self.votes = {}
        self.settings = {
            "roles": []
        }
        self.set_default_roles()

    '''
    ' roles: dict {"Rolename": count}
    '''
    def set_roles(self, roles):
        new_roles = []
        for role in roles:
            try:
                wf.Role[role]
            except KeyError:
                raise ValueError(f"Error: role {role} does not exist.")
            new_roles.extend([role for i in range(roles[role])])
        self.settings["roles"] = new_roles

    def set_default_roles(self, count=8):
        default_roles = ['SEER', 'TROUBLEMAKER', 'ROBBER', 'WEREWOLF', 'WEREWOLF']
        while len(default_roles) < count:
            default_roles.append('VILLAGER')
        while len(default_roles) > count:
            default_roles.pop()
        self.settings["roles"] = default_roles

    def get_settings(self):
        role_names = [r.name for r in wf.Role]
        role_names.remove('NOTHING')
        role_names.sort()
        role_dict = Counter(self.settings["roles"])
        for name in role_names:
            if name not in role_dict:
                role_dict[name] = 0
        return {"roles": role_dict}

    '''
    ' players: dictionary with key:value of sid:username(string)
    '''
    def setup_game(self, players):
        self.game = wf.WerewolfGame()
        if not "roles" in self.settings:
            print("Roles not set, using defaults")
            self.set_default_roles()
        roles = self.settings["roles"]
        cards = [wf.Role[role] for role in roles]
        self.game.setup_game(len(players), cards)
        # Matching player names to their ids
        self.playerids = {}
        for i, sid in enumerate(players):
            if sid not in self.playerids:
                self.playerids[sid] = {"pid": i, "username": players[sid]}
            else:
                raise ValueError("Cannot have multiple players with the same name")
            # Everyone must vote for someone, initialize default voting list
            if i+1 < len(self.game.playerCards):
                self.votes[i] = i+1
            else:
                self.votes[i] = 0
        print(self.playerids)
        print(self.votes)
        self.hasGame=True
    '''
    ' Returns information the client needs at the start of the game as a dict with following keys:
    ' role: The role of the card the player is dealt
    ' in_play: which cards are in play
    '''
    def get_start_info(self, sid):
        s_info = {}
        s_info["role"] = self.game.startPlayerCards[self.playerids[sid]["pid"]].to_string(alt=True)
        s_info["in_play"] = [role.to_string(alt=False) for role in self.game.playerCards]
        for ccard in self.game.centerCards:
            s_info["in_play"].append(ccard.to_string(alt=False))
        s_info["in_play"].sort()
        return s_info
    '''
     Returns information about the state of the game in a dictionary:
     has_game: (bool) Whether there is a game live right now (in night or voting phase)
     turn: (string) During night phase, name of the role currently acting
     in_play: list of cards in play
     time_left: seconds left before the turn moves to the next role
    '''
    def get_state(self, devmode=False):
        state_info = {}
        state_info["has_game"] = self.hasGame
        state_info["isNight"] = self.night_in_progress
        if devmode:
            state = self.game.get_state()
            p_roles_names = []
            sp_roles_names = []
            # Add human-readable names
            for pid, role in enumerate(state["pCards"]):
                p_roles_names.append((role, self.lookup_with_pid(pid, False)))
            for pid, sRole in enumerate(state["startPCards"]):
                sp_roles_names.append((sRole, self.lookup_with_pid(pid, False)))
            waiting_names = []
            for wPlayer in state["waiting"]:
                waiting_names.append(self.lookup_with_pid(pid, False))
            state_info["pCards"] = p_roles_names
            state_info["startPCards"] = sp_roles_names
            state_info["waiting_names"] = waiting_names
            state_info["votes"] = self.votes
            state_info["turn"] = state["turn"]
        else:
            state_info["turn"] = self.game.current_turn.name
        state_info["time_left"] = self.timer
        return state_info

    # Accepts strings, ints and card objects
    def set_current_turn(self, role):
        if isinstance(role, str):
            if role.isdigit():
                self.game.start_turn(wf.Role(int(role)))
            else:
                self.game.start_turn(wf.Role[role])
        else:
            self.game.start_turn(wf.Role(role))

    def set_role(self, sid, role):
        self.game.debug_set_role(self.playerids[sid]["pid"], wf.Role[role])

    def night_loop(self, time_per_turn=10):
        if self.night_in_progress:
            raise RuntimeError("Night loop is already in progress")
        self.night_in_progress = True
        print("-- Beginning the night --")
        try:
            while self.game.advance_turn():
                # Announce new turn
                self.broadcast_to_clients()
                turn = self.game.current_turn
                # Send info to players who have a night role, but don't need
                # active input
                if turn in [wf.Role.WEREWOLF, wf.Role.MASON, wf.Role.MINION, wf.Role.INSOMNIAC]:
                    for pid in wf.players_with_role(turn,self.game.startPlayerCards,
                                                    alt=True):
                        sid = self.lookup_with_pid(pid, ret_sid=True)
                        result = self.handle_move(sid, type=turn.name)
                        if result[0]:
                            self.send_to_client(sid, result[1])
                adjusted_time = time_per_turn
                if self.game.current_turn == wf.Role.DOPPELGANGER:
                    adjusted_time += time_per_turn # Doppelganger needs more time to perform their actions
                for i in range(adjusted_time, -1, -1):
                    self.timer = i
                    self.broadcast_to_clients()
                    eventlet.sleep(1)
                    if not self.night_in_progress or not self.hasGame:
                        return
                print("-- Advancing the night --")
            self.night_in_progress = False
        except Exception as e:
            self.night_in_progress = False
            print(f"An unexpected error occurred: {repr(e)}")
        self.broadcast_to_clients()
        print("-- Night finished --")
    '''
    ' params:
    ' sid: the session id of the player making the move
    ' cards: cards involved in move (usernames or center card indexes), expecting list
    ' type: string matching a role
    ' details: additional information for ambiguous situations (eg. seer)
    '
    ' returns: tuple (success (bool), data for client (list))
    '''
    def handle_move(self, sid, cards=None, type=None, details=None):
        if type == None:
            type = self.game.current_turn.name
        if not (type in ["SEER", "WEREWOLF", "ROBBER", "TROUBLEMAKER", "MASON",
                         "MINION", "DRUNK", "INSOMNIAC", "DOPPELGANGER"]):
            return (False, ["Move type not supported"])
        try:
            player_id = self.playerids[sid]["pid"]
            if details:
                doppel = details["doppel"] if "doppel" in details else False
            else:
                doppel = False
            if type == "SEER":
                center = details["center"] if "center" in details else False
                if not center:
                    cards = [self.lookup_with_name(name, ret_sid=False) for name in cards]
                result = self.game.do_seer(player_id, center, cards, doppel_pass=doppel)
                return (True, [role.name for role in result])

            elif type == "TROUBLEMAKER":
                cards = [self.lookup_with_name(name, ret_sid=False) for name in cards]
                self.game.do_troublemaker(player_id, cards, doppel_pass=doppel)
                return (True, [])

            elif type == "WEREWOLF":
                # If a werewolf move includes cards, it is assumed to be an attempt to view a center card
                if cards:
                    return (True, [self.game.do_solo_werewolf(player_id, cards[0]).name])
                else:
                    result = self.game.do_werewolf(player_id)
                    return (True,  self.create_teammate_lookup_response(result))

            elif type == "ROBBER":
                target_id = self.lookup_with_name(cards[0], ret_sid=False)
                return (True, [self.game.do_robber(player_id, target_id, doppel_pass=doppel).name])

            elif type == "MASON":
                result = self.game.do_mason(player_id)
                return (True, self.create_teammate_lookup_response(result))

            elif type == "MINION":
                result = self.game.do_minion(player_id)
                return (True, self.create_teammate_lookup_response(result))

            elif type == "DRUNK":
                self.game.do_drunk(player_id, cards[0], doppel_pass=doppel)
                return (True, [])

            elif type == "INSOMNIAC":
                result = self.game.do_insomniac(player_id)
                return (True, [result])
            
            elif type == "DOPPELGANGER":
                target_id = self.lookup_with_name(cards[0], ret_sid=False)
                result = self.game.do_doppelganger(player_id, target_id)
                return (True, [result])

        except ValueError as ve:
            print("ValueError in handle_move: " + str(ve))
            return (False, ["Invalid input"])
        return (False, ["Unknown error"])

    '''
    ' create_teammate_lookup_response
    ' For roles with a active role of looking up other players with a specific 
    ' role (werewolf, mason, minion)
    ' input: list of teammates' player ids (from a do_role function)
    ' returns a dict that contains:
    '   alone: (bool) whether there are no other teammates
    '   others: (list) list of other teammates' names
    '''
    def create_teammate_lookup_response(self, teammates):
        if not teammates:
            return {"alone": True, "others": []}
        mate_names = [self.lookup_with_pid(pid, False) for pid in teammates]
        return {"alone": False, "others": mate_names}

    def lookup_with_pid(self, pid, ret_sid):
        for key in self.playerids:
            if self.playerids[key]["pid"] == pid:
                if ret_sid:
                    return key
                return self.playerids[key]["username"]

    def lookup_with_name(self, username, ret_sid):
        for key in self.playerids:
            if self.playerids[key]["username"] == username:
                if ret_sid:
                    return key
                return self.playerids[key]["pid"]

    '''
    ' sid: session id
    ' vote_name: target username
    '''
    def register_vote(self, sid, vote_name):
        if self.night_in_progress:
            raise RuntimeError("Cannot register vote while a night is in progress")
        if self.playerids[sid]["username"] == vote_name:
            raise ValueError("Players cannot vote for themselves")
        try:
            voterid = self.playerids[sid]["pid"]
            vote = self.lookup_with_name(vote_name, False)
        except KeyError:
            raise ValueError("Invalid session id")
        if vote is not None:
            self.votes[voterid] = vote
        else:
            raise ValueError(f"Invalid vote: player {vote_name}, id:{vote} not found")
    
    def voting_loop(self, duration=360):
        if self.voting_in_progress:
            raise RuntimeError("Voting is already in progress.")
        self.voting_in_progress=True
        for i in range(duration, -1, -1):
            eventlet.sleep(1)
            self.timer = i
            self.broadcast_to_clients()
            if not self.voting_in_progress or not self.hasGame:
                return
        
    '''
    '   Ends voting phase and calculates winners
    '   Returns a dict with the game results
    '   {
            player_results: (dict) details of every player's results
                key: username, value: (dict){
                    voted_for: (string) who this player voted for
                    votes_received: (int) how many votes this player received
                    eliminated: (bool) did player get eliminated
                    winner: (bool)  did player win
                    role_start: (string) initial role of the player
                    role_end: (string) the player's role after the night
                }
            elims: (list) list of eliminated players' names (for convenience)
            winners: (list) list of eliminated players' names (for convenience)
        }
    '''
    def submit_votes(self):
        if self.night_in_progress:
            raise RuntimeError("Cannot submit votes while night is in progress")
        elims = self.game.count_votes(self.votes)
        winners = self.game.determine_winners(elims)
        player_results = {}
        vote_counts = Counter(self.votes.values())
        for key in self.playerids:
            player = self.playerids[key]
            player_results[player["username"]] = {
                "voted_for": self.lookup_with_pid(self.votes[player["pid"]], ret_sid=False),
                "votes_received": vote_counts[player["pid"]],
                "eliminated": player["pid"] in elims,
                "winner": player["pid"] in winners,
                "role_start": self.game.startPlayerCards[player["pid"]].to_string(alt=True),
                "role_end": self.game.playerCards[player["pid"]].to_string(alt=True)
        }
        winner_names = []
        for winner in winners:
            winner_names.append(self.lookup_with_pid(winner, False))
        elim_names = []
        for elim in elims:
            elim_names.append(self.lookup_with_pid(elim, False))
        return {
            "player_results": player_results,
            "elims": elim_names, 
            "winners": winner_names,
        }


def dummy_bc_func():
    print("Broadcasting data")

def dummy_emit_func(data=""):
    print(f"Sending data: {data}")

if __name__ == '__main__':
    gh = WolfGameHandler(dummy_bc_func,dummy_emit_func)
    players = {
        "abc": "Player 0",
        "asd": "Player 1",
        "wer": "Player 2",
        "vb4": "Player 3",
        "077": "Player 4",        
    }
    gh.setup_game(players)
    gh.game.print_status()
    print(gh.submit_votes())