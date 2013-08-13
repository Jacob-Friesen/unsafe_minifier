// AST Structures used to modify and check the AST for a given file. 
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