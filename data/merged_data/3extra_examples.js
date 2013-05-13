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