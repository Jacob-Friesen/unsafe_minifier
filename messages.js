var u = require('./utility_functions.js');

// This contains all the messages printed using send used in this application. Some of them are dynamic, so they are functions.

// Create a new object that toStrings is the message and has an send method. Has all the default methods of String.  
function form(message){
    var msg = new String(message);
    
    msg.send = function(){
        console.log(message);
    }

    return msg;
}


var messages = {

    merging: {
        total: function(merges){
            return form('merged ' + merges + ' functions.\n');
        }
    }
}

module.exports = function(){
    return messages;
}
