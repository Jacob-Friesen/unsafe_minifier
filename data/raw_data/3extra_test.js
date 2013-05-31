function piIt(value){
    return Math.PI * value;
}

function loopIncrement(value, times){
    for (var i; i < times; i++)
            value += 1;
    return value;
}

var a = piIt(2);
var b = loopIncrement(0, 10);
/*test:
function loopIncrement(value, value, times) {
    for (var i; i < times; i++)
        value += 1;
    return [
        Math.PI * value,
        value
    ];
}
var _r = loopIncrement(2, 0, 10);
var a = _r[0];
var b = _r[1];
*/


Array.prototype.piThis = function(){
    for (var i = 0; i < this.length; i++)
        this[i] = Math.PI * this[i];
}

Array.prototype.initTo = function(value){
    for (var i = 0; i < this.length; i++)
        this[i] = value;
}

var arr = [1,2];
arr.initTo(1);
arr.piThis();
/*test:
Array.prototype.piThis = function (value) {
    {
        for (var i = 0; i < this.length; i++)
            this[i] = value;
    }
    for (var i = 0; i < this.length; i++)
        this[i] = Math.PI * this[i];
};
Array.prototype.initTo = null;
var arr = [
        1,
        2
    ];
arr.piThis(1);
*/


// from utility_functions.js
this.nullOrUndefined = function(item){
    return typeof item === 'undefined' || item === null;
}

// from utility_functions.js
this.randomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var a = this.randomInt(0, 2);
var b = this.nullOrUndefined(a);
/*test:
this.nullOrUndefined = function (min, max, item) {
    return [
        Math.floor(Math.random() * (max - min + 1)) + min,
        typeof item === 'undefined' || item === null
    ];
};
this.randomInt = null;
var _r = this.nullOrUndefined(0, 2, a);
var a = _r[0];
var b = _r[1];
*/

// from utility_functions.js
this.hasOwnPropertyChain = function(item /*variable length arguments*/){
    if (context.nullOrUndefined(item))
        return false
    
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

// from utility_functions.js
this.getJSONFile = function(file){
    if (file[file.length - 1] == ',') file = file.slice(0, -1);
    if (file[file.length - 2] == ',') file = file.slice(0, -2);
    var arrays = JSON.parse('[' + file + ']');
    
    // merge the arrays
    toReturn = [];
    arrays.forEach(function(array){
        array.forEach(function(obj){
            toReturn.push(obj);
        });
    });
    
    return toReturn;
}

var a = {b: ''}
var c = this.hasOwnPropertyChain(a, 'b');
var d = this.getJSONFile('{}');
/*test:
this.hasOwnPropertyChain = null;
this.getJSONFile = function (item, file) {
    {
        if (context.nullOrUndefined(item))
            return false;
        var args = Array.prototype.slice.call(arguments);
        args = args.slice(1);
    }
    if (file[file.length - 1] == ',')
        file = file.slice(0, -1);
    if (file[file.length - 2] == ',')
        file = file.slice(0, -2);
    var arrays = JSON.parse('[' + file + ']');
    toReturn = [];
    arrays.forEach(function (array) {
        array.forEach(function (obj) {
            toReturn.push(obj);
        });
    });
    return [
        function chain(item, _args) {
            if (!item.hasOwnProperty(_args[0]) || item[_args[0]] === null)
                return false;
            if (_args.length > 1)
                return chain(item[_args[0]], _args.slice(1));
            return true;
        }(item, args),
        toReturn
    ];
};
var a = { b: '' };
var _r = this.getJSONFile(a, 'b', '{}');
var c = _r[0];
var d = _r[1];
*/