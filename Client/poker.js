/*
If you improve this software or find a bug, please let me know: orciu@users.sourceforge.net
Project home page: http://sourceforge.net/projects/jsholdem/
*/
"use strict";

//var cards = new Array(52);

var SERVER_STATE = {
  CMD: "",
  CMD_PARMS: "",
  NUM_ROUNDS: 0,
  TO_CALL: 0,
  STARTING_BANKROLL: 1000,
  SMALL_BLIND: 0,
  BIG_BLIND: 0,
  BG_HILITE: 'gold',
  cards: new Array(52),
  players: new Array,
  board: new Array(),
  deck_index: 0,
  button_index: 0,
  current_bettor_index: 0, 
  current_bet_amount: 0, 
  current_total_bet: 0,
  current_min_raise: 0,
  current_pot: 0
}



function player (name, bankroll, carda, cardb, status, total_bet,
                 subtotal_bet) {
  this.name = name;
  this.bankroll = bankroll;
  this.carda = carda;
  this.cardb = cardb;
  this.status = status;
  this.total_bet = total_bet;
  this.subtotal_bet = subtotal_bet;
}

function init () {
  cl_init();  //not sure how else to do this, eventually this will be started from client html onload

  make_deck();
}

function make_deck () {
  var i;
  var j = 0;
  for (i = 2; i < 15; i++) {
    SERVER_STATE.cards[j++] = "h" + i;
    SERVER_STATE.cards[j++] = "d" + i;
    SERVER_STATE.cards[j++] = "c" + i;
    SERVER_STATE.cards[j++] = "s" + i;
  }
}

function clear_player_cards (count) {
  count = count;
  for (var pl = 0; pl < count; ++pl) {
  }
}

function add_new_player (current_state) {
  
  if (SERVER_STATE.players.length == 0) { //first player
    SERVER_STATE.players[0] = new player(current_state.CMD_PARMS, 1000, "", "", "", 0, 0);
  }
  else if (SERVER_STATE.players.length < 10) { //can't have more than 10 players
    var dup = false;
    for (var n=0; n<SERVER_STATE.players.length; n++) { //look for a player with duplicate name
      if (SERVER_STATE.players[n].name == current_state.CMD_PARMS) { 
        dup = true; 
        send_game_response("Player tried to join with duplicate name, use different name");
        return(0);
      }
    }
    if (!dup) {   //don't add player with duplicate name
      SERVER_STATE.players[SERVER_STATE.players.length] = new player(current_state.CMD_PARMS, 1000, "", "", "", 0, 0);
    }
  }
  else{
    send_game_response("Player tried to join a full game. No more than 10 players allowed");
    return(0);
  }
  return(1);
}

function compRan () {
  return 0.5 - Math.random();
}

function new_game () {
  SERVER_STATE.NUM_ROUNDS = 0;
  SERVER_STATE.HUMAN_WINS_AGAIN = 0;
  reset_player_statuses(0);
  clear_bets();
  SERVER_STATE.button_index = Math.floor(Math.random() * SERVER_STATE.players.length);
  SERVER_STATE.players.sort(compRan);
  new_round();
}

function number_of_active_players () {
  var num_playing = 0;
  var i;
  for (i = 0; i < SERVER_STATE.players.length; i++) {
    if (has_money(i)) {
      num_playing += 1;
    }
  }
  return num_playing;
}

function new_round () {
  SERVER_STATE.NUM_ROUNDS++;
  var num_playing = number_of_active_players();
  if (num_playing < 2) return;
   
  reset_player_statuses(1);
  clear_bets();
  clear_pot();
  SERVER_STATE.current_min_raise = 0;
  collect_cards();
  SERVER_STATE.button_index = get_next_player_position(SERVER_STATE.button_index, 1);
  shuffle();
  blinds_and_deal();
}

