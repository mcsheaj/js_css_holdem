"use strict";

var my_seat = 0;
var big_blind_seat;
var small_blind_seat;
var first_to_act_seat;

var CMD = "";
var NUM_PLAYERS = 0;
var CURRENT_DEALER = 0;
var START_DATE;
var NUM_ROUNDS = 0;
var STOP_AUTOPLAY = 0;
var RUN_EM = 0;
var STARTING_BANKROLL = 10.00;
var SMALL_BLIND = 0;
var BIG_BLIND=0
var BG_HILITE = 'gold';
var players = new Array();
var board;
var button_index = 0;
var current_bettor_index = 0;
var current_bet_amount = 0;
var current_min_raise = 0;
var current_pot = 0;

//STATE is the state of the game from the server
var STATE = {
  CMD,
  NUM_PLAYERS,
  CURRENT_DEALER,
  NUM_ROUNDS,
  RUN_EM,
  STARTING_BANKROLL,
  SMALL_BLIND,
  BIG_BLIND,
  BG_HILITE: 'gold',
  players, 
  board,
  button_index,
  current_bettor_index,
  current_bet_amount,
  current_min_raise,
  current_pot
}

//when we get a msg from the server, update our local state with the server STATE
function update_local_state(){
  CMD  = STATE.CMD;
  NUM_PLAYERS = STATE.NUM_PLAYERS;
  CURRENT_DEALER = STATE.CURRENT_DEALER;
  NUM_ROUNDS = STATE.NUM_ROUNDS
  RUN_EM = STATE.RUN_EM;
  STARTING_BANKROLL = STATE.STARTING_BANKROLL;
  SMALL_BLIND = STATE.SMALL_BLIND
  BIG_BLIND = STATE.BIG_BLIND
  BG_HILITE = STATE.BG_HILITE;          
  players = STATE.players;
  board = STATE.board;
  button_index = STATE.button_index;
  current_bettor_index = STATE.current_bettor_index;
  current_bet_amount = STATE.current_bet_amount;
  current_min_raise= STATE.current_min_raise;
  current_pot = STATE.current_pot;
}

//before sending msg to server, update our server STATE with the local state
function update_STATE(){
  STATE.CMD = CMD;
  STATE.NUM_PLAYERS = NUM_PLAYERS;
  STATE.CURRENT_DEALER = CURRENT_DEALER;
  STATE.NUM_ROUNDS = NUM_ROUNDS
  STATE.RUN_EM = RUN_EM;
  STATE.STARTING_BANKROLL = STARTING_BANKROLL;
  STATE.SMALL_BLIND = SMALL_BLIND;
  STATE.BIG_BLIND = BIG_BLIND;
  STATE.BG_HILITE = BG_HILITE;          
  STATE.players = players;
  STATE.board = board;
  STATE.button_index = button_index;
  STATE.current_bettor_index = current_bettor_index;
  STATE.current_bet_amount = current_bet_amount;
  STATE.current_min_raise = current_min_raise;
  STATE.current_pot = current_pot;
}

function init() {
  gui_hide_poker_table();
  gui_hide_log_window();
  gui_hide_setup_option_buttons();
  gui_hide_fold_call_click();
  gui_hide_guick_raise();
  gui_hide_dealer_button();
  gui_hide_game_response();
  gui_initialize_theme_mode();
  new_game();
  new_game_continues(); 
}

function get_pot_size () {
  var p = 0;
  for (var i = 0; i < players.length; i++) {
    p += players[i].total_bet;// + players[i].subtotal_bet;
  }
  //p += global_pot_remainder;
  return p.toFixed(2);
}

function get_pot_size_html () {
  return "<font size=+2><b>" + get_pot_size() + "</b></font>";
}

