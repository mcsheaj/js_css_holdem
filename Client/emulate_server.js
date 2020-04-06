// Next State takes the place of SIGNALR message to/from server
function next_state () {
    get_msg();
  
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
    } 

    if (STATE.CMD == "next player to act") {  //highlights next player and enables betting controls
        write_player(current_bettor_index, 1, 1);
        gui_write_basic_general(current_pot);
    }
  
    if (STATE.CMD == "player action") { 
      write_player(current_bettor_index, 0, 0);
      gui_write_basic_general(current_pot);
    }
  
    if (STATE.CMD == "my action") { 
      write_player(current_bettor_index, 0, 0);
      gui_write_basic_general(current_pot);
      players[my_seat].status = "";
      get_my_action();
    }

    if (STATE.CMD == "lay flop") {
        clear_bets();
        reset_player_statuses(2);
        write_all_players();
        gui_burn_board_card(0, "blinded");
        gui_lay_board_card(0, board[0]);
        gui_lay_board_card(1, board[1]);
        gui_lay_board_card(2, board[2]);
    }
  
    STATE.CMD = "";
  }
  
  var next_test_state = 0;
  
  function get_msg() {  //set values of STATE object to emulate a server msg
  
    if (next_test_state == 0) {  //Setup a 6 person game with 5/10 blinds
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
  
    if (next_test_state == 1) {    //server starts new hand with button at seat3, or index =2
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

    if (next_test_state == 2) {  //server lets everyone know who next seat to act is, in this case 4
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 5;
    }

    if (next_test_state == 3) {   //player in seat 5 raises 
      STATE.CMD = "player action";
      STATE.current_bettor_index = 5;
      STATE.players[current_bettor_index].subtotal_bet = 100;
      STATE.players[current_bettor_index].total_bet += STATE.players[current_bettor_index].subtotal_bet;
      STATE.current_bet_amount = STATE.players[current_bettor_index].subtotal_bet;
      STATE.current_pot += STATE.current_bet_amount;
  
      if (STATE.current_min_raise < STATE.current_bet_amount) {
        STATE.current_min_raise = STATE.current_bet_amount;
      }
    }
  
    if (next_test_state == 4) {     // give me the action and betting controls
      STATE.CMD = "my action";
      STATE.current_bettor_index = 0;
    }

    if (next_test_state == 5) {    //give action to seat 1
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 1;
    }

    if (next_test_state == 6) {   //have seat 1 fold
        STATE.CMD = "player action";
        STATE.current_bettor_index = 1;
        STATE.players[current_bettor_index].status = "FOLD";
    }

    if (next_test_state == 7) {    //give action to seat 2
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 2;
    }

    if (next_test_state == 8) {   //have seat 2 fold
        STATE.CMD = "player action";
        STATE.current_bettor_index = 2;
        STATE.players[current_bettor_index].status = "FOLD";
    }

    if (next_test_state == 9) {    //give action to seat 3
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 3;
    }

    if (next_test_state == 10) {   //have seat 3 fold
        STATE.CMD = "player action";
        STATE.current_bettor_index = 3;
        STATE.players[current_bettor_index].status = "FOLD";
    }

    if (next_test_state == 11) {    //give action to seat 4
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 4;
    }

    if (next_test_state == 12) {   //have seat 4 fold
        STATE.CMD = "player action";
        STATE.current_bettor_index = 4;
        STATE.players[current_bettor_index].status = "FOLD";
    }

    if (next_test_state == 13) {    //give action to seat 5
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 5;
    }

    if (next_test_state == 14) {   //have seat 5 check
        STATE.CMD = "player action";
        STATE.current_bettor_index = 5;
        STATE.players[current_bettor_index].status = "CHECK";
    }

    if (next_test_state == 15) {
        STATE.CMD = "lay flop"
        STATE.board[0] = "s7";
        STATE.board[1] = "h10";
        STATE.board[2] = "c11";
    }

    if (next_test_state == 16) {    //give action to seat 5
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 5;
    }

    if (next_test_state == 17) {   //have seat 5 check
        STATE.CMD = "player action";
        STATE.current_bettor_index = 5;
        STATE.players[current_bettor_index].status = "CHECK";
        STATE.current_bet_amount = 0;
        STATE.players[current_bettor_index].subtotal_bet = 0;
    }

    if (next_test_state == 18) {     // give me the action and betting controls
        STATE.CMD = "my action";
        STATE.current_bettor_index = 0;
      }

    update_state(); //update global state variables with values from STATE object from server
    next_test_state++;
    return;
  }