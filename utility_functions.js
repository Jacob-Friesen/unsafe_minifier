/*
 * This is a set of functions and object modifications that are unrelated to anything and are used in a wide variety of contexts.
 **/

module.exports = (function(){
    var context = this;
    
    // Array Remove - By John Resig (MIT Licensed), modified with a too high and too low checker
    // Note: delete arr[index] leaves undefined elements in the array, no shifting is done. Hence why this is needed.
    Array.prototype.remove = function(from, to) {
        if (from >= this.length || from <= this.length * -1) return null;// modified here

        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };
    
    this.randomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    this.nullOrUndefined = function(item){
        return typeof item === 'undefined' || item === null;
    }
        
    // Check if item is null then if it has property, then check if its null, then check next property etc. Arguments must be in string form.
    this.hasOwnPropertyChain = function(item /*variable length arguments*/){
        if (!arguments.length) return true;
        if (context.nullOrUndefined(item)) return false;

        if (arguments.length < 2) return true;
        
        var args = Array.prototype.slice.call(arguments);// turn arguments into basic array
            args = args.slice(1);// exclude original item to search for
        
        return function chain(item, _args){
            if (!item.hasOwnProperty(_args[0]) || item[_args[0]] === null)
                return false
            if (_args.length > 1)
                return chain (item[_args[0]], _args.slice(1))
            return true;
        }(item, args);
    }
    
    // Since JSON files are inserted into multiple times they must be reread by treating the file as an array of arrays object. Each array had a
    // comma inserted after itself. So the last comma must be eliminated then the code wrapped in an object to parse. Finally, the arrays are merged
    // into a singular object, this is what is returned.
    this.fileErrorMessage = 'The file could not be parsed:\n';
    this.getJSONFile = function(file){
        if (context.nullOrUndefined(file)) return null;

        if (file[file.length - 1] == ',') file = file.slice(0, -1);
        if (file[file.length - 2] == ',') file = file.slice(0, -2);
        try {
            var arrays = JSON.parse('[' + file + ']');
        } catch (e) {
            throw(context.fileErrorMessage + file);
        }
        console.log('file');
        console.log(file);
        console.log('arrays')
        console.log(arrays)
        
        // merge the arrays
        toReturn = [];
        arrays.forEach(function(array){
            toReturn = toReturn.concat(array);
        });
        
        return toReturn;
    }
    
    return this;
})();