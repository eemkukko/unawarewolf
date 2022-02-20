from enum import Enum
import random
from copy import deepcopy

class Role(Enum):
    NOTHING = 0
    VILLAGER = 1
    WEREWOLF = 2
    SEER = 3
    TROUBLEMAKER = 4
    ROBBER = 5
    HUNTER = 6
    TANNER = 7
    MINION = 8
    MASON = 9
    DRUNK = 10
    INSOMNIAC = 11
    DOPPELGANGER = 12

class Card():
    def __init__(self, role, alt_role=Role.NOTHING):
        self.role = role
        self.alt_role = alt_role # Used for classes with multiple roles, such as Doppelganger
        self.tokens = [] # Token mechanics not implemented
    
    def to_string(self, alt=False):
        name_string = self.role.name
        if self.alt_role != Role.NOTHING and alt:
            name_string += "-" + self.alt_role.name
        return name_string

''' Returns a list of player ids that match a role in a given list of cards
'   alt: (bool) Whether the alternative role of the class should be considered
'''
def players_with_role(role, pCards, alt=False):
    if alt:
        return[id for id, card in enumerate(pCards) if role in (card.role, card.alt_role)]
    return [id for id, card in enumerate(pCards) if card.role == role]

'''
' WerewolfGame
' Stores information about the state of a werewolf game, handles state transitions
'''
class WerewolfGame:

    def __init__(self):
        # Card arrays are lists of Card objects. Order of cards is important(!),
        # As it determines which player holds which card
        self.playerCards = []
        self.centerCards = []
        self.startPlayerCards = []
        self.NIGHT_PRIORITIES = (Role.DOPPELGANGER, Role.WEREWOLF, Role.MINION, Role.MASON,
            Role.SEER, Role.ROBBER, Role.TROUBLEMAKER, Role.DRUNK, Role.INSOMNIAC)
        self.current_turn = Role.NOTHING
        self.unfinished_players = []
        # Optional rules, disabled by default
        self.house_rules = {
            "minionkill":     False, # If there are no werewolves and a minion gets killed, the villagers win
            "tannerwinsteal": False, # If a tanner dies, everyone else loses 
            "doubletransform": False # If a doppelganger picks another doppelganger during the night, they will copy their transformation (if any)
        }
    '''
    ' setup_game: Randomly deals cards to each player and sets center cards
    ' player_count (int): How many players will participate
    ' roles (list of Roles): List of roles to be used in game. Repeating a role
    ' implies that multiple cards will have the same role. Any roles left over
    ' after dealing player cards will be used as center cards.
    '''
    def setup_game(self, player_count, roles):
        if player_count < 3:
            raise ValueError("Not enough players to start game  (need at least 3).")
        if len(roles) < player_count:
            raise ValueError('Not enough cards for all players.')
        for i in range(player_count):
            self.playerCards.append(Card(role=roles.pop(random.randint(0, len(roles) - 1))))
        self.startPlayerCards = deepcopy(self.playerCards)
        # Order of center cards should be randomized too
        while roles:
            self.centerCards.append(Card(role=roles.pop(random.randint(0, len(roles)-1))))
        self.current_turn = Role.NOTHING

    '''
    ' Returns a dict with current game state
    ' Cards are represented with strings describing of their names
    '''
    def get_state(self):
        pCards = []
        cCards = []
        spCards = []
        inPlay = []
        for pCard in self.playerCards:
            pCards.append(pCard.to_string(alt=True))
        for cCard in self.centerCards:
            cCards.append(cCard.to_string(alt=True))
        for spCard in self.startPlayerCards:
            spCards.append(spCard.to_string(alt=True))
        # Cards in play must be sorted, otherwise it inadvertently reveals which players hold which cards
        inPlay.sort()
        return {"pCards": pCards,
                "cCards": cCards,
                "startPCards": spCards,
                "turn": self.current_turn.name,
                "waiting": self.unfinished_players
                }

    def print_status(self):
        if len(self.playerCards) > 0:
            for i, playerCard in enumerate(self.playerCards):
                print(f"Player {i} is: {playerCard.to_string()}")
        else:
            print("No players are in the game")
        if len(self.centerCards) > 0:
            for i, cCard in enumerate(self.centerCards):
                print(f"Center card {i}: {cCard.to_string()}")
        else:
            print("There are no center cards")

    '''
    ' do_doppelganger
    ' target: target player's id (int)
    ' implements the first stage of the doppelganger action (transformation)
    ' the new form of the doppelganger is stored as alt_role in the Card object
    ' The new form is also returned as Role object
    ' 
    ' Note: when implementing the secondary actions SEER, ROBBER, TROUBLEMAKER and DRUNK
    ' use their respective functions with the doppel_pass set to True.
    '''
    def do_doppelganger(self, player_id, target):
        if self.current_turn != Role.DOPPELGANGER:
            raise ValueError('It is not the doppelganger turn')
        if not(player_id in self.unfinished_players):
            raise ValueError('Player does not have the right to make this move')
        card = self.playerCards[target]
        new_role = card.role
        if new_role==Role.DOPPELGANGER and self.house_rules["doubletransform"]:
            if card.alt_role != Role.NOTHING:
                new_role = card.alt_role
        self.startPlayerCards[player_id].alt_role = new_role
        self.playerCards[player_id].alt_role = new_role
        if not new_role in (Role.SEER, Role.ROBBER, Role.TROUBLEMAKER, Role.DRUNK):
            self.unfinished_players.remove(player_id)
        return card.to_string()

    '''
    ' do_werewolf
    ' player_id, choice should be ints
    ' returns a list of other players' ids that are also werewolves (empty if alone)
    '''
    def do_werewolf(self, player_id):
        if self.current_turn != Role.WEREWOLF:
            raise ValueError('It is not the werewolf turn')
        if not(player_id in self.unfinished_players):
            raise ValueError('Player does not have the right to make this move')
        others = players_with_role(Role.WEREWOLF, self.startPlayerCards, alt=True)
        others.remove(player_id)
        # If there are no other wolves, lone wolf must first make their solo move before being finished
        if others:
            self.unfinished_players.remove(player_id)
        return others
    
    '''
    ' do_solo_werewolf
    ' used when a player is the only werewolf, to see a center card
    ' choice should correspond to a center card   
    ' returns the primary role of the card viewed
    '''
    def do_solo_werewolf(self, player_id, choice=0):
        if self.current_turn != Role.WEREWOLF:
            raise ValueError('It is not the werewolf turn')
        wolves = players_with_role(Role.WEREWOLF, self.startPlayerCards, alt=True)
        if (player_id in self.unfinished_players) and len(wolves)==1 and len(self.centerCards)>choice>=0:
            self.unfinished_players.remove(player_id)
            return self.centerCards[choice].role
        raise ValueError('Invalid move')

    '''
    ' do_minion
    ' returns a list of werewolves' player ids
    '''
    def do_minion(self, player_id):
        if self.current_turn != Role.MINION:
            raise ValueError('It is not the minion turn')
        if player_id not in self.unfinished_players:
            raise ValueError('Player does not have the right to make this move')
        self.unfinished_players.remove(player_id)
        return players_with_role(Role.WEREWOLF, self.startPlayerCards, alt=True)
    '''
    ' do_mason
    ' returns a list of other masons' ids
    '''
    def do_mason(self, player_id):
        if self.current_turn != Role.MASON:
            raise ValueError('It is not the mason turn')
        if player_id not in self.unfinished_players:
            raise ValueError('Player does not have the right to make this move')
        self.unfinished_players.remove(player_id)
        others = players_with_role(Role.MASON, self.startPlayerCards, alt=True)
        others.remove(player_id)
        return others
    
    '''
    ' choices: list of ints matching card ids
    ' return list of roles (string) that were seen
    '''
    def do_seer(self, player_id, see_center, choices, doppel_pass=False):
        if self.current_turn != Role.SEER and not doppel_pass:
            raise ValueError('It is not the seer turn')
        if not(player_id in self.unfinished_players):
            raise ValueError('Player does not have the right to make this move')
        try:
            if see_center:
                if len(self.centerCards) > 1:
                    result = [self.centerCards[choices[0]].role, self.centerCards[choices[1]].role]
                elif len(self.centerCards) == 1:
                    result = [self.centerCards[choices[0]].role]
                else:
                    raise ValueError('Invalid selection: no center cards')
            elif choices[0] != player_id:
                result = [self.playerCards[choices[0]].role]
            else:
                raise ValueError('Player may not look at their own card')
            self.unfinished_players.remove(player_id)
            return result
        except IndexError:
            raise ValueError('Invalid selection')
    
    '''
    ' Target should be an id (int)
    ' returns the newly acquired role (string)
    '''
    def do_robber(self, player_id, target, doppel_pass=False):
        if self.current_turn != Role.ROBBER and not doppel_pass:
            raise ValueError('It is not the robber turn')
        if not(player_id in self.unfinished_players):
            raise ValueError('Player does not have the right to make this move')
        if player_id == target:
            raise ValueError("Robber cannot rob self")
        try:
            new_role = self.playerCards[target].role
            self.swapPlayerCards(player_id, target)
            self.unfinished_players.remove(player_id)
            return new_role
        except IndexError:
            raise ValueError("Invalid selection")

    '''
    ' Choices should be a list/tuple that has a length of exactly 2 
    ' (the ids of players whose cards are to be swapped)
    '''
    def do_troublemaker(self, player_id, choices, doppel_pass=False):
        if self.current_turn != Role.TROUBLEMAKER and not doppel_pass:
            raise ValueError('It is not the troublemaker turn')
        if not(player_id in self.unfinished_players):
            raise ValueError('Player does not have the right to make this move')
        if len(self.playerCards) < 3:
            # Troublemaker has no legal swaps, turn is skipped
            self.unfinished_players.remove(player_id)
            return
        if (player_id in choices) or (len(choices) != 2) or (choices[0] == choices[1]):
            raise ValueError('Invalid cards selected')
        try:
            self.swapPlayerCards(choices[0], choices[1])
            self.unfinished_players.remove(player_id)
        except IndexError:
            raise ValueError("Invalid selection")

    '''
    ' do_drunk
    ' target should be the id of a center card
    ' returns nothing
    '''
    def do_drunk(self, player_id, target, doppel_pass=False):
        if self.current_turn != Role.DRUNK and not doppel_pass:
            raise ValueError('It is not the drunk turn')
        if not(player_id in self.unfinished_players):
            raise ValueError('Player does not have the right to make this move')
        self.swapWithCenterCard(player_id, target)
        self.unfinished_players.remove(player_id)

    '''
    ' do_insomniac
    ' returns the name of the role (string) that the insomniac's card has
    '''
    def do_insomniac(self, player_id):
        if self.current_turn != Role.INSOMNIAC:
            raise ValueError('It is not the insomniac turn')
        if not(player_id in self.unfinished_players):
            raise ValueError('Player does not have the right to make this move')
        self.unfinished_players.remove(player_id)
        return self.playerCards[player_id].role.name

    def swapPlayerCards(self, p1_id, p2_id):
        self.playerCards[p1_id], self.playerCards[p2_id] = self.playerCards[p2_id], self.playerCards[p1_id]
    
    def swapWithCenterCard(self, p1_id, c1_id):
        self.playerCards[p1_id], self.centerCards[c1_id] = self.centerCards[c1_id], self.playerCards[p1_id]


    def start_turn(self, role):
        alt = not role in (Role.SEER, Role.ROBBER, Role.TROUBLEMAKER, Role.DRUNK)
        self.unfinished_players = players_with_role(role, self.startPlayerCards, alt=alt)
        self.current_turn = role

    # For development purposes: pid= player id (int), role (Role object)
    def debug_set_role(self, pid, role, alt=None):
        self.playerCards[pid].role = role
        self.startPlayerCards[pid].role = role
        if alt:
            self.playerCards[pid].alt_role = alt
            self.startPlayerCards[pid].alt_role = alt

    # returns True when night is not over, false after getting to the end
    def advance_turn(self):
        if self.current_turn == Role.NOTHING:
            ind = -1
        else:
            ind = self.NIGHT_PRIORITIES.index(self.current_turn)
        if len(self.NIGHT_PRIORITIES) == ind+1:
            self.current_turn = Role.NOTHING
            return False # Night finished
        for i in range(ind, len(self.NIGHT_PRIORITIES)-1):
            role = self.NIGHT_PRIORITIES[i+1]
            # Check if role is in play
            in_play = self.centerCards + self.playerCards
            if role in [c.role for c in in_play]:
                self.start_turn(role)
                return True
        self.current_turn = Role.NOTHING
        return False

    '''
    ' votes: {voter_pid : target_pid}
    ' returns a list of player ids of those eliminated
    ' Takes into account hunter kills
    '''
    def count_votes(self, votes):
        # Determine who gets eliminated
        curr_max = 0
        candidates = {}
        eliminated = []
        for voter in votes:
            if votes[voter] in candidates:
                candidates[votes[voter]] += 1
            else:
                candidates[votes[voter]] = 1
            if curr_max < candidates[votes[voter]]:
                curr_max = candidates[votes[voter]]
                eliminated.clear()
                eliminated.append(votes[voter])
            elif curr_max == candidates[votes[voter]]:
                # If players tie for most votes, they all get eliminated
                eliminated.append(votes[voter])
        # If no player receives more than 1 vote, nobody gets eliminated
        if curr_max == 1:
            eliminated.clear()

        # If a hunter gets eliminated, the person they voted for also get eliminated
        # Note: this while loop also checks if the "hunted" player was a hunter
        i = 0
        while i < len(eliminated):
            if eliminated[i] in players_with_role(Role.HUNTER, self.playerCards, alt=True):
                if not votes[eliminated[i]] in eliminated:
                    eliminated.append(votes[eliminated[i]])
            i += 1
        return eliminated

    '''
    ' eliminated: list of player ids
    ' returns a list of player ids of those who won
    '''
    def determine_winners(self, eliminated):
        winners = []
        wolf_down = False
        tanner_down = False
        minion_down = False
        if players_with_role(Role.WEREWOLF, self.playerCards, alt=True):
            wolf_in_game = True
        else:
            wolf_in_game = False

        for pid in eliminated:
            p_role = self.playerCards[pid].role
            if p_role == Role.DOPPELGANGER:
                p_role = self.playerCards[pid].alt_role # Copied role
            if p_role  == Role.TANNER:
                tanner_down = True
                winners.append(pid) # Tanner always wins when killed
            elif p_role == Role.WEREWOLF:
                wolf_down = True
            elif p_role == Role.MINION:
                minion_down = True
        # HOUSE RULE: If tanner(s) die, nobody else can win anymore
        if self.house_rules['tannerwinsteal'] and tanner_down:
            return winners 
        villagers = []
        wolf_apologists = []
        for pid, player in enumerate(self.playerCards):
            p_role = player.role
            if p_role == Role.DOPPELGANGER:
                p_role =  self.playerCards[pid].alt_role # Copied role
            if p_role not in [Role.WEREWOLF, Role.MINION, Role.TANNER]:
                villagers.append(pid)
            elif p_role != Role.TANNER:
                wolf_apologists.append(pid)
        if wolf_down:
            winners += villagers # If a wolf gets killed, villagers win no matter what
        elif not wolf_in_game and not eliminated:
            winners += villagers # If no wolf in game and nobody dies, villager victory
        elif wolf_in_game and not wolf_down and not tanner_down:
            winners += wolf_apologists # If a wolf is in a game but doesn't get killed, the wolf team wins
        elif not wolf_in_game and eliminated and not tanner_down:
            # Lone minion win, assumes only minions can be left in wolf_apologists
            winners += [minion for minion in wolf_apologists if minion not in eliminated]
        # HOUSE RULE: if there are no wolves but there is a minion, villagers can kill the minion to win
        elif self.house_rules['minionkill'] and not wolf_in_game and minion_down:
            winners += villagers
        return winners


if __name__ == '__main__':
    game = WerewolfGame()
    game.startPlayerCards = [Card(Role.DOPPELGANGER),Card(Role.VILLAGER),Card(Role.MASON),Card(Role.VILLAGER),Card(Role.WEREWOLF),Card(Role.VILLAGER),Card(Role.MINION)]
    game.playerCards = [Card(Role.DOPPELGANGER),Card(Role.VILLAGER),Card(Role.MASON),Card(Role.VILLAGER),Card(Role.WEREWOLF),Card(Role.VILLAGER),Card(Role.MINION)]
    game.start_turn(Role.DOPPELGANGER)
    print(game.do_doppelganger(0,2))
    print(game.startPlayerCards[0].to_string(alt=True))
    game.start_turn(Role.MASON)
    print(game.unfinished_players)
    print(game.do_mason(2))
    print(game.do_mason(0))
    '''
    votes = {0: 6,
             1: 6,
             2: 3,
             3: 4,
             4: 5,
             5: 0,
             6: 1}
    '''
    #print("Eliminated players: "+ str(game.count_votes(votes)))
    #print("Winners: " + str(game.determine_winners(game.count_votes(votes))))

