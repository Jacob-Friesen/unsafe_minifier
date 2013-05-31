var a = {
    f1: function(x){
        x + x;
    },
    
    inObjectMergeNoReturns: function(y){
        y * y;
    }
}

a.f1(1);
var b = a.inObjectMergeNoReturns(2); // useless var is intentional
/*test:
var a = {
        inObjectMergeNoReturns: function (x, y) {
            {
                x + x;
            }
            y * y;
        }
    };
var b = a.inObjectMergeNoReturns(1, 2);
*/

a = {
    f2: function(x){
        x + x;
    },
    
    inObjectToReturnMerge: function(y){
        return y * y;
    }
}

a.f2(1);
b = a.inObjectToReturnMerge(2);
/*test:
a = {
    inObjectToReturnMerge: function (x, y) {
        {
            x + x;
        }
        return y * y;
    }
};
b = a.inObjectToReturnMerge(1, 2);
*/

a = {
    f3: function(x){
        return x + x;
    },
    
    inObjectFromReturnMerge: function(y){
        y * y;
    }
}

var a = a.f3(1);
a.inObjectFromReturnMerge(2);
/*test:
a = {
    inObjectFromReturnMerge: function (x, y) {
        y * y;
        return x + x;
    }
};
var a = a.inObjectFromReturnMerge(1, 2);
*/

a = {
    f4: function(x){
        return x + x;
    },
    
    inObjectBothReturnMerge: function(y){
        return y * y;
    }
}

a = a.f4(1);
var b = a.inObjectBothReturnMerge(2);
/*test:
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
*/

// Now do the same for merging in an object

var a = {
    f5: function(x){
        x + x;
    },
    
    outObjectMergeNoReturnsWithA: function(y){
        y * y;
    },

    tryIt: function(v,w){
        a.f5(v);
        var b = a.outObjectMergeNoReturnsWithA(w);
    }
}
// (enough lines away, so as not to cause a double merge)
//
//
a.tryIt(1,2);

/*test:
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
*/

var a = {
    f6: function(x){
        x + x;
    },
    
    outObjectMergeNoReturnsWithThis: function(y){
        y * y;
    },

        tryIt: function(v,w){
                this.f6(v);
                this.outObjectMergeNoReturnsWithThis(w);
        }
}
// (enough lines away, so as not to cause a double merge)
//
a.tryIt(1,2);
/*test:
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
*/

var a = {
    f7: function(x){
        x + x;
    },
    
    outObjectToReturnMerge: function(y){
        return y * y;
    },

    tryIt: function(v,w){
        this.f7(v);
        var a = this.outObjectToReturnMerge(w);
    }
}
// (enough lines away, so as not to cause a double merge)
//
a.tryIt(1,2);
/*test:
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
*/

var a = {
    f8: function(x){
        return x + x;
    },
    
    outObjectFromReturnMerge: function(y){
        y * y;
    },

    tryIt: function(v,w){
        this.f8(v);
        var a = this.outObjectFromReturnMerge(w);
    }
}
// (enough lines away, so as not to cause a double merge)
//
a.tryIt(1,2);
/*test:
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
*/

var a = {
    f9: function(x){
        return x + x;
    },
    
    outObjectBothReturnMerge: function(y){
        return y * y;
    },

    tryIt: function(v,w){
        var a = this.f9(v);
        var b = this.outObjectBothReturnMerge(w);
    }
}
// (enough lines away, so as not to cause a double merge)
//
a.tryIt(1,2);
/*test:
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

*/
