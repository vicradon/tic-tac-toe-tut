"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class Course extends Model {
  static get hidden() {
    return ["created_at", "updated_at", "user_id"];
  }
  user() {
    return this.belongsTo("App/Models/User");
  }
}

module.exports = Course;