function collect_cards () {
  SERVER_STATE.board = new Array(6);
  for (var i = 0; i < SERVER_STATE.players.length; i++) {
    SERVER_STATE.players[i].carda = "";
    SERVER_STATE.players[i].cardb = "";
    SERVER_STATE.board[0] = "";    
    SERVER_STATE.board[1] = "";
    SERVER_STATE.board[2] = "";
    SERVER_STATE.board[3] = "";
    SERVER_STATE.board[4] = "";
  }   
  for (i = 0; i < SERVER_STATE.board.length; i++) {
    if (i > 4) {        // board.length != 5
      continue;
    }
    SERVER_STATE.board[i] = "";
    gui_lay_board_card(i, SERVER_STATE.board[i]);     // Clear the board
  }
  for (i = 0; i < 3; i++) {
    SERVER_STATE.board[i] = "";
    gui_burn_board_card(i, SERVER_STATE.board[i]);
  }
}

function get_random_int(max) {
  return Math.floor(Math.random() * max);
}

function new_shuffle () {
  var len = SERVER_STATE.cards.length;
  for (var i = 0; i < len; ++i) {
    var j = i + get_random_int(len - i);
    var tmp = SERVER_STATE.cards[i];
    SERVER_STATE.cards[i] = SERVER_STATE.cards[j];
    SERVER_STATE.cards[j] = tmp;
  }
}

function shuffle () {
  new_shuffle();
  SERVER_STATE.deck_index = 0;
}

function blinds_and_deal () {
  SERVER_STATE.SMALL_BLIND = 5;
  SERVER_STATE.BIG_BLIND = 10; 
  var num_playing = number_of_active_players();

  var small_blind = get_next_player_position(SERVER_STATE.button_index, 1);
  the_bet_function(small_blind, SERVER_STATE.SMALL_BLIND);

  var big_blind = get_next_player_position(small_blind, 1);
  the_bet_function(big_blind, SERVER_STATE.BIG_BLIND);

  SERVER_STATE.players[big_blind].status = "OPTION";
  SERVER_STATE.current_bettor_index = get_next_player_position(big_blind, 1);
  SERVER_STATE.current_total_bet = SERVER_STATE.BIG_BLIND;
  deal_and_write_a();
}

function deal_and_write_a () {
  var current_player;
  var start_player;

  start_player = current_player = get_next_player_position(SERVER_STATE.button_index, 1);

  // Deal cards to players still active
  do {
    SERVER_STATE.players[current_player].carda = SERVER_STATE.cards[SERVER_STATE.deck_index++];
    current_player = get_next_player_position(current_player, 1);
  } while (current_player != start_player);
  
  deal_and_write_b();
}

function deal_and_write_b () {
  var current_player;
  var start_player;

  start_player = current_player = get_next_player_position(SERVER_STATE.button_index, 1);

  // Deal SERVER_STATE.cards to players still active
  do {
    SERVER_STATE.players[current_player].cardb = SERVER_STATE.cards[SERVER_STATE.deck_index++];
    current_player = get_next_player_position(current_player, 1);
  } while (current_player != start_player);

  //first player to act is button position + 3
  SERVER_STATE.current_bettor_index = get_next_player_position(SERVER_STATE.button_index, 3);
}

function deal_flop () {
  var burn = SERVER_STATE.cards[SERVER_STATE.deck_index++];

  for (var i = 0; i < 3; i++) {
    SERVER_STATE.board[i] = SERVER_STATE.cards[SERVER_STATE.deck_index++];
  }
  get_next_action_seat();
}

function deal_fourth () {
  var burn = SERVER_STATE.cards[SERVER_STATE.deck_index++];
  SERVER_STATE.board[3] = SERVER_STATE.cards[SERVER_STATE.deck_index++];
  get_next_action_seat();
}

function deal_fifth () {
  var burn = SERVER_STATE.cards[SERVER_STATE.deck_index++];
  SERVER_STATE.board[4] = SERVER_STATE.cards[SERVER_STATE.deck_index++];
  get_next_action_seat();
}

function get_next_action_seat() {
  SERVER_STATE.current_bettor_index = get_next_player_position(SERVER_STATE.button_index,1);
}

var global_pot_remainder = 0;

