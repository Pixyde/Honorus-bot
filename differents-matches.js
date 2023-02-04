const { Schema, model, models } = require("mongoose");

const matchesSchema = new Schema({   
    _team1: {
        type: String,
        required: true
    },
    _team1Disponibilities: {
        type: Array,
        required: false
    },
    _team2: {
        type: String,
        required: true
    },
    _team2Disponibilities: {
        type: Array,
        required: false
    },
    _startDate: {
        type: Date,
        required: true
    },
    _endDate: {
        type: Date,
        required: true
    },
    _choosedDate: {
        type: Date,
        required: false
    },
    _notified: {
        type: Number,
        require: false
    }
});

const name = "team-matches";
module.exports = models[name] || model(name, matchesSchema);