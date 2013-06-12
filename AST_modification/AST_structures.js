module.exports = {
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
}