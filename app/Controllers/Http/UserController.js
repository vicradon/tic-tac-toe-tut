"use strict";

const Redis = use("Redis");
const { validateAll } = use("Validator");
class UserController {
  async register({ request, response, session }) {
    try {
      const { username } = request.all();

      const userExists = await Redis.exists(username);
      if (userExists) {
        session.flash({ error: `${username} already taken, choose another` });
        return response.redirect("back");
      }

      session.flash({ success: "Account created successfully" });
      response.cookie("username", username);

      return response.redirect("back");
    } catch (error) {
      session.flash({ error: error.message });
      console.error({ "registeration error": error });

      return response.redirect("back");
    }
  }

  async logout({ response, session, request }) {
    try {
      const { username } = request.all();
      await Redis.del(username);

      response.clearCookie("username");
      return response.redirect("/");
    } catch (error) {
      session.flash({ error: error.message });
      return response.redirect("back");
    }
  }
  async setSocketId({ request, response }) {
    try {
      const { socket_id } = request.all();

      const username = request.cookie("username");
      await Redis.hset(username, "socket_id", socket_id);

      return response.ok("set socket id");
    } catch (error) {
      console.error(error);
    }
  }
  async getInitialVariables({ request, response }) {
    try {
      const username = request.cookie("username");
      const game_code = await Redis.hget(username, "game_code");
      // [player_stats, next_player]
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

module.exports = UserController;
