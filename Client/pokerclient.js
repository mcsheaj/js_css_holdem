"use strict";

var my_seat = 0;
var big_blind_seat;
var small_blind_seat;
var first_to_act_seat;

var CMD;
var NUM_PLAYERS = 0;
var CURRENT_DEALER = 0;
var START_DATE;
var NUM_ROUNDS;
var STOP_AUTOPLAY = 0;
var RUN_EM = 0;
var STARTING_BANKROLL = 1000;
var SMALL_BLIND;
var BIG_BLIND;
var BG_HILITE = 'gold';           // "#EFEF30",
var cards = new Array(52);
var players = new Array();
var board, deck_index, button_index;
var current_bettor_index, current_bet_amount, current_min_raise, current_pot;

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
  cards,
  players, 
  board,
  deck_index,
  button_index,
  current_bettor_index,
  current_bet_amount,
  current_min_raise,
  current_pot
}

function update_state(){
  CMD  = STATE.CMD;
  NUM_PLAYERS = STATE.NUM_PLAYERS;
  CURRENT_DEALER = STATE.CURRENT_DEALER;
  NUM_ROUNDS = STATE.NUM_ROUNDS
  RUN_EM = STATE.RUN_EM;
  STARTING_BANKROLL = STATE.STARTING_BANKROLL;
  SMALL_BLIND = STATE.SMALL_BLIND
  BIG_BLIND = STATE.BIG_BLIND
  BG_HILITE = STATE.BG_HILITE;          
  cards = STATE.cards;
  players = STATE.players;
  board = STATE.board;
  deck_index = STATE.deck_index;
  button_index = STATE.button_index;
  current_bettor_index = STATE.current_bettor_index;
  current_bet_amount = STATE.current_bet_amount;
  current_min_raise= STATE.current_min_raise;
  current_pot = STATE.current_pot;
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
  make_deck();
  new_game();
  new_game_continues(); 
}

