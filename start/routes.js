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

Route.on("/").render("welcome");

Route.group(() => {
  Route.post("register", "UserController.register").middleware("guest");
  Route.post("login", "UserController.login").middleware("guest");

  Route.get("/users/profile", "UserController.show").middleware(["auth"]);
  Route.patch("/users/profile", "UserController.updateProfile").middleware([
    "auth",
  ]);
  Route.patch("/users/email", "UserController.updateEmail").middleware([
    "auth",
  ]);
  Route.patch("/users/password", "UserController.updatePassword").middleware([
    "auth",
  ]);

  Route.resource("courses", "CourseController").apiOnly().middleware(["auth"]);

}).prefix("api/v1");
