var u = require('./utility_functions.js');

// Contains all messages for the application, each message object has an option to disable itself
var messages = {

    // Create a new object with toString as the message and has an send method. Has all the default methods of String. Prints if the printing object
    // has print set to true.
    form: function(message){
        var msg = new String(message);

        var print = this.print;
        msg.send = function(){
            if (print) console.log(message);
        }

        return msg;
    },

    // Adds a form set to messages.form and print set to true
    create: function(obj){
        if (!u.nullOrUndefined(obj)){
            obj.form = messages.form;
            obj.print = true;
        }

        return obj;
    }
}

messages.merging = messages.create({
    noFile: function(){
        return this.form('merging file with no name...');
    },

    file: function(fileName){
        return this.form('merging ' + fileName + '...');
    },

    merge: function(toName, fromName){
        return this.form('  merging: ' + toName + "->" + fromName);
    },

    total: function(merges){
        return this.form('merged ' + merges + ' functions.\n');
    }
});

module.exports = function(){
    return messages;
}
