const mongoose = require("mongoose");
const validator = require("validator")
const jwt = require('jsonwebtoken')

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                 throw new Error('Email is invalid')
              }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

UserSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ userId: user.id, email: user.email },
        "thesecretcode",
        { expiresIn: "1h" })
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

module.exports = User = mongoose.model("users", UserSchema);