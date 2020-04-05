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
  START_DATE,
  NUM_ROUNDS,
  STOP_AUTOPLAY,
  RUN_EM,
  STARTING_BANKROLL,
  SMALL_BLIND,
  BIG_BLIND,
  BG_HILITE,
  cards,
  players, /*:   [
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
   ],*/
  board, deck_index, button_index,
  current_bettor_index, current_bet_amount, current_min_raise, current_pot
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

  if (STATE.CMD == "setup_new_player") {
    NUM_PLAYERS = STATE.NUM_PLAYERS;
    for (var i = 0; i < STATE.NUM_PLAYERS; i++) {
      setup_new_player(i);  //for testing setup all players, msg from server includes all current players
    }
  }

  if (STATE.CMD == "start new hand") { //msg from server inc current dealer, this players hole cards, and pot size
    button_index = STATE.button_index;
    current_bet_amount = STATE.current_bet_amount;
    current_pot = STATE.current_pot;

    gui_place_dealer_button(button_index);
    write_player(small_blind_seat,0,0);
    write_player(big_blind_seat,0,0);
    players[0].carda = STATE.players[0].carda;
    players[0].cardb = STATE.players[0].cardb; 
    write_player(0,0,1);  //show my hold cards
    gui_write_basic_general(current_pot);  //just the blinds obviously
    current_bettor_index = STATE.current_bettor_index;
    write_player(current_bettor_index, 1, 1); //highlight first player to act
  } 

  if (STATE.CMD == "player turn to act") { //this just highlights current bettor unless it is us
    current_bettor_index = STATE.current_bettor_index;
    write_player(current_bettor_index, 1, 1);
    //if it's us then enable bet controls showing to call amount and min raise amount
  }
}

function setup_new_player(position){
  players[position].bankroll = STATE.players[position].bankroll;
  players[position] = STATE.players[position];
  write_player(position,0,0);
}

var next_msg = 0;

function get_msg() {  //whatever STATE object server sends will be copied to our global STATE object

  if (next_msg == 0) {  //MSG Should include all current players name and buyin
    STATE.CMD = "setup_new_player"
    STATE.players = [
    new player("Matt", 1000, "", "", "", 0, 0),
    new player("Sally",900, "blinded", "blinded", "", 0, 0),
    new player("Les",1100, "blinded", "blinded", "", 0, 0),
    new player("Greg", 800, "blinded", "blinded", "", 0, 0),
    new player("Corrina", 1200, "blinded", "blinded", "", 0, 0),
    new player("Lisa", 950, "blinded", "blinded", "", 0, 0),
    new player("", 200, "blinded", "blinded", "", 0, 0),
    new player("", 999, "blinded", "blinded", "", 0, 0),
    new player("", 888, "blinded", "blinded", "", 0, 0),
    new player("", 777, "blinded", "blinded", "", 0, 0)
    ]
    players = STATE.players;
    STATE.NUM_PLAYERS = 8;   //just an arbitrary test
  }

  if (next_msg == 1) {    //testing server starting new hand with button at seat3, or index =2
    var big_blind_seat;
    var small_blind_seat
    var first_to_act_seat

    STATE.CMD = "start new hand";
    STATE.button_index = 2;
    
    if (STATE.button_index + 1 < STATE.NUM_PLAYERS) {
      small_blind_seat = STATE.button_index + 1;
    }
    else {
      small_blind_seat = 0;
    }

    if (STATE.button_index + 2 < STATE.NUM_PLAYERS) {
      big_blind_seat = STATE.button_index + 2;
    }
    else {
      big_blind_seat = 0;
    }

    if (STATE.button_index + 3 < STATE.NUM_PLAYERS) {
      first_to_act_seat = STATE.button_index + 3;
    }
    else {
      first_to_act_seat = 0;
    }

    //need blinds posted
    STATE.players[small_blind_seat].subtotal_bet = 5;
    STATE.players[small_blind_seat].total_bet_amount = 5;
    STATE.players[big_blind_seat].subtotal_bet = 10;
    STATE.players[big_blind_seat].total_bet_amount = 10;
    STATE.current_bet_amount = 15;
    STATE.players[0].carda = "h13";
    STATE.players[0].cardb = "s2";
    STATE.current_pot = 15;  //blinds
    STATE.current_bettor_index = first_to_act_seat;
  }

  if (next_msg == 2) {
    STATE.CMD = "player turn to act";
    STATE.current_bettor_index = 5;
  }
  next_msg++;
  return;
}