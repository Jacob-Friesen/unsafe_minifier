// Contains all messages for the application, including errors, each message object has an option to disable itself
var messages = {
    error: function(err){
        throw(err);
    },

    // Create a new object with toString as the message and has an send method. Has all the default methods of String. Prints if the printing object
    // has print set to true.
    form: function(message){
        var msg = new String(message);

        var print = this.print;
        msg.send = function(){
            if (print) console.log(message);
        }

        msg.error = function(){
            messages.error(message);
        }

        return msg;
    },

    // Adds a form set to messages.form and print set to true
    create: function(obj){
        if (typeof obj !== 'undefined' && obj !== null){
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
    },

    noFilesAST: function(){
        return this.form('Error: files and AST.body must be specified for mergeFunctions');
    },

    addArgsToElements: function(){
        return this.form('Error: Elements to add to was null or undefined.');
    },

    argsCouldntCopy: function(to, from){
        return this.form("Error: Second calls arguments could not be copied into the first: \n" + to + '\n' + from);
    },

    paramsCouldntCopy: function(to, from){
        return this.form("Error: Second function parameters could not be copied into the first: \n" + to + '\n' + from);
    },

    bodyCouldntCopy: function(to, from){
        return this.form("Error: Second function body could not be copied into the first: \n"  + to + '\n' + from);
    },

    noNameFunction: function(function_data){
        return this.form('Error: A function declaration has no name!\n' + function_data);
    }
});

messages.generation = messages.create({
    rawMergedDirectories: function(){
        return this.form('Error: raw and merged directories must be specified.');
    },

    filesNotSpecified: function(){
        return this.form('Error: files must be specified in main.js.');
    },

    noValidMergesCombinedData: function(){
        return this.form('Error: The validMerges or combinedData file was null or undefined');
    }
});

messages.training = messages.create({
    filesNotSpecified: messages.generation.filesNotSpecified,

    wrongTrainingDataFormat: function(){
        return this.form('Error: Training data must be in the form:\n' +
                         '[\n' +
                         '[[input1,input2,...,inputn], [output1,output2,...,outputn]]\n' +
                         '...' +
                         '\n]');
    },

    layerSizesNotSpecified: function(){
        return this.form('Error: The number of input, hidden and output nodes must be specified.');
    },

    dataErrorRateNotSpecified: function(){
        return this.form('Error: The data must be a non empty object and the errorRate must be a number');
    },

    noSaveFile: function(file){
        return this.form('The file to save a neural network to must be saved: ' + file);
    },

    testStats: function(successRate, positiveRate, negativeRate, success, tries, length){
        return this.form("\nAccuracy: " + successRate + " (" + (success[0] + success[1]) + "/" + length + ")" +
                         "\nPrecision: " + positiveRate + " (" + success[0] + "/" + tries[0] + ")" +
                         "\nNegative Rate: " + negativeRate + " (" + success[1] + "/" + tries[1] + ")");
    },

    saveNetwork: function(file){
        return this.form('The network has been saved to ' + file);
    }
});

messages.utility = messages.create({
    fileNoParse: function(file){
        return this.form('The file could not be parsed:\n' + file);
    }
})

module.exports = function(){
    return messages;
}
