var u = require('../utility_functions.js');

// Return an inherited object so new properties won't affect other used copies of this object
module.exports = Object.nu({
    nullLiteral: {
        "type": "Literal",
        "value": null,
        "raw": "null"
    },

    emptyBlockStatement: {
        type: "BlockStatement",
        body: []
    },

    emptyReturn: {
        type: "ReturnStatement",
        argument: {}
    },

    argumentTemplate: {
        "type": "ArrayExpression",
        "elements": {}
    }
})