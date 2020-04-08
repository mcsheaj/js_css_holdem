

  
  var next_test_state = 0; //used just for emulating server messages
  
  // get_msg takes the place of SIGNALR message to/from server
  function get_msg() {  //set values of STATE object to emulate a server msg
  
    if (next_test_state == 0) {  //Setup a 6 person game with 5/10 blinds
      STATE.CMD = "setup_new_player"
      STATE.players = [
      new player("Matt", 10.75, "", "", "", 0, 0),
      new player("Sally",9.00, "", "", "", 0, 0),
      new player("Les",11.00, "", "", "", 0, 0),
      new player("Greg", 8.00, "", "", "", 0, 0),
      new player("Corrina", 12.00, "", "", "", 0, 0),
      new player("Lisa", 9.50, "", "", "", 0, 0),
      ]
      STATE.NUM_PLAYERS = 6;   //just an arbitrary test
      STATE.SMALL_BLIND = .05;   //should be sent by server
      STATE.BIG_BLIND = .10;
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
      STATE.SMALL_BLIND = .05;
      STATE.BIG_BLIND = .10;
      STATE.players[small_blind_seat].subtotal_bet = STATE.SMALL_BLIND;
      STATE.players[small_blind_seat].total_bet = STATE.SMALL_BLIND;
      STATE.players[big_blind_seat].subtotal_bet = STATE.BIG_BLIND;
      STATE.players[big_blind_seat].total_bet = STATE.BIG_BLIND;
      STATE.current_bet_amount = .10;
      STATE.players[my_seat].carda = "h13";
      STATE.players[my_seat].cardb = "s2";
      STATE.current_pot = STATE.SMALL_BLIND + STATE.BIG_BLIND;  //blinds
      STATE.current_bettor_index = first_to_act_seat;
      STATE.current_min_raise = STATE.BIG_BLIND;
      STATE.players[small_blind_seat].bankroll -= STATE.SMALL_BLIND;
      STATE.players[big_blind_seat].bankroll -= STATE.BIG_BLIND;

      for (var seat = 0; seat < STATE.players.length; seat++) {
        if (seat != my_seat) {
            STATE.players[seat].carda = "blinded"; //give everyone dummy cards to hide except for me
            STATE.players[seat].cardb = "blinded";
        }
      }
    }

    if (next_test_state == 2) {  //server lets everyone know who next seat to act is, in this case 5
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 5;
    }

    if (next_test_state == 3) {   //player in seat 5 raises to 30
      STATE.CMD = "player action";
      STATE.current_bettor_index = 5;
      STATE.players[current_bettor_index].subtotal_bet = .30;
      STATE.players[current_bettor_index].total_bet += STATE.players[current_bettor_index].subtotal_bet;
      STATE.players[current_bettor_index].bankroll -= STATE.players[current_bettor_index].subtotal_bet;
      STATE.current_bet_amount = STATE.players[current_bettor_index].subtotal_bet;
      STATE.current_pot += STATE.current_bet_amount;
      STATE.current_min_raise = .30;
      STATE.players[current_bettor_index].status = "RAISE";
    }
  
    if (next_test_state == 4) {     // give me the action and betting controls
      STATE.CMD = "my action";      //i will check
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

    if (next_test_state == 13) {
        STATE.board = board;
        STATE.CMD = "lay flop"
        STATE.board[0] = "s7";
        STATE.board[1] = "h10";
        STATE.board[2] = "c11";
    }

    if (next_test_state == 14) {    //give action to seat 5
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 5;
    }

    if (next_test_state == 15) {   //have seat 5 check
        STATE.CMD = "player action";
        STATE.current_bettor_index = 5;
        STATE.players[current_bettor_index].status = "CHECK";
        STATE.current_bet_amount = 0;
    }

    if (next_test_state == 16) {     // give me the action and betting controls, i'll check
        STATE.CMD = "my action";
        STATE.current_bettor_index = my_seat;
    }

    if (next_test_state == 17) {
        STATE.CMD = "lay turn"
        STATE.board[3] = "d13";
    }

    if (next_test_state == 18) {     // give seat5 the action and betting controls, i'll check
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 5;
    }

    if (next_test_state == 19) {   //player in seat 5 bets 30
        STATE.CMD = "player action";
        STATE.current_bettor_index = 5;
        STATE.players[current_bettor_index].subtotal_bet = .30;
        STATE.players[current_bettor_index].total_bet += STATE.players[current_bettor_index].subtotal_bet;
        STATE.players[current_bettor_index].bankroll -= STATE.players[current_bettor_index].subtotal_bet;
        STATE.current_bet_amount = STATE.players[current_bettor_index].subtotal_bet;
        STATE.current_pot += STATE.current_bet_amount;
        STATE.players[current_bettor_index].status = "BET";
    }

    if (next_test_state == 20) {     // give me the action and betting controls, i'll raise 30
        STATE.CMD = "my action";
        STATE.current_bettor_index = my_seat;
    }

    if (next_test_state == 21) {     // give seat5 the action and betting controls
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 5;
    }

    if (next_test_state == 22) {   //player in seat 5 calls
        STATE.CMD = "player action";
        STATE.current_bettor_index = 5;
        STATE.players[current_bettor_index].subtotal_bet = .30;
        STATE.players[current_bettor_index].total_bet += STATE.players[current_bettor_index].subtotal_bet;
        STATE.players[current_bettor_index].bankroll -= STATE.players[current_bettor_index].subtotal_bet;
        STATE.current_bet_amount = STATE.players[current_bettor_index].subtotal_bet;
        STATE.current_pot += STATE.current_bet_amount;
        STATE.players[current_bettor_index].status = "CALL";
    }

    if (next_test_state == 23) {
        STATE.CMD = "lay river"
        STATE.board[4] = "c13";
    }

    if (next_test_state == 24) {    //give action to seat 5
        STATE.CMD = "next player to act";
        STATE.current_bettor_index = 5;
    }

    if (next_test_state == 25) {   //have seat 5 go all in
        STATE.CMD = "player action";
        STATE.current_bettor_index = 5;
        STATE.players[current_bettor_index].subtotal_bet = 8.60;
        STATE.players[current_bettor_index].total_bet += STATE.players[current_bettor_index].subtotal_bet;
        STATE.players[current_bettor_index].bankroll -= STATE.players[current_bettor_index].subtotal_bet;
        STATE.current_bet_amount = STATE.players[current_bettor_index].subtotal_bet;
        STATE.current_pot += STATE.current_bet_amount;
        STATE.players[current_bettor_index].status = "BET";
    }

    if (next_test_state == 26) {     // give me the action and betting controls
    STATE.CMD = "my action";
    STATE.current_bettor_index = my_seat;
    }

    if (next_test_state == 27) {    //give action to seat 5
        STATE.CMD = "hand complete";
        var response = "<tr><td><font size=+2>Matt wins $" + get_pot_size() 
            + " with a Three of a Kind</font></td></tr>"
        STATE.winning_hand_text = response;
    }


    next_test_state++;
    return;
  }