function handle_end_of_round () {
  var candidates = new Array(SERVER_STATE.players.length);
  var allocations = new Array(SERVER_STATE.players.length);
  var winning_hands = new Array(SERVER_STATE.players.length);
  var my_total_bets_per_player = new Array(SERVER_STATE.players.length);

  // Clear the ones that folded or are busted
  var i;
  var still_active_candidates = 0;
  for (i = 0; i < candidates.length; i++) {
    allocations[i] = 0;
    my_total_bets_per_player[i] = SERVER_STATE.players[i].total_bet;
    if (SERVER_STATE.players[i].status != "FOLD" && SERVER_STATE.players[i].status != "BUST") {
      candidates[i] = SERVER_STATE.players[i];
      still_active_candidates += 1;
    }
  }

  var my_total_pot_size = get_pot_size();
  var my_best_hand_name = "";
  var best_hand_players;
  var current_pot_to_split = 0;
  var pot_remainder = 0;
  if (global_pot_remainder) {   //  Can never get here????
    //gui_log_to_history("transferring pot remainder " + global_pot_remainder);
    pot_remainder = global_pot_remainder;
    my_total_pot_size += global_pot_remainder;
    global_pot_remainder = 0;
  }

  while (my_total_pot_size > (pot_remainder + 0.01) && still_active_candidates) {
//    //gui_log_to_history("splitting pot with pot " + my_total_pot_size +
//                       " and remainder " + pot_remainder +
//                       " on " + still_active_candidates + " candidates" );

    // The first round all who not folded or busted are candidates
    // If that/ose winner(s) cannot get all of the pot then we try
    // with the remaining players until the pot is emptied
    var winners = get_winners(candidates);
    if (!best_hand_players) {
      best_hand_players = winners;
    }
    if (!winners) {
      pot_remainder = my_total_pot_size;
      my_total_pot_size = 0;
      break;
    }

    // Get the lowest winner bet, e.g. an all-in
    var lowest_winner_bet = my_total_pot_size * 2;
    var num_winners = 0;
    for (i = 0; i < winners.length; i++) {
      if (!winners[i]) { // Only the winners bets
        continue;
      }
      if (!my_best_hand_name) {
        my_best_hand_name = winners[i]["hand_name"];
      }
      num_winners++;
      if (my_total_bets_per_player[i] < lowest_winner_bet) {
        lowest_winner_bet = my_total_bets_per_player[i];
      }
    }

    // Compose the pot
    // If your bet was less than (a fold) or equal to the lowest winner bet:
    //    then add it to the current pot
    // If your bet was greater than lowest:
    //    then just take the 'lowest_winner_bet' to the pot

    // Take in any fraction from a previous split
//    if (pot_remainder) {
//      //gui_log_to_history("increasing current pot with remainder " + pot_remainder);
//    }
    current_pot_to_split = pot_remainder;
    pot_remainder = 0;

    for (i = 0; i < SERVER_STATE.players.length; i++) {
      if (lowest_winner_bet >= my_total_bets_per_player[i]) {
        current_pot_to_split += my_total_bets_per_player[i];
        my_total_bets_per_player[i] = 0;
      } else {
        current_pot_to_split += lowest_winner_bet;
        my_total_bets_per_player[i] -= lowest_winner_bet;
      }
    }

    // Divide the pot - in even integrals
//    //gui_log_to_history("Divide the pot " + current_pot_to_split +
//                       " on " + num_winners + " winner(s)");
    var share = Math.floor(current_pot_to_split / num_winners);
    // and save any remainders to next round
    pot_remainder = current_pot_to_split - share * num_winners;

//    //gui_log_to_history("share " + share + " remainder " + pot_remainder);

    for (i = 0; i < winners.length; i++) {
      if (my_total_bets_per_player[i] < 0.01) {
        candidates[i] = null;           // You have got your share
      }
      if (!winners[i]) {                // You should not have any
        continue;
      }
      my_total_pot_size -= share;       // Take from the pot
      allocations[i] += share;          // and give to the winners
      winning_hands[i] = winners[i].hand_name;
    }

    // Iterate until pot size is zero - or no more candidates
    for (i = 0; i < candidates.length; i++) {
      if (candidates[i] == null) {
        continue;
      }
      still_active_candidates += 1
    }
    if (still_active_candidates == 0) {
      pot_remainder = my_total_pot_size;
//      //gui_log_to_history("no more candidates, pot_remainder " + pot_remainder);
    }
    //gui_log_to_history("End of iteration");
  } // End of pot distribution

  global_pot_remainder = pot_remainder;
//  //gui_log_to_history("distributed; global_pot_remainder: " +
//                     global_pot_remainder +
//                     " pot_remainder: " + pot_remainder);
  pot_remainder = 0;
  var winner_text = "";
  var human_loses = 0;
  // Distribute the pot - and then do too many things
  for (i = 0; i < allocations.length; i++) {
    if (allocations[i] > 0) {
      var a_string = "" + allocations[i];
      var dot_index = a_string.indexOf(".");
      if (dot_index > 0) {
        a_string = "" + a_string + "00";
        allocations[i] = a_string.substring(0, dot_index + 3) - 0;
      }
      //winner_text += winning_hands[i] + " gives " + allocations[i] +
      //               " to " + SERVER_STATE.players[i].name + ". ";

      winner_text += SERVER_STATE.players[i].name + " wins " + allocations[i] + " with " + 
                    winning_hands[i] + ". ";

      SERVER_STATE.players[i].bankroll += allocations[i];
      if (best_hand_players[i]) {
        // function write_player(n, hilite, show_cards)
        //write_player(i, 2, 1);
      } else {
        //write_player(i, 1, 1);
      }
    } else {
      if (!has_money(i) && SERVER_STATE.players[i].status != "BUST") {
        SERVER_STATE.players[i].status = "BUST";
        if (i == 0) {
          //human_loses = 1; //this used to end game
        }
      }
      if (SERVER_STATE.players[i].status != "FOLD") {
        //write_player(i, 0, 1);
      }
    }
  }

  var num_playing = number_of_active_players();
  if (num_playing < 2) {
    // Convoluted way of finding the active player and give him the pot
    for (i = 0; i < SERVER_STATE.players.length; i++) {
      // For whosoever hath, to him shall be given
      if (has_money(i)) {
        SERVER_STATE.players[i].bankroll += pot_remainder;
        pot_remainder = 0;
      }
    }
  }
  var hi_lite_color = gui_get_theme_mode_highlite_color();
  var html = "<html><body topmargin=2 bottommargin=0 bgcolor=" + SERVER_STATE.BG_HILITE +
             " onload='document.f.c.focus();'>" +
             get_pot_size_html() +
             "  <font size=+2 color=" + hi_lite_color +
             "><b>Winning: " +
             winner_text + "</b></font><br>";

             /* var html = "<html><body topmargin=2 bottommargin=0 bgcolor=" + BG_HILITE +
             " onload='document.f.c.focus();'><table><tr><td>" +
             get_pot_size_html() +
             "</td></tr></table><br><font size=+2 color=" + hi_lite_color +
             "><b>Winning: " +
             winner_text + "</b></font><br>"; */

  //gui_write_game_response(html);
  SERVER_STATE.CMD_PARMS = html; //winner_text;
}


