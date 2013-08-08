// To Run: node main.js <flag(s)>
// To Run All: node main.js -g -t -m <your_file>
// flags:
// -h/help:      Display how to use program (your here currently)
// -g/-generate: Generate the test data
// -t/-train:    Train system on test data
// -m/-minify:   Minify a file using the network trained

var _ = require('lodash');

var messages = new require('./messages')(),
    DataGeneration = require('./generation'),
    Training = require('./training'),
    Minification = require('./minification');

function App(){
    var _this = this;

    this.DataGeneration = DataGeneration;
    this.Training = Training;
    this.Minification = Minification;

    this.LOCS = {
        rawDataDirectory: 'data/raw_data',
        mergedDataDirectory: 'data/merged_data',
        files: {
            mergeData: ['data/function_data/merge_data.json', true],// second part is clear on test data generate
            validMerges: ['data/function_data/valid_merges.json', false],// second part is clear on test data generate
            combinedData: ['data/function_data/combined.json', true],
            neuralNetwork: ['data/neural_networks/trained.json', true]
        }
    };

    this.generateTrainingData = function(callback){
        var generator = new _this.DataGeneration(_this.LOCS.rawDataDirectory, _this.LOCS.mergedDataDirectory, _this.LOCS.files);
        generator.generateData(null, callback);
    };

    this.trainSystem = function(callback){
        var training = new _this.Training(_this.LOCS.files);
        training.train(callback);
    };

    // Callback is used for consistency among different system starting sections, it is not currently used.
    this.minifyFile = function(callback, file){
        if (_.isEmpty(file))
            messages.minification.fileEmpty().error();
            
        var minification = new _this.Minification(_this.LOCS.files);
        minification.minifyFile(file);
    }

    // Needs to be after the functions it references instead of at the beggining so the functions referenced are defined.
    this.flagToFunction = {
        '-g': this.generateTrainingData,
        '-generate': this.generateTrainingData,
        '-t': this.trainSystem,
        '-train': this.trainSystem,
        '-m': this.minifyFile,
        '-minify': this.minifyFile
    };

    // Currently just creates the test data
    this.start = function(args){
        var thisFile = args[1].split('/').pop();
        if (args.length === 2 || args[2] === '-h' || args[2] === '-help')
            messages.startup.help(thisFile).send();
        else{
            if(!this.flagToFunction.hasOwnProperty(args[2]))
                messages.startup.invalidFlag(thisFile, args[2]).error();

            // Allow more than one consecutive flag so multple steps can be run at once
            (function runPart(index){
                console.log('index', index);

                _this.flagToFunction[args[index]](function(){
                    if (index >= args.length - 1)
                        return true;

                    if (typeof _this.flagToFunction[args[index + 1]] === 'undefined')
                        messages.startup.invalidFlag(thisFile, args[index + 1]).error();
                    else
                        runPart(index + 1);
                }, args[index + 1]);
            })(2);
        }
    };

    return this;
}

module.exports = App;

// Always start the system when this file is called from command line when not being tested
if (process.argv.length >= 2 && process.argv[1].indexOf('mocha') < 0){
    var app = new App();
    app.start(process.argv);
}