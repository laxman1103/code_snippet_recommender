const mongoose = require("mongoose");

const Schema = mongoose.Schema;
// Create Schema
const CodeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    lang: {
        type: String,
        required: true
    },
    contents: {
        type: String,
        required: true
    },
    meta: {
        type: [String],
        required: false
    },
    size: {
        type: Number,
        required: true
    },
    author: {
        type: String,
        required: false
    },
    is_correct: {
        type: Boolean,
        required: false
    },
    rating: {
        type: Number,
        required: false
    },
    count: {
        type: Number,
        required: false
    }
});
CodeSchema.index({name: 'text', content: 'text'});
var collectionName = 'code_bank'
module.exports = Code = mongoose.model("code_bank", CodeSchema, collectionName);
