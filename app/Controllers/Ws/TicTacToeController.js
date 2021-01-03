"use strict";
const Redis = use("Redis");

class TicTacToeController {
  constructor({ socket, request }) {
    this.socket = socket;
    this.request = request;
  }

  async onBoardMove({ cell }) {
    try {
      const username = this.request.cookie("username");
      const game_code = await Redis.hget(username, "game_code");
      const gameObject = await Redis.hgetall(game_code);
      const { player_id } = JSON.parse(gameObject[`${username}_stats`]);

      if (player_id === gameObject.next_player) {
        this.executeTurnLogic({
          cell,
          username,
          game_code,
          gameObject,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async executeTurnLogic({ cell, username, game_code, gameObject }) {
    try {
      // Get the next player details
      const next_player =
        gameObject.next_player === "player1" ? "player2" : "player1";
      const next_player_username = gameObject[`${next_player}_username`];
      const next_player_socket_id = await Redis.hget(
        next_player_username,
        "socket_id"
      );

      const board = JSON.parse(gameObject.board);
      const { mark: current_player_mark } = JSON.parse(
        gameObject[`${username}_stats`]
      );

      board[Number(cell)] = current_player_mark;
      const { status, player, sequence } = this.checkForWinner(board);
      await Redis.hset(
        game_code,
        "board",
        JSON.stringify(board),
        "next_player",
        next_player
      );

      if (status === "indefinite") {
        this.socket.emitTo(
          "otherPlayerMove",
          { cell, other_player_mark: current_player_mark },
          [`tic-tac-toe#${next_player_socket_id}`]
        );
      } else if (status === "win") {
        const winnerUsername = await Redis.hget(
          game_code,
          `${player}_username`
        );
        const rawWinnerStats = await Redis.hget(
          game_code,
          `${winnerUsername}_stats`
        );
        const winnerStats = JSON.parse(rawWinnerStats);
        winnerStats.score = winnerStats.score + 1;

        await Redis.hset(
          game_code,
          `${winnerUsername}_stats`,
          JSON.stringify(winnerStats)
        );
        const stats = {
          cell,
          other_player_mark: current_player_mark,
          player: winnerUsername,
          sequence,
          score_info: { score: winnerStats.score, player },
        };
        this.socket.emitTo("playerWins", stats, [
          `tic-tac-toe#${next_player_socket_id}`,
        ]);
        this.socket.emit("playerWins", stats);
      } else {
        const stats = { cell, other_player_mark: current_player_mark };

        this.socket.emitTo("draw", stats, [
          `tic-tac-toe#${next_player_socket_id}`,
        ]);
        this.socket.emit("draw", stats);
      }
    } catch (error) {
      console.error(error);
    }
  }

  checkForWinner(board) {
    const winningSequences = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let sequence of winningSequences) {
      const boardSequence = [
        board[sequence[0]],
        board[sequence[1]],
        board[sequence[2]],
      ];
      const player1IsWinner = boardSequence.every((value) => value === "X");
      if (player1IsWinner) {
        return { status: "win", player: "player1", sequence };
      }

      const player2IsWinner = boardSequence.every((value) => value === "O");
      if (player2IsWinner) {
        return { status: "win", player: "player2", sequence };
      }
    }

    // If there are no empty spots on the board
    if (board.filter((x) => x === "").length === 0) {
      return { status: "draw" };
    }

    return { status: "indefinite" };
  }

  async onCheckForExistingGame() {
    try {
      const game_code = await Redis.hget(
        this.request.cookie("username"),
        "game_code"
      );
      const game_exists = await Redis.exists(game_code);
      if (game_exists) {
        const board = await Redis.hget(game_code, "board");
        const winnerState = this.checkForWinner(JSON.parse(board));

        this.socket.emit("gameDoesExist", {
          board: JSON.parse(board),
          winnerState,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async onRequestRematch() {
    try {
      const username = this.request.cookie("username");
      const game_code = await Redis.hget(username, "game_code");

      const player_usernames = await Redis.hmget(
        game_code,
        "player1_username",
        "player2_username"
      );
      const other_player_username = player_usernames.find(
        (name) => name !== username
      );
      const other_player_socket_id = await Redis.hget(
        other_player_username,
        "socket_id"
      );

      this.socket.emitTo("playAgainRequest", { username }, [
        `tic-tac-toe#${other_player_socket_id}`,
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  async onPlayAgain({ status }) {
    try {
      const game_code = await Redis.hget(
        this.request.cookie("username"),
        "game_code"
      );
      await Redis.hset(
        game_code,
        "board",
        JSON.stringify(["", "", "", "", "", "", "", ""])
      );
      const player_usernames = await Redis.hmget(
        game_code,
        "player1_username",
        "player2_username"
      );

      const player1_socket_id = await Redis.hget(
        player_usernames[0],
        "socket_id"
      );
      const player2_socket_id = await Redis.hget(
        player_usernames[1],
        "socket_id"
      );
      const sockets = [
        `tic-tac-toe#${player1_socket_id}`,
        `tic-tac-toe#${player2_socket_id}`,
      ];

      if (status === "accepted") {
        this.socket.emitTo("restartGame", {}, sockets);
      } else {
        await Redis.hdel(player_usernames[0], "game_code");
        await Redis.hdel(player_usernames[1], "game_code");
        await Redis.del(game_code);
        this.socket.emitTo("endGame", {}, sockets);
      }
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = TicTacToeController;
