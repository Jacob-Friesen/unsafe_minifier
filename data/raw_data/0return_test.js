function print(a){ console.log(a); }
function double(b){ return b * 2; }

print('hello');
var b = double(b);

function f1(x){
    x + x;
}

function noReturnMerge(y){
    y * y;
}
f1(5);
noReturnMerge(6);
/*test:
function noReturnMerge(x, y) {
    {
        x + x;
    }
    y * y;
}
noReturnMerge(5, 6);
*/

function f2(x){
    x + x;
}

function toReturnMerge(y){
    return y * y;
}
f2(5);
var a = toReturnMerge(6);
/*test:
function toReturnMerge(x, y) {
    {
        x + x;
    }
    return y * y;
}
var a = toReturnMerge(5, 6);
*/

function f3(x){
    x += x;
    return x;
}

function fromReturnMerge(y){
    y * y;
}
a = f3(5);
fromReturnMerge(6);
/*test:
function fromReturnMerge(x, y) {
    {
        x += x;
    }
    y * y;
    return x;
}
a = fromReturnMerge(5, 6);
*/

function f5(x){
    x = x;
    return x * x;
}

function fromToMerge(y){
    y = y;
    return y;
}
a = f5(5);
b = fromToMerge(6);
/*test:
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
*/

function f6(x){
    x = x;
    return x * x;
}

function fromToMergeTwoLocals(y){
    y = y;
    return y;
}
var c = f6(5);
var d = fromToMergeTwoLocals(6);
/*test:
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
*/


function f7(x){
    x = x;
    return x * x;
}

function f8(w){
    w/w;
}

function multipleTransfer1st(y){
    y = y;
}
var c = f7(5);
f8(6);
multipleTransfer1st(7);
//var c = multipleTransfer1st(5, 6, 7);
/*test:
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
*/

function f9(x){
    x * x;
}

function f10(w){
        return w/w;
}

function multipleTransfer2nd(y){
        y = y;
}
f9(5);
c = f10(6);
multipleTransfer2nd(7);
/*test:
function multipleTransfer2nd(x, w, y) {
    {
        x * x;
    }
    y = y;
    return w / w;
}
c = multipleTransfer2nd(5, 6, 7);
*/

function f11(x){
    return x * x;
}

function f12(w){
        return w/w;
}

function multipleTransfer1and2(y){
        y = y;
}
a = f11(5);
b = f12(6);
multipleTransfer1and2(7);
/*test:
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
*/


function f13(x){
    return x * x;
}

function f14(w){
        return w/w;
}

function multipleTransfer1and2and3(y){
        return y;
}
a = f13(5);
b = f14(6);
c = multipleTransfer1and2and3(7);
/*test:
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
*/