function main () {
  gui_hide_guick_raise();
  var increment_bettor_index = 0;
  if (players[current_bettor_index].status == "BUST" ||
      players[current_bettor_index].status == "FOLD") {
    increment_bettor_index = 1;
  } else if (!has_money(current_bettor_index)) {
    players[current_bettor_index].status = "CALL";
    increment_bettor_index = 1;
  } else if (players[current_bettor_index].status == "CALL" &&
             players[current_bettor_index].subtotal_bet == current_bet_amount) {
    increment_bettor_index = 1;
  } else {
    players[current_bettor_index].status = "";
    if (1) {//(current_bettor_index == 0) {********all players are human
      var call_button_text = "<u>C</u>all " + current_bet_amount;
      var fold_button_text = "<u>F</u>old";
      var to_call = current_bet_amount - players[current_bettor_index].subtotal_bet;
      if (to_call > players[current_bettor_index].bankroll) {   //*************************
        to_call = players[current_bettor_index].bankroll;       //*************************
      }
      var that_is_not_the_key_you_are_looking_for;
      if (to_call == 0) {
        call_button_text = "<u>C</u>heck";
        fold_button_text = 0;
        that_is_not_the_key_you_are_looking_for = function (key) {
          if (key == 67) {         // Check
            human_call();
          } else {
            return true;           // Not my business
          }
          return false;
        };
      } else {
        that_is_not_the_key_you_are_looking_for = function (key) {
          if (key == 67) {         // Call
            human_call();
          } else if (key == 70) {  // Fold
            human_fold();
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
      gui_setup_fold_call_click(fold_button_text,
                                call_button_text,
                                do_fold,
                                do_call);

     var quick_values = new Array(6);

     var next_raise;
     for (var i = 0; i < 6; i++) {
       next_raise = current_min_raise + (current_min_raise * i);
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
          quick_bets += "<a href='javascript:parent.handle_human_bet(" +
                        quick_values[i] + ")'>" + quick_values[i] + "</a>" +
                        "&nbsp;&nbsp;&nbsp;";
        }
      }
      quick_bets += "<a href='javascript:parent.handle_human_bet(" +
                    players[current_bettor_index].bankroll + ")'>All In!</a>";
      var html9 = "<td><table align=center><tr><td align=center>";
      var html10 = quick_bets +
                   "</td></tr></table></td></tr></table></body></html>";
      gui_write_guick_raise(html9 + html10);

      var hi_lite_color = gui_get_theme_mode_highlite_color();
      var message = "";
      
      if (to_call){
        message = "<tr><td><font size=+2><b>Current raise: " +
                    current_bet_amount + 
                    "</b><br> You need <font color=" + hi_lite_color +
                    " size=+3>" + to_call +
                    "</font> more to call.<br>" +
                    players[current_bettor_index].name + ", it's your turn." +
                    "</font></td></tr>";
      } else {
        message = "<tr><td><font size=+2><b>Current raise: " +
                    current_bet_amount +
                    "</b><br>" +
                    players[current_bettor_index].name + ", you are first to act." +
                    "</font></td></tr>";  
      }
      gui_write_game_response(message);
      write_player(current_bettor_index, 1, 0);
      return;
    } 
  }
}

function make_deck () {
  var i;
  var j = 0;
  for (i = 2; i < 15; i++) {
    cards[j++] = "h" + i;
    cards[j++] = "d" + i;
    cards[j++] = "c" + i;
    cards[j++] = "s" + i;
  }
}

function new_game () {
  START_DATE = new Date();
  NUM_ROUNDS = 0;
  initialize_game();
  //ask_how_many_opponents();
  gui_setup_option_buttons(next_state,
    help_func,
    help_func,
    update_func,
    gui_toggle_the_theme_mode);
}

function new_game_continues (req_no_opponents) {
  var my_players = [
                    new player("Matt", 0, "", "", "", 0, 0),
                    new player("惠辰國", 0, "", "", "", 0, 0),
                    new player("Jani Sointula", 0, "", "", "", 0, 0),
                    new player("Annette Obrestad", 0, "", "", "", 0, 0),
                    new player("Ricardo Chauriye", 0, "", "", "", 0, 0),
                    new player("Jennifer Shahade", 0, "", "", "", 0, 0),
                    new player("Theo Jørgensen", 0, "", "", "", 0, 0),
                    new player("Marek Židlický", 0, "", "", "", 0, 0),
                    //  Żółć - Grzegorz Brzęczyszczykiewicz
                    new player("Brzęczyszczykiewicz", 0, "", "", "", 0, 0),
                    new player("Chris Moneymaker", 0, "", "", "", 0, 0)
                   ];

  players = new Array(NUM_PLAYERS);             //THIS WILL EVENTUALLY COME FROM SERVER

  for (var i = 0; i < players.length; i++) {
    players[i] = my_players[i];
  }
  clear_player_cards(10);
  reset_player_statuses(0);
  clear_bets();
  //for (i = 0; i < players.length; i++) {
  //  players[i].bankroll = STARTING_BANKROLL;
  //}
  // button_index = Math.floor(Math.random() * players.length);  //WILL EVENTUALLY COME FROM SERVER
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
  //button_index = CURRENT_DEALER;  //THIS WILL EVENTUALL BE SENT BY THE SERVER
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
    //gui_set_bankroll("", pl);
  }
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
    players[i].subtotal_bet = 0;
  }
  current_bet_amount = 0;
}


function help_func () {
  // Open help.html
  window.location.href = 'help.html';
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

  if (players[n].status == "FOLD") {
    bet_text = "FOLDED (" +
               (players[n].subtotal_bet + players[n].total_bet) + ")";
    } else if (players[n].status == "BUST") {
    bet_text = "BUSTED";
    } else if (!has_money(n)) {
    bet_text = "ALL IN (" +
               (players[n].subtotal_bet + players[n].total_bet) + ")";
    } else {
    bet_text = allin + "$" + players[n].subtotal_bet +
               " (" + (players[n].subtotal_bet + players[n].total_bet) + ")";
  }

  gui_set_player_name(players[n].name, n);    // offset 1 on seat-index
  gui_set_bet(bet_text, n);
  gui_set_bankroll(players[n].bankroll, n);
  gui_set_player_cards(carda, cardb, n, show_folded);
}