function the_bet_function (player_index, bet_amount) {
//make sure previous player didn't go allin with less than previous bet
  if (SERVER_STATE.current_bet_amount < bet_amount) { 
    SERVER_STATE.current_bet_amount = bet_amount;
  }
  if (SERVER_STATE.current_min_raise < (bet_amount * 2)) {  //need to recheck this logic
    SERVER_STATE.current_min_raise = bet_amount;
  }
  SERVER_STATE.players[player_index].subtotal_bet += bet_amount;
  SERVER_STATE.players[player_index].total_bet += bet_amount;
  SERVER_STATE.players[player_index].bankroll -= bet_amount;
  var current_pot_size = get_pot_size();
  return 1;
}

function make_readable_rank (r) {
  if (r < 11) {
    return r;
  } else if (r == 11) {
    return "J";
  } else if (r == 12) {
    return "Q";
  } else if (r == 13) {
    return "K";
  } else if (r == 14) {
    return "A";
  }
}

function get_pot_size () {
  var p = 0;
  for (var i = 0; i < SERVER_STATE.players.length; i++) {
    p += SERVER_STATE.players[i].total_bet; // + SERVER_STATE.players[i].subtotal_bet;
  }
  p += global_pot_remainder;
  return p;
}

function get_pot_size_html () {
  return "<font size=+2><b>TOTAL POT: " + get_pot_size() + "</b><br></font>";
}

