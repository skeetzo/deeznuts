var db = require("mongoose-sql");
var e = process.environment;

// Create connection: note default environment variables
// returns a Knex instance
db.connect({
    client: e.DB_CLIENT || "pg",
    connection: {
      host: e.DB_HOST || "127.0.0.1",
      user: e.DB_USER || "user",
      password: e.DB_PASSWORD || "",
      database: e.DB_DATABASE || "test"
    }
});

// Get Knex instance if needed
var knex = db.getKnex();

// Use Mongoose-like operations upon PostgreSQL tables
var Cat_Schema = new db.Schema(CatModel);
var Cat = db.model("Cat", Cat_Schema);
Cat.find().exec(myHandler); // find() returns all rows
Cat.findById(123).exec(myHandler); // find by row id
Cat.findOne({name: 'fluffy'}).exec(myHandler); // findOne
Cat.where({name: 'fluffy'}).findOne().exec(myHandler); // find by where
Cat.find().sort('breed').exec(myHandler); // sort
Cat.find().populate('owner').exec(myHandler); // outer left join

var simba = new Cat( { CatObject } );
simba.save(function() {

});
simba.remove(function() {
    
});

// Migrations (WIP)
var mongoose = require("mongoose"); // instance Mongoose
var Cat_Schema_Mongo = new mongoose.Schema(CatModel); // make a mongoose schema
var Cat_Mongo = mongoose.model("Cat", Cat_Schema_Mongo); // make a mongoose model
db.migreateSchemas([Cat_Mongo]).then(function() { // call migreateSchemas with model
    console.log("moved data to PostgreSQL from Mongoose");
});