"use strict";
const Ws = use("Ws");
const Redis = use("Redis");
const { validateAll } = use("Validator");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  5
);

class GameController {
  async contactPlayer1({ request, response, session }) {
    try {
      const { game_code } = request.all();
      const rules = { game_code: "required" };

      const validation = await validateAll(request.all(), rules);
      if (validation.fails()) {
        session.withErrors(validation.messages()).flashAll();
        return response.redirect("back");
      }

      const game_code_exists = await Redis.exists(game_code);
      if (!game_code_exists) {
        session.flash({ error: "No user with such game code" });
        return response.redirect("back");
      }

      const player1_username = await Redis.hget(game_code, "player1_username");
      const player2_username = request.cookie("username");

      const player1_socket_id = await Redis.hget(player1_username, "socket_id");

      await Redis.hset(player2_username, "game_code", game_code);
      await Redis.hset(
        game_code,
        "board",
        JSON.stringify(["", "", "", "", "", "", "", "", ""]),
        "next_player",
        "player1",
        "player2_username",
        player2_username,
        `${player1_username}_stats`,
        JSON.stringify({
          mark: "X",
          score: 0,
          player_id: "player1",
          other_player: player2_username,
        }),
        `${player2_username}_stats`,
        JSON.stringify({
          mark: "O",
          score: 0,
          player_id: "player2",
          other_player: player1_username,
        })
      );

      const channel = Ws.getChannel("tic-tac-toe").topic("tic-tac-toe");
      channel.emitTo("startGame", {}, [`tic-tac-toe#${player1_socket_id}`]);

      return response.redirect("/game");
    } catch (error) {
      console.error(error);
    }
  }

  async index({ view, request, response }) {
    try {
      if (!request.cookie("username")) {
        return response.redirect("/");
      }
      const game_code = await Redis.hget(
        request.cookie("username"),
        "game_code"
      );
      const gameObject = await Redis.hgetall(game_code);

      const { score: player1_score } = JSON.parse(
        gameObject[`${gameObject.player1_username}_stats`]
      );
      const { score: player2_score } = JSON.parse(
        gameObject[`${gameObject.player2_username}_stats`]
      );

      const pageData = {
        player1_username: gameObject.player1_username,
        player2_username: gameObject.player2_username,
        player1_score: String(player1_score),
        player2_score: String(player2_score),
        username: request.cookie("username"),
      };
      return view.render("game", pageData);
    } catch (error) {
      console.error(error);
    }
  }

  async generateGameCode({ request, response }) {
    try {
      const game_code = nanoid();
      await Redis.hset(
        game_code,
        "player1_username",
        request.cookie("username")
      );
      await Redis.hset(request.cookie("username"), "game_code", game_code);

      return response.redirect("back");
    } catch (error) {}
  }

  async getInitialVariables({ request, response }) {
    try {
      const username = request.cookie("username");
      const game_code = await Redis.hget(username, "game_code");
      const initialVars = await Redis.hmget(
        game_code,
        `${username}_stats`,
        "next_player"
      );

      const { mark, player_id, other_player } = JSON.parse(initialVars[0]);
      const next_player = initialVars[1];
      const canMove = player_id === next_player;

      return response.ok({
        player_mark: mark,
        canMove,
        other_player,
        my_username: username,
      });
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = GameController;