function pot_is_good() {
  var good = true;
  for (var n=0; n<LOCAL_STATE.players.length-1; n++) {
    if ((LOCAL_STATE.players[n].status != "FOLD") &&
         (LOCAL_STATE.players[n].status != "BUST") &&
         (LOCAL_STATE.players[n].status != "ALL IN")) {
      if (LOCAL_STATE.players[n].total_bet != LOCAL_STATE.current_total_bet) {
        good = false
      }
    }
  }
  return good;
}

function clear_bets () {
  for (var i = 0; i < SERVER_STATE.players.length; i++) {
    SERVER_STATE.players[i].subtotal_bet = 0;
  }
  SERVER_STATE.current_bet_amount = 0;
  SERVER_STATE.current_total_bet = 0;
  SERVER_STATE.current_min_raise = 0;
  SERVER_STATE.current_pot = 0;
  SERVER_STATE.TO_CALL = 0;
}

function clear_pot () {
  for (var i = 0; i < SERVER_STATE.players.length; i++) {
    SERVER_STATE.players[i].total_bet = 0;
  }
}

function reset_player_statuses (type) {
  for (var i = 0; i < SERVER_STATE.players.length; i++) {
    if (type == 0) {
      SERVER_STATE.players[i].status = "";
    } else if (type == 1 && 
              SERVER_STATE.players[i].status != "BUST") {
        SERVER_STATE.players[i].status = "";
    } else if (type == 2 &&
               SERVER_STATE.players[i].status != "FOLD" &&
               SERVER_STATE.players[i].status != "BUST" &&
               SERVER_STATE.players[i].status != "ALL IN") {
        SERVER_STATE.players[i].status = "";
    }
  }
}

function get_num_betting () {
  var n = 0;
  for (var i = 0; i < SERVER_STATE.players.length; i++) {
    if (SERVER_STATE.players[i].status != "FOLD" &&
        SERVER_STATE.players[i].status != "BUST" &&
        has_money(i)) {
      n++;
    }
  }
  return n;
}

function get_next_player_position (i, delta) {
  var j = 0;
  var step = 1;
  if (delta < 0) step = -1;

  var loop_on = 0;
  do {
    i += step;
    if (i >= SERVER_STATE.players.length) {
      i = 0;
    } else {
      if (i < 0) {
        i = SERVER_STATE.players.length - 1;
      }
    }

    // Check if we can stop
    loop_on = 0;
    if (SERVER_STATE.players[i].status == "BUST") loop_on = 1;
    if (SERVER_STATE.players[i].status == "FOLD") loop_on = 1;
    if (++j < delta) loop_on = 1;
  } while (loop_on);

  return i;
}

function has_money (i) {
  if (SERVER_STATE.players[i].bankroll >= 0.01) {
    return true;
  }
  return false;
}

function betting_is_done() {  //this is done before we move to next player so see if next player has OPTION
  var done = true;            //if any statuses are "" than we have not been around once yet
                              //and check that each players total bet is the same for this round OR
                              //if all active players are ALL IN

  //if each players total bet amount is the same then pot is good, 
  if (!pot_is_good()) { 
    done = false; 
  }
  //but if current player has OPTION (BB in first round) then betting is still not done
  else if (SERVER_STATE.players[get_next_player_position(SERVER_STATE.current_bettor_index, 1)].status == "OPTION")
    { done = false; }
  //and if any players status is "" then we haven't been completely around once in this round so keep betting
  for (var n = 0; n < SERVER_STATE.players.length; n++) {
    if (SERVER_STATE.players[n].status == "") {
      done = false;
    }
    
    if ((SERVER_STATE.players[n].status != "FOLD") && (SERVER_STATE.players[n].status != "BUST")) {
      if (SERVER_STATE.players[n].total_bet != SERVER_STATE.current_total_bet) {
        done = false;
      }
    }
    
    //Ok, all else being checked, if every active player is ALL IN then pot is good
    var num_allin_or_fold_or_bust = 0;
    for (var i = 0; i < SERVER_STATE.players.length; i++) {
      if ((SERVER_STATE.players[i].status == "ALL IN") ||
          (SERVER_STATE.players[i].status == "FOLD") ||
          (SERVER_STATE.players[i].status == "BUST")) {
            num_allin_or_fold_or_bust++;
      }
      if (num_allin_or_fold_or_bust == SERVER_STATE.players.length) {
        done = true;
      }
    }
  }
  return done;
}

