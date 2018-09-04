var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose").set('debug', true);
var exphbs = require("express-handlebars");

var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/nprscrapin");

mongoose.Promise = Promise;

  // If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
  var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/npmscrapin";

  // Set mongoose to leverage built in JavaScript ES6 Promises
  // Connect to the Mongo DB
  mongoose.Promise = Promise;
  mongoose.connect(MONGODB_URI);

// Handlebars
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);

app.set("view engine", "handlebars");

// Routes

app.get("/", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      var hbsObject = {
        articles: dbArticle
      };
      res.render("index", hbsObject);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// A GET route for scraping the NPM website
app.get("/scrape", function(req, res) {
  axios.get("https://www.npr.org/sections/news/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article.item.has-image").each(function(i, element) {
      // Save an empty result object
      var result = {};
      result.title = $(this)
        .children("div")
        .children("h2")
        .children("a")
        .text();
      result.link = $(this)
        .children("div")
        .children("h2")
        .children("a")
        .attr("href");
      result.img = $(this)
        .children("div")
        .children("div")
        .children("a")
        .children("img")
        .attr("src");;
      result.summary = $(this)
        .children("div")
        .children("p")
        .children("a")
        .text();

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          // console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });
    res.redirect("/");
  });
});

// Route for grabbing a specific Article by id, populate it with corresponding note
app.get("/articles/:id", function(req, res) {
  db.Article.findById(req.params.id)
    .populate("note")
    .then(function(dbArticle) {
      var hbsObject = {
        articles: dbArticle
      };
      // console.log(dbArticle);
      res.render("note", dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id }, 
        { note: dbNote._id }, 
        { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
