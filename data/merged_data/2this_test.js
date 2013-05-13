this.function1 = null;
this.noReturnMerge = function (x, y) {
    {
        x + x;
    }
    y * y;
};
this.noReturnMerge(1, 2);
this.function2 = null;
this.toReturnMerge = function (x, y) {
    {
        x + x;
    }
    return y * y;
};
var a = this.toReturnMerge(1, 2);
this.function3 = null;
this.fromReturnMerge = function (x, y) {
    y * y;
    return x + x;
};
a = this.fromReturnMerge(1, 2);
this.function4 = null;
this.bothReturnMerge = function (x, y) {
    return [
        x + x,
        y * y
    ];
};
var _r = this.bothReturnMerge(1, 2);
a = _r[0];
var b = _r[1];
a = function a() {
    this.inFunction1 = null;
    this.inFunctionToReturnMerge = function (x, y, z) {
        {
            x + y;
        }
        return z * z;
    };
    return this;
};
a = a.inFunctionToReturnMerge(1, 2, 3);
a = function a() {
    this.inFunction2 = null;
    this.inFunctionBothReturnMerge = function (x, y, z) {
        return [
            x + y,
            z * z
        ];
    };
    return this;
};
_r = a.inFunctionBothReturnMerge(1, 2, 3);
a = _r[0];
b = _r[1];
a = function a() {
    this.inFunction3 = null;
    this._inFunctionNoReturnMerge = function (x, y, z) {
        {
            x + y;
        }
        z * z;
    };
    this.otherFunction = function (b, a, c) {
        this._inFunctionNoReturnMerge(a, b, c);
    };
    return this;
};
a = function a() {
    this.inFunction4 = null;
    this._inFunctionToReturnMerge = function (x, y, z) {
        {
            x + y;
        }
        return z * z;
    };
    this.otherFunction = function (b, a, c) {
        c = this._inFunctionToReturnMerge(a, b, c);
    };
    return this;
};
a = function a() {
    this.inFunction5 = null;
    this._inFunctionFromReturnMerge = function (x, y, z) {
        z * z;
        return x + y;
    };
    this.otherFunction = function (b, a, c) {
        a = this._inFunctionFromReturnMerge(a, b, c);
    };
    return this;
};
a = function a() {
    this.inFunction6 = null;
    this._inFunctionBothReturnMerge = function (x, y, z) {
        return [
            x,
            y,
            z * z
        ];
    };
    this.otherFunction = function (b, a, c) {
        _r = this._inFunctionBothReturnMerge(a, b, c);
                a = _r[0];
                b = _r[1];
    };
    return this;
};