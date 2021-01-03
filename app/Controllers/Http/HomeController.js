"use strict";
const Redis = use("Redis");
class HomeController {
  async index({ view, request }) {
    const game_code = await Redis.hget(request.cookie("username"), "game_code");
    const username = request.cookie("username");
    return view.render("home", { game_code, username });
  }
}

module.exports = HomeController;
