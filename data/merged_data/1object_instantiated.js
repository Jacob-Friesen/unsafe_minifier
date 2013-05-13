var a = {
        inObjectMergeNoReturns: function (x, y) {
            {
                x + x;
            }
            y * y;
        }
    };
var b = a.inObjectMergeNoReturns(1, 2);
a = {
    inObjectToReturnMerge: function (x, y) {
        {
            x + x;
        }
        return y * y;
    }
};
b = a.inObjectToReturnMerge(1, 2);
a = {
    inObjectFromReturnMerge: function (x, y) {
        y * y;
        return x + x;
    }
};
var a = a.inObjectFromReturnMerge(1, 2);
a = {
    inObjectBothReturnMerge: function (x, y) {
        return [
            x + x,
            y * y
        ];
    }
};
var _r = a.inObjectBothReturnMerge(1, 2);
a = _r[0];
var b = _r[1];
var a = {
        outObjectMergeNoReturnsWithA: function (x, y) {
            {
                x + x;
            }
            y * y;
        },
        tryIt: function (v, w) {
            var b = a.outObjectMergeNoReturnsWithA(v, w);
        }
    };
a.tryIt(1, 2);
var a = {
        outObjectMergeNoReturnsWithThis: function (x, y) {
            {
                x + x;
            }
            y * y;
        },
        tryIt: function (v, w) {
            this.outObjectMergeNoReturnsWithThis(v, w);
        }
    };
a.tryIt(1, 2);
var a = {
        outObjectToReturnMerge: function (x, y) {
            {
                x + x;
            }
            return y * y;
        },
        tryIt: function (v, w) {
            var a = this.outObjectToReturnMerge(v, w);
        }
    };
a.tryIt(1, 2);
var a = {
        outObjectFromReturnMerge: function (x, y) {
            y * y;
            return x + x;
        },
        tryIt: function (v, w) {
            var a = this.outObjectFromReturnMerge(v, w);
        }
    };
a.tryIt(1, 2);
var a = {
        outObjectBothReturnMerge: function (x, y) {
            return [
                x + x,
                y * y
            ];
        },
        tryIt: function (v, w) {
            var _r = this.outObjectBothReturnMerge(v, w);
                        var a = _r[0];
                        var b = _r[1];
        }
    };
a.tryIt(1, 2);