function get_my_action () {
  gui_hide_guick_raise ();
  //var increment_bettor_index = 0;
  
    players[current_bettor_index].status = "";
    if (1) {//(current_bettor_index == 0) {********all players are human
      var call_button_text = "<u>C</u>all " + current_bet_amount.toFixed(2);
      var fold_button_text = "<u>F</u>old";
      var to_call = current_bet_amount; // - players[current_bettor_index].subtotal_bet;
      if (to_call > players[current_bettor_index].bankroll) {   //*************************
        to_call = players[current_bettor_index].bankroll;       //*************************
      }
      var that_is_not_the_key_you_are_looking_for;
      if (to_call == 0) {
        call_button_text = "<u>C</u>heck";
        fold_button_text = 0;
        that_is_not_the_key_you_are_looking_for = function (key) {
          if (key == 67) {         // Check
            player_checks();
          } else {
            return true;           // Not my business
          }
          return false;
        };
      } else {
        that_is_not_the_key_you_are_looking_for = function (key) {
          if (key == 67) {         // Call
            player_calls();
          } else if (key == 70) {  // Fold
            player_folds();
          } else {
            return true;           // Not my business
          }
          return false;
        };
      }
      // Fix the shortcut keys - structured and simple
      // Called through a key event
      var ret_function = function (key_event) {
        actual_function(key_event.keyCode, key_event);
      }

      // Called both by a key press and click on button.
      // Why? Because we want to disable the shortcut keys when done
      var actual_function = function (key, key_event) {
        if (that_is_not_the_key_you_are_looking_for(key)) {
          return;
        }
        gui_disable_shortcut_keys(ret_function);
        if (key_event != null) {
          key_event.preventDefault();
        }
      };

      // And now set up so the key click also go to 'actual_function'
      var do_fold = function () {
        actual_function(70, null);
      };
      var do_call = function () {
        actual_function(67, null);
      };
      // Trigger the shortcut keys
      gui_enable_shortcut_keys(ret_function);

      // And enable the buttons
      if (to_call) {
        gui_setup_fold_call_click(fold_button_text,
                                  call_button_text,
                                  player_folds,
                                  player_calls);
        }
        else {
          gui_setup_fold_call_click(fold_button_text,
            call_button_text,
            player_folds,
            player_checks);
        }

     var quick_values = new Array(6);

     var next_raise;
     for (var i = 1; i < 6; i++) {
       next_raise = current_min_raise * i;
      if (next_raise < players[current_bettor_index].bankroll) {
        quick_values[i] = next_raise;
      }
    }

      var bet_or_raise = "Bet";
      if (to_call > 0) {
        bet_or_raise = "Raise";
      }
      var quick_bets = "<b>Quick " + bet_or_raise + "s</b><br>";
      for (i = 0; i < 6; i++) {
        if (quick_values[i]) {
          quick_bets += "<a href='javascript:parent.handle_my_raise(" +
                        (quick_values[i] + to_call) + ")'>" + quick_values[i].toFixed(2) + "</a>" +
                        "&nbsp;&nbsp;&nbsp;";
        }
      }
      quick_bets += "<a href='javascript:parent.handle_my_raise(" +
                    players[current_bettor_index].bankroll.toFixed(2) + ")'>All In!</a>";
      var html9 = "<td><table align=center><tr><td align=center>";
      var html10 = quick_bets +
                   "</td></tr></table></td></tr></table></body></html>";
      gui_write_guick_raise(html9 + html10);

      var hi_lite_color = gui_get_theme_mode_highlite_color();
      var message = "";
      
      if (to_call){
        message = "<tr><td><font size=+2><b>Current raise: " +
                    current_bet_amount.toFixed(2) + 
                    "</b><br> You need <font color=" + hi_lite_color +
                    " size=+3>" + to_call.toFixed(2) +
                    "</font> more to call.<br>" +
                    players[current_bettor_index].name + ", it's your turn." +
                    "</font></td></tr>";
      } else {
        message = "<tr><td><font size=+2>" + players[current_bettor_index].name + ", you are next to act." +
                    "</font></td></tr>";  
      }
      gui_write_game_response(message);
      write_player(my_seat, 1, 0);
      //return;
    } 
  }

function handle_my_raise (bet_amount) {
  the_bet_function(my_seat, bet_amount);
  gui_write_basic_general(get_pot_size());
  players[my_seat].status = "RAISE";
  write_player(my_seat, 0, 0);
  gui_hide_guick_raise();
  gui_hide_fold_call_click ();
  gui_write_game_response("");
  send_msg();
}

function the_bet_function (player_index, bet_amount) {
  if (bet_amount == current_bet_amount){
    players[my_seat].status = "CALL";
  }

  //var previous_current_bet = current_bet_amount;
  current_bet_amount = bet_amount; //players[my_seat].subtotal_bet + 
  current_min_raise = current_bet_amount;
  
  players[player_index].subtotal_bet = bet_amount;
  players[player_index].total_bet += bet_amount;
  players[player_index].bankroll -= bet_amount;
  return;
}

function player_folds() {
  players[my_seat].status = "FOLD";
  write_player(my_seat, 0, 0);
  gui_hide_fold_call_click();
  gui_hide_guick_raise();
  gui_write_game_response("");
  send_msg();
}

