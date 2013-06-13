var test = {};
(function resetTestData(){
    test = {};

    test.loc1 = { 
        start: { line: 145, column: 8 },
        end: { line: 147, column: 5 }  
    };

    test.loc2 = { 
        start: { line: 154, column: 24 },
        end: { line: 154, column: 34 }  
    };

    test.loc3 = { 
        start: { line: 12, column: 24 },
        end: { line: 13, column: 34 }  
    };

    test.argument1 = {
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'Identifier', name: 'x', loc: [Object] },
        right: { type: 'Identifier', name: 'x', loc: [Object] },
        loc: test.loc1
    };

    test.argument2 = {
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'Literal', name: '2', loc: [Object] },
        right: { type: 'Literal', name: '3', loc: [Object] },
        loc: test.loc1
    };

    test.argument3 = {
        "type": "Literal",
        "value": 5,
        "raw": "5"
    };

    test.argument4 = {
        "type": "Literal",
        "value": 6,
        "raw": "6"
    };

    test.return1 = {
        type: 'ReturnStatement',
        argument: test.argument1,
        loc: test.loc1
    };

    test.return2 = {
        type: 'ReturnStatement',
        argument: test.argument3,
        loc: test.loc1
    };

    test.addArgsElements = [
        test.argument2
    ];

    test.returnArray1 = {
        type: 'ReturnStatement',
        argument: {
            "type": "ArrayExpression",
            "elements": [
                test.argument3,
                test.argument4
            ]
        },
        loc: test.loc1
    };

    test.returnArray2 = {
        type: 'ReturnStatement',
        argument: {
            "type": "ArrayExpression",
            "elements": [
                test.argument1,
                test.argument2
            ]
        },
        loc: test.loc1
    };

    test.ifStatement =  {
        "type": "IfStatement",
        "test": {
            "type": "Identifier",
            "name": "red"
        },
        "consequent": {
            "type": "ExpressionStatement",
            "expression": {
                "type": "AssignmentExpression",
                "operator": "=",
                "left": {
                    "type": "Identifier",
                    "name": "a"
                },
                "right": {
                    "type": "Identifier",
                    "name": "a"
                }
            }
        },
        "alternate": null
    };

    test.callExpression1 = { 
        type: 'CallExpression',
        callee: { 
            type: 'MemberExpression',
            computed: false,
            object: { 
                type: 'ThisExpression', 
                loc: test.loc2// Technically, a little off, but this level of detail doesn't matter
            },
            property: { 
                type: 'Identifier',
                name: 'f9',
                loc: test.loc2
            },
            loc: test.loc2
        },
        arguments: [
            { 
                type: 'Identifier',
                name: 'v',
                loc: test.loc2 
            } 
        ],
        loc: test.loc2
    }

    test.callExpression2 = { 
        type: 'CallExpression',
        callee: { 
            type: 'MemberExpression',
            computed: false,
            object: { 
                type: 'ThisExpression', 
                loc: test.loc3// Technically, a little off, but this level of detail doesn't matter
            },
            property: { 
                type: 'Identifier',
                name: 'f0',
                loc: test.loc3
            },
            loc: test.loc3
        },
        arguments: [],
        loc: test.loc3
    }

    test.variableDeclaration1 = { 
        type: 'VariableDeclaration',
        declarations: [
            { 
                type: 'VariableDeclarator',
                id: { 
                    type: 'Identifier',
                    name: 'a',
                    loc: test.loc1
                },
                init: test.callExpression1,
                loc: test.loc1
            }
        ],
        kind: 'var',
        loc: test.loc1,
    }

    test.variableDeclaration2 = { 
        type: 'VariableDeclaration',
        declarations: [
            { 
                type: 'VariableDeclarator',
                id: 
                { 
                    type: 'Identifier',
                    name: 'b',
                    loc: test.loc2
                },
                init: test.callExpression2,
                loc: test.loc2
            }
        ],
        kind: 'var',
        loc: test.loc1
    }


    test.blockBody1 = [
        test.ifStatement, 
        test.variableDeclaration, 
        test.returnArray1
    ];

    test.blockBody2 = [
        test.ifStatement,
        test.variableDeclaration,
        test.returnArray2
    ];

    test.blockBodyNoReturn = [
        test.ifStatement,
        test.variableDeclaration
    ];

    test.functionBody1 = { 
        type: 'BlockStatement',
        body: test.blockBody1,
        loc: test.loc2
    }

    test.functionBody2 = { 
        type: 'BlockStatement',
        body: test.blockBody2,
        loc: test.loc2
    }

    test.functionBodyNoReturn = { 
        type: 'BlockStatement',
        body: test.blockBodyNoReturn,
        loc: test.loc2
    }

    test.emptyFunctionExpression = { 
        type: 'FunctionExpression',
        id: null,
        params: [],
        defaults: [],
        body: { 
            type: 'BlockStatement',
            body: [],
            loc: test.loc1
        },
        rest: null,
        generator: false,
        expression: false,
        loc: test.loc1
    };

    test.assignmentExpression = { 
        type: 'AssignmentExpression',
        operator: '=',
        left: 
        { 
            type: 'Identifier',
            name: 'c',
            loc: test.loc1
        },
        right: test.callExpression1,
        loc: test.loc1
    }

    test.assignmentExpressionNestedObject = Object.nu(test.assignmentExpression);
    test.assignmentExpressionNestedObject.left = { 
        type: 'MemberExpression',
        computed: false,
        object: { 
            type: 'Identifier',
            name: 'Expr',
            loc: test.loc1
        },
        property: {
            type: 'Identifier',
            name: 'pseudos',
            loc: test.loc1
        },
        loc: test.loc1 
    }

    test.expressionStatement = {
        type: "ExpressionStatement",
        expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: {
                type: "Identifier",
                name: "a"
            },
            right: {
                type: "CallExpression",
                callee: {
                    type: "Identifier",
                    name: "red"
                },
                arguments: [
                    {
                        type: "Identifier",
                        name: "v"
                    }
                ]
            }
        }
    }

    test.expressionParent = { 
        type: 'ExpressionStatement',
        expression: { 
            type: 'AssignmentExpression',
            operator: '=',
            left: { 
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'Identifier',
                    name: 'a',
                    loc: test.loc3
                },
                property: { 
                    type: 'Identifier',
                    name: 'name',
                    loc: test.loc3 
                },
                loc: test.loc3
            },
            right: test.emptyFunctionExpression,
            loc: test.loc3
        },
        loc: test.loc3 
    }

    test.assignmentParent = [ 
        test.assignmentExpression,
        test.variableDeclaration1,
        test.expressionStatement
    ]

    test.functionDeclaration = {
        type: "FunctionDeclaration",
        id: {
            "type": "Identifier",
            "name": "test"
        },
        params: [
            {
                "type": "Identifier",
                "name": "a"
            },
            {
                "type": "Identifier",
                "name": "b"
            }
        ],
        defaults: [],
        body: {
            type: "BlockStatement",
            body:  [
                {
                    type: "ExpressionStatement",
                    expression: test.assignmentExpression
                },
                {
                    type: "ReturnStatement",
                    argument: {
                        type: "BinaryExpression",
                        operator: "*",
                        left: {
                            type: "Identifier",
                            name: "a"
                        },
                        right: {
                            type: "Identifier",
                            name: "b"
                        }
                    }
                }
            ]
        },
        rest: null,
        generator: false,
        expression: false,
        loc: test.loc1
    }

    test.parentArray = [
        test.emptyFunctionExpression,
        test.callExpression2,
    ]

    test.parentArray2 = [
        test.functionDeclaration,
        test.emptyFunctionExpression
    ]

    test.blockBodyParent = {
        type: 'BlockStatement',
        body: test.parentArray,
        loc: test.loc3
    }

    test.blockBodyParent2 = {
        type: 'BlockStatement',
        body: test.parentArray2,
        loc: test.loc3
    }

    test.fullItem1 = {
        data: test.callExpression2,
        parent: test.parentArray
        // there is more properties but they are irrelevant
    }

    test.fullItem2 = {
        data: test.emptyFunctionExpression,
        parent: test.blockBodyParent
        // there is more properties but they are irrelevant
    }

    test.resetTestData = resetTestData;
    return test;
})();

module.exports = test;