// Next State takes the place of SIGNALR message to/from server
function next_state () {
  get_msg();
  update_state();

  if (STATE.CMD == "setup_new_player") {
    for (var i = 0; i < STATE.NUM_PLAYERS; i++) {
      write_player(i, 0, 0);  //for testing setup all players, msg from server includes all current players
    }
  }

  if (STATE.CMD == "start new hand") { //msg from server inc current dealer, this players hole cards, and pot size
    gui_place_dealer_button(button_index);
    write_player(small_blind_seat,0,0);
    write_player(big_blind_seat,0,0);
    write_player(0,0,1);  //show my hold cards
    gui_write_basic_general(current_pot);  //just the blinds obviously
    write_player(current_bettor_index, 1, 1); //highlight first player to act
  } 

  if (STATE.CMD == "player action") { 
    write_player(5, 0, 1);
    write_player(0, 1, 1);
    gui_write_basic_general(current_pot);
    //if it's us then enable bet controls showing to call amount and min raise amount
    main();
  }
}

var next_msg = 0;

function get_msg() {  //whatever STATE object server sends will be copied to our global STATE object

  if (next_msg == 0) {  //Setup a 6 person game with 5/10 blinds
    STATE.CMD = "setup_new_player"
    STATE.players = [
    new player("Matt", 1000, "", "", "", 0, 0),
    new player("Sally",900, "blinded", "blinded", "", 0, 0),
    new player("Les",1100, "blinded", "blinded", "", 0, 0),
    new player("Greg", 800, "blinded", "blinded", "", 0, 0),
    new player("Corrina", 1200, "blinded", "blinded", "", 0, 0),
    new player("Lisa", 950, "blinded", "blinded", "", 0, 0),
    //new player("", 200, "blinded", "blinded", "", 0, 0),
    //new player("", 999, "blinded", "blinded", "", 0, 0),
    //new player("", 888, "blinded", "blinded", "", 0, 0),
    //new player("", 777, "blinded", "blinded", "", 0, 0)
    ]
    //players = STATE.players;
    STATE.NUM_PLAYERS = 6;   //just an arbitrary test
    STATE.SMALL_BLIND = 5;   //should be sent by server
    STATE.BIG_BLIND = 10;
  }

  if (next_msg == 1) {    //testing server starting new hand with button at seat3, or index =2
    STATE.CMD = "start new hand";
    STATE.button_index = 2;
    
    if (STATE.button_index + 1 < STATE.players.length) {
      small_blind_seat = STATE.button_index + 1;
    }
    else {
      small_blind_seat = 0;
    }

    if (STATE.button_index + 2 < STATE.players.length) {
      big_blind_seat = STATE.button_index + 2;
    }
    else {
      big_blind_seat = 0;
    }

    if (STATE.button_index + 3 < STATE.players.length) {
      first_to_act_seat = STATE.button_index + 3;
    }
    else {
      first_to_act_seat = 0;
    }

    //need blinds posted
    STATE.SMALL_BLIND = 5;
    STATE.BIG_BLIND = 10;
    STATE.players[small_blind_seat].subtotal_bet = STATE.SMALL_BLIND;
    STATE.players[small_blind_seat].total_bet_amount = STATE.SMALL_BLIND;
    STATE.players[big_blind_seat].subtotal_bet = STATE.BIG_BLIND;
    STATE.players[big_blind_seat].total_bet_amount = STATE.BIG_BLIND;
    STATE.current_bet_amount = 10;
    STATE.players[0].carda = "h13";
    STATE.players[0].cardb = "s2";
    STATE.current_pot = 15;  //blinds
    STATE.current_bettor_index = first_to_act_seat;
    STATE.current_min_raise = 10;
  }

  if (next_msg == 2) {   //player in seat 5 raises 
    STATE.CMD = "player action";
    STATE.players[current_bettor_index].subtotal_bet = 100;
    STATE.players[current_bettor_index].total_bet_amount += STATE.players[current_bettor_index].subtotal_bet;
    STATE.current_bet_amount = STATE.players[current_bettor_index].subtotal_bet;
    STATE.current_pot += STATE.current_bet_amount;

    if (STATE.current_min_raise < STATE.current_bet_amount) {
      STATE.current_min_raise = STATE.current_bet_amount;
    }

    if (STATE.current_bettor_index < STATE.players.length-1) {
      STATE.current_bettor_index++;
    }
    else {
      STATE.current_bettor_index = 0;
    }

  }
  next_msg++;
  return;
}