function set_to_call() { 

  if (SERVER_STATE.current_total_bet > SERVER_STATE.players[SERVER_STATE.current_bettor_index].bankroll) {
    SERVER_STATE.TO_CALL = SERVER_STATE.players[SERVER_STATE.current_bettor_index].bankroll;
  }
  else {
  SERVER_STATE.TO_CALL = SERVER_STATE.current_total_bet - 
                          SERVER_STATE.players[SERVER_STATE.current_bettor_index].total_bet;
  }
}

function compRan () {
  return 0.5 - Math.random();
}

function rcv_SignalR(current_state) {
  //SERVER_STATE = current_state;
  msg_dispatch(current_state);
}


function msg_dispatch(current_state) {

  if (current_state.CMD == "add new player") {
    if (add_new_player(current_state)) {
      SERVER_STATE.CMD = "new player added";
      send_SignalR(SERVER_STATE); //tell clients to add new player
      return;  //so we do not clobber SERVER_STATE with an empty LOCAL_STATE
    }
  }

  SERVER_STATE = current_state;

  if (current_state.CMD == "request new game") {
    new_game();
    SERVER_STATE.CMD = "start hand";
    send_SignalR(SERVER_STATE);
    SERVER_STATE.TO_CALL = SERVER_STATE.BIG_BLIND;
    SERVER_STATE.CMD = "next player to act";
    send_SignalR(SERVER_STATE);
  }

  if (current_state.CMD == "request next hand") {
    SERVER_STATE.TO_CALL = SERVER_STATE.BIG_BLIND;
    new_round();
    SERVER_STATE.CMD = "start hand";
    send_SignalR(SERVER_STATE);
    SERVER_STATE.TO_CALL = SERVER_STATE.BIG_BLIND;
    SERVER_STATE.CMD = "next player to act";
    send_SignalR(SERVER_STATE);
  }

  if (current_state.CMD == "player action") {
    //if the betting round is done figure out next step and tell player
    //no need to send client and action msg as current bettor is already correct and they are ready to act
    if (betting_is_done()) {
      reset_player_statuses(2);
      SERVER_STATE.TO_CALL = 0;
      if (SERVER_STATE.board[0] == "") {
        deal_flop();
        SERVER_STATE.CMD = "next player to act";
        SERVER_STATE.CMD_PARMS = "deal flop";
        send_SignalR(SERVER_STATE);
      }
      else if (SERVER_STATE.board[3] == "") {
        deal_fourth();
        SERVER_STATE.CMD = "next player to act";
        SERVER_STATE.CMD_PARMS = "deal fourth";
        send_SignalR(SERVER_STATE);
      }
      else if (SERVER_STATE.board[4] == "") {
        deal_fifth();
        SERVER_STATE.CMD = "next player to act";
        SERVER_STATE.CMD_PARMS = "deal fifth";
        send_SignalR(SERVER_STATE);
      }
      else if (SERVER_STATE.board[4] != "") { //if betting is done and all 5 board cards are dealt calc winner
        //send_game_response("WINNER!"); //just a stub until I add calc winner code
        handle_end_of_round();
        SERVER_STATE.CMD = "end of round";
        send_SignalR(SERVER_STATE);
      }
      SERVER_STATE.CMD_PARMS = "";
    }
    else {
      //if the betting round is not over, figure out out any current bet and ask next player to act
      SERVER_STATE.current_bettor_index = get_next_player_position(SERVER_STATE.current_bettor_index, 1);
      set_to_call();
      SERVER_STATE.CMD = "next player to act";
      send_SignalR(SERVER_STATE);
    }
  }
}

function send_game_response(response) {
  SERVER_STATE.CMD = "game response";
  SERVER_STATE.CMD_PARMS = response;
  send_SignalR(SERVER_STATE);
}

function send_SignalR(SERVER_STATE) {
  cl_rcv_SignalR(SERVER_STATE);
}