function player_calls() {
  current_pot += current_bet_amount;
  players[my_seat].bet_amount = current_bet_amount;
  players[my_seat].subtotal_bet += current_bet_amount;
  players[my_seat].bankroll -= current_bet_amount;
  players[my_seat].total_bet += current_bet_amount;
  players[my_seat].status = "CALL";
  write_player(my_seat, 0, 0);
  gui_write_basic_general(get_pot_size());
  gui_hide_guick_raise();
  gui_hide_fold_call_click ();
  gui_write_game_response("");
  send_msg();
}

function player_checks() {
  gui_write_basic_general(get_pot_size());
  players[current_bettor_index].bet_amount = 0;
  players[my_seat].status = "CHECK";
  write_player(my_seat, 0, 0);
  gui_hide_fold_call_click();
  gui_hide_guick_raise();
  gui_write_game_response("");
  send_msg();
}

function new_game () {
  START_DATE = new Date();
  NUM_ROUNDS = 0;
  initialize_game();
  gui_setup_option_buttons(msg_dispatch,
    change_name,
    help_func,
    update_func,
    gui_toggle_the_theme_mode);
}

function new_game_continues (req_no_opponents) {
  clear_player_cards(10);  //clear max number of players, it's easier this way, trust me
  reset_player_statuses(0); 
  clear_bets();
  new_round();
}

function new_round () {
  RUN_EM = 0;
  NUM_ROUNDS++;
  // Clear buttons
  gui_hide_fold_call_click();

  reset_player_statuses(1);
  clear_bets();
  clear_pot();
  current_min_raise = 0;
  collect_cards();
 
  var i;
  for (i = 0; i < players.length; i++) {
    write_player(i, 0, 0);
  }

  gui_clear_the_board(board);
  //gui_write_game_response("<tr><td><font size=+2><b>New round</b></font>");
  gui_hide_guick_raise();
}

function initialize_game () {
  gui_hide_poker_table();
  gui_hide_dealer_button();
  gui_hide_fold_call_click();
  gui_show_poker_table();
}

function clear_player_cards (count) {
  count = count; // Count that human too
  for (var pl = 0; pl < count; ++pl) {
    gui_set_player_cards("", "", pl);
    gui_set_player_name("", pl);
    gui_set_bet("", pl);
  }
}

function leave_pseudo_alert () {
  gui_write_modal_box("");
}

