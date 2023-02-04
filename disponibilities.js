const { Schema, model, models } = require("mongoose");

const disponibilitiesSchema = new Schema({   
    _teamID: {
        type: String,
        required: true
    },
    _matchID: {
        type: String,
        required: true
    },
    _userID: {
        type: String,
        required: true
    },
    _disponibilities: {
        type: Array,
        required: true
    }
});

const name = "user-disponibilities";
module.exports = models[name] || model(name, disponibilitiesSchema);