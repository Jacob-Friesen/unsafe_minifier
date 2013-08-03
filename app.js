// To Run: node main.js <flag(s)>
// To Run All: node main.js -g -t -m <your_file>
// flags:
// -h/help:      Display how to use program (your here currently)
// -g/-generate: Generate the test data
// -t/-train:    Train system on test data
// -m/-minify:   Minify a file using the network trained

var DataGeneration = require('./generation');
var Training = require('./training');
var Minification = require('./minification');

function App(){
    var _this = this;
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

    this.generateTestData = function(callback){
        console.log('\ngenerating data...');
        
        var generator = new DataGeneration(_this.LOCS.rawDataDirectory, _this.LOCS.mergedDataDirectory, _this.LOCS.files);
        generator.generateData(null, function(){
            console.log('done generating data.\n');
            callback();
        });
    };

    this.trainSystem = function(callback){
        var training = new Training(_this.LOCS.files);
        training.train(callback);
    };

    this.minifyFile = function(callback, file){
        if (typeof file === 'undefined')
            throw('Error: merging file must be specified');
            
        var minification = new Minification(_this.LOCS.files);
        minification.minifyFile(file);
    }

    this.flagToFunction = {
        '-g': this.generateTestData,
        '-generate': this.generateTestData,
        '-t': this.trainSystem,
        '-train': this.trainSystem,
        '-m': this.minifyFile,
        '-minify': this.minifyFile
    };

    // Currently just creates the test data
    this.start = function(){
        if (process.argv.length === 2 || process.argv[2] === '-h' || process.argv[2] === '-help'){
            console.log('\nUsage: ' + process.argv[1].split('/').pop() + ' <flag>\n',
                        'Flags:\n',
                        '-h/help:      Display how to use program (your here currently)\n',
                        '-g/-generate: Generate the test data\n',
                        '-t/-train:    Train system on test data\n',
                        '-m/-minify:   Minify a file using the network trained\n'
                        );
        }
        else{
            // Allow more than one consecutive flag so multple steps can be run at once
            this.flagToFunction[process.argv[2]](function(){

                if (_this.flagToFunction[process.argv[3]]){

                    _this.flagToFunction[process.argv[3]](function(){

                        if (_this.flagToFunction[process.argv[4]])
                            _this.flagToFunction[process.argv[4]](null, process.argv[5]);
                    }, process.argv[4]);
                }
            }, process.argv[3]);
        }
    };

    return this;
}

module.exports = App;

// Always start the system when this file is called from command line when not being tested
if (process.argv.length >= 2 && process.argv[1].indexOf('mocha') < 0){
    var app = new App();
    app.start();
}