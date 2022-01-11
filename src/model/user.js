const mongoose = require('mongoose');
import passportLocalMongoose from "passport-local-mongoose";

const Schema = mongoose.Schema;

var userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  username: {
      type: String
  },
  name: {
      type: String
  },
  date:  { 
    type: Date, 
    default: Date.now
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);