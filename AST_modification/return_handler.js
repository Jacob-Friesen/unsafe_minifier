var _ = require('underscore');

var u = require('../utility_functions.js');

// Handles moving returns in code, yes it really is this complicated.
module.exports = function returnHandler(){
    
    // Moves mergeFroms return statement to the end of mergeTo but saves the return values at the end of the
    // normal body insertion. Does this by assigning all return values to array values then returning those
    // at the end. Returns boolean for if both functions have return values
    this.moveReturns = function(mergeToBody, mergeFromBody, mergeFromEncapsulatingBody){
        var fromLast = _.last(mergeFromBody);
        
        // Insert old data with last part (the original return) removed before the rest of the mergeTo
        // function contents if its not empty.
        mergeFromBody.pop();
        if (mergeFromBody.length > 0)
            mergeToBody.unshift(mergeFromEncapsulatingBody);
            
        // Generate a new return by merging to and from returns if necessary and deleting the old to return
        // if necessary. Then add the new return at the end.
        var r = this.generateNewReturn(fromLast, _.last(mergeToBody));
        if (r.toHasReturn)
            mergeToBody.pop();
        mergeToBody.push(r.new_return);
        
        return r.toHasReturn;
    }
    
    // Generates a new return given the mergeFrom and mergeTo return statements. Returns generated return and
    // if the merging to function has a return statement.
    this.generateNewReturn = function(fromLast, toLast){
        var toHasReturn = false;
        var new_return = {
            type: "ReturnStatement",
            argument: {}
        }
        
        // Merge return values if both from and to both have return statements
        if (u.hasOwnPropertyChain(toLast, 'argument', 'type')){
            toHasReturn = true;
            
            // Deal with toLast having an array of returns (already merged to it)
            var elements = []
            if (u.hasOwnPropertyChain(toLast, 'argument', 'elements')){
                elements = toLast.argument.elements;
                this.addFromElements(fromLast, elements)
            }
            else{
                elements = [toLast.argument];
                this.addFromElements(fromLast, elements)
                //console.log(elements);
            }
                
            new_return.argument = {
                "type": "ArrayExpression",
                "elements": elements
            }
        }
        // Create a new return just for the merging from function
        else
            new_return.argument = fromLast.argument;
        
        return {new_return: new_return, toHasReturn: toHasReturn};
    }
    
    // Adds all the elements of the argue from the specified item and returns the new elements array
    this.addFromElements = function(fromLast, elements){
        if (u.hasOwnPropertyChain(fromLast, 'argument', 'elements'))
            _.each(fromLast.argument.elements, function(element){
                elements.unshift(element);
            });
        else if (u.hasOwnPropertyChain(fromLast, 'argument', 'expressions')){
            _.each(fromLast.argument.expressions.reverse(), function(element){
                elements.unshift(element);
            });
            fromLast.argument.expressions.reverse();
        }
        else
            elements.unshift(fromLast.argument);
            
        return elements;
    }
    
    return this;
}