function noReturnMerge(x, y) {
    {
        x + x;
    }
    y * y;
}
noReturnMerge(5, 6);
function toReturnMerge(x, y) {
    {
        x + x;
    }
    return y * y;
}
var a = toReturnMerge(5, 6);
function fromReturnMerge(x, y) {
    {
        x += x;
    }
    y * y;
    return x;
}
a = fromReturnMerge(5, 6);
function fromToMerge(x, y) {
    {
        x = x;
    }
    y = y;
    return [
        x * x,
        y
    ];
}
_r = fromToMerge(5, 6);
a = _r[0];
b = _r[1];
function fromToMergeTwoLocals(x, y) {
    {
        x = x;
    }
    y = y;
    return [
        x * x,
        y
    ];
}
var _r = fromToMergeTwoLocals(5, 6);
var c = _r[0];
var d = _r[1];
function multipleTransfer1st(x, w, y) {
    {
        x = x;
    }
    {
        w / w;
    }
    y = y;
    return x * x;
}
var c = multipleTransfer1st(5, 6, 7);
function multipleTransfer2nd(x, w, y) {
    {
        x * x;
    }
    y = y;
    return w / w;
}
c = multipleTransfer2nd(5, 6, 7);
function multipleTransfer1and2(x, w, y) {
    y = y;
    return [
        x * x,
        w / w
    ];
}
_r = multipleTransfer1and2(5, 6, 7);
a = _r[0];
b = _r[1];
function multipleTransfer1and2and3(x, w, y) {
    return [
        x * x,
        w / w,
        y
    ];
}
_r = multipleTransfer1and2and3(5, 6, 7);
a = _r[0];
b = _r[1];
c = _r[2];