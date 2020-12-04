"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class CourseSchema extends Schema {
  up() {
    this.create("courses", (table) => {
      table.increments();
      table.timestamps();
      table.string("title").nullable();
      table.string("code").notNullable();
      table.enu("grade", ["A", "B", "C", "D", "F"]).notNullable();
      table.integer("credit_load").unsigned().notNullable();
      table.enu("semester", [1, 2, 3, 4]).notNullable();
      table
        .enu("level", [100, 200, 300, 400, 500, 600, 700, 800, 900])
        .notNullable();
      table
        .integer("user_id")
        .unsigned()
        .nullable()
        .references("id")
        .inTable("users")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
    });
  }

  down() {
    this.drop("courses");
  }
}

module.exports = CourseSchema;
