var mongoose = require("mongoose").set('debug', true);

var Schema = mongoose.Schema;

var NoteSchema = new Schema({
  body: { 
    type: String,
    required: false
  }
});

var Note = mongoose.model("Note", NoteSchema);

module.exports = Note;