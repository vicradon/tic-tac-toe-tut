"use strict";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");

// Route.get("/", "HomeController.index").as("home");
Route.get("/", "HomeController.index").as("home");
Route.post("/", "UserController.register").as("register");
Route.post("/logout", "UserController.logout").as("logout");

Route.patch("/socket-id", "UserController.setSocketId");

Route.get("/game", "GameController.index").as("game");
Route.post("/game", "GameController.contactPlayer1");
Route.get("/game/code", "GameController.generateGameCode");
Route.get("/game/variables", "UserController.getInitialVariables");