function my_pseudo_alert (text) {
  var html = "<html><body topmargin=2 bottommargin=0 bgcolor=" +
             BG_HILITE + " onload='document.f.y.focus();'>" +
             "<font size=+2>" + text +
             "</font><form name=f><input name=y type=button value='  OK  ' " +
             "onclick='parent.leave_pseudo_alert()'></form></body></html>";
  gui_write_modal_box(html);
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

function clear_bets () {
  for (var i = 0; i < players.length; i++) {
    //players[i].subtotal_bet = 0;
  }
  current_bet_amount = 0;
}


function help_func () {
  // Open help.html
  window.open('help.html'); //window.location.href = 
}

function change_name () {
  var name = prompt("What is your name? (14 characters or less)", getLocalStorage("playername"));
  if (name) {
    if (name.length > 14) {
      my_pseudo_alert("Name must be less than 14 characters");
      name = "";
    }
  }
  if (name){
//SERVERMSG here with new player name
  setLocalStorage("playername", name);
  }
}

function update_func () {
}

function reset_player_statuses (type) {
  for (var i = 0; i < players.length; i++) {
    if (type == 0) {
      players[i].status = "";
    } else if (type == 1 && players[i].status != "BUST") {
      players[i].status = "";
    } else if (type == 2 &&
               players[i].status != "FOLD" &&
               players[i].status != "BUST") {
      players[i].status = "";
    }
  }
}

function clear_pot () {
  for (var i = 0; i < players.length; i++) {
    players[i].total_bet = 0;
  }
}

function collect_cards () {
  board = new Array(6);
  for (var i = 0; i < players.length; i++) {
    players[i].carda = "";
    players[i].cardb = "";
  }
  STATE.board = board;
}

function has_money (i) {
  if (players[i].bankroll >= 0.01) {
    return true;
  }
  return false;
}

function write_player (n, hilite, show_cards) {
  var carda = "";
  var cardb = "";
  var name_background_color = "";
  var name_font_color = "";
  if (hilite == 1) {            // Current
    name_background_color = BG_HILITE;
    name_font_color = 'black';
  } else if (hilite == 2) {       // Winner
    name_background_color = 'red';
  }
  if (players[n].status == "FOLD") {
    name_font_color = 'black';
    name_background_color = 'gray';
  }
  if (players[n].status == "BUST") {
    name_font_color = 'white';
    name_background_color = 'black';
  }
  gui_hilite_player(name_background_color, name_font_color, n);

  var show_folded = false;  
  show_cards = 1; 

  if (players[n].carda) {
    if (players[n].status == "FOLD") {
      carda = "";
      show_folded = true;
    } else {
      carda = "blinded";
    }
    if (show_cards && players[n].status != "FOLD") {
      carda = players[n].carda;
    }
  }
  
  if (players[n].cardb) {
    if (players[n].status == "FOLD") {
      cardb = "";
      show_folded = true;
    } else {
      cardb = "blinded";
    }
    if (show_cards && players[n].status != "FOLD") {  //some twisted logic here, figure it out
      cardb = players[n].cardb;
    }
  }
  if (n == button_index) {
    gui_place_dealer_button(n);
  }
  var bet_text = "TO BE OVERWRITTEN";
  var allin = "Bet:";

  if (players[n].status == "CALL") {
    allin = "Called:";
  }
  if (players[n].status == "FOLD") {
    bet_text = "FOLDED ($" +
               players[n].total_bet.toFixed(2) + ")";
    } else if (players[n].status == "BUST") {
    bet_text = "BUSTED";
    } else if (!has_money(n)) {
    bet_text = "ALL IN " + players[n].subtotal_bet.toFixed(2) + " ($" +
               players[n].total_bet.toFixed(2) + ")";
    } else {
    bet_text = allin + "$" + players[n].subtotal_bet.toFixed(2) +
               " ($" + players[n].total_bet.toFixed(2) + ")";
  }
  if (players[n].status == "CHECK") {
    bet_text = "Check" + " ($" + players[n].total_bet.toFixed(2) + ")";
  }

  gui_set_player_name(players[n].name, n);    // offset 1 on seat-index
  gui_set_bet(bet_text, n);
  gui_set_bankroll(players[n].bankroll.toFixed(2), n);
  gui_set_player_cards(carda, cardb, n, show_folded);
}

function write_all_players() {
  for (var n=0; n<players.length; n++) {
    write_player(n, 0, 0);
  }
}

//send msg to server
function send_msg(){

}

//HANDLE incoming message from server
function msg_dispatch () {
  update_STATE();
  get_msg();
  update_local_state();

  if (STATE.CMD == "setup_new_player") {
    for (var i = 0; i < STATE.players.length; i++) {
      write_player(i, 0, 0);  //for testing setup all players, msg from server includes all current players
      send_msg(STATE.CMD);
    }
  }

  if (STATE.CMD == "start new hand") { //msg from server inc current dealer, this players hole cards, and pot size
    gui_place_dealer_button(button_index);
    write_all_players();
    gui_write_basic_general(get_pot_size());  //just the blinds obviously
    //STATE.players[current_bettor_index].total_bet += STATE.players[current_bettor_index].subtotal_bet;
  } 

  if (STATE.CMD == "next player to act") {  //highlights next player and enables betting controls
      write_player(current_bettor_index, 1, 1);
      gui_write_basic_general(get_pot_size());
  }

  if (STATE.CMD == "player action") { 
    write_player(current_bettor_index, 0, 0);
    gui_write_basic_general(get_pot_size());
  }

  if (STATE.CMD == "my action") { 
    players[my_seat].status = "";
    get_my_action();
    write_player(current_bettor_index, 0, 0);
    gui_write_basic_general(get_pot_size());
  }

  if (STATE.CMD == "lay flop") {
      reset_player_statuses(2);
      write_all_players();
      gui_burn_board_card(0, "blinded");
      gui_lay_board_card(0, board[0]);
      gui_lay_board_card(1, board[1]);
      gui_lay_board_card(2, board[2]);
  }

  if (STATE.CMD == "lay turn") {
    write_all_players();
    gui_burn_board_card(1, "blinded");
    gui_lay_board_card(3, board[3]);
  }

  if (STATE.CMD == "lay river") {
    write_all_players();
    gui_burn_board_card(2, "blinded");
    gui_lay_board_card(4, board[4]);
  }

  if (STATE.CMD == "hand complete") {
    gui_write_game_response(STATE.winning_hand_text)
  }

  STATE.CMD = "";
}

