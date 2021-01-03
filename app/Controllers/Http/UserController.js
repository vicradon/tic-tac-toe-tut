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
      return response.redirect("back");
    }
  }

  async logout({ response, session, request }) {
    try {
      const { username } = request.all();
      const game_code = await Redis.hget(username, "game_code");
      await Redis.del(username);
      await Redis.del(game_code);

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
}

module.exports = UserController;
