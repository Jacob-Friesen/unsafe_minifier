-=Introduction=-
Welcome to the worlds first unsafe minifier (or at least I think). Read Report.pdf for details on what this application does and analysis. All of the code is my own except what is in node_modules, safe_minifier and some code in data (see the README in there for specifics). The top file is main.js in this directory. Once you have installed the applications prerequisites you can type "node main.js" to get help on running the application.

-=Installation=-
-View install.txt

-=Directories=- 
-AST_modification: Code to transform ASTs, mostly function merging. Includes statistics generation.
-data: where raw, transformed, and statistical data is contained.
-data_generation: Code used to create data for the project.
-minification: Code used to minify a sent in file.
-node_modules: Libraries that were used in my code are stored here.
-safe_minifier: The YUI Compressor, yes it's in Java and no there seems to be no good well known non-Java minifiers.
-training: Code to train and save the nueral networks.

-=Files=-
-main.js: Central file that runs everything.
-Report.pdf: Report on why I made the choices I did and some of the data behind those choices.
-Selector.js: A moderately complex example file to minify, results on this are mixed and would reflect real files.
-simple_example: A two function file with 2 calls that can be minified, same example as in report.
-simple_example.min.js: The simple example unsafely minified.
-simple_example.full.min.js: The simple example unsafely minified and then safely minified.
-simple_example.safe.min.js: The simple example just safely minified.
-utility_functions.js: A bunch of functions I wrote (except the custom array remove) for use in the entire program.
-install.txt: Instructions on how to install things.
