var _ = require('lodash');

var u = require('../utility_functions.js');

// Handles moving returns in code, yes it really is this complicated.
module.exports = function ReturnHandler(){

    // Takes 2 function bodies. Moves mergeFroms return statement to the end of mergeTo but saves the return values at the end of the normal body
    // insertion. Does this by assigning all return values to array values then returning those at the end. Then mergeFrom's body without a return is
    // copied before all of merge to's body. Returns true for if both functions have return values.
    this.moveReturns = function(to, from){
        var bothHaveReturns = false;
        if (!u.enu(to) && !u.enu(from)){
            var fromLast = _.last(from.body);
            
            // Insert old data with last part (the original return) removed before the rest of the mergeTo function contents if its not empty.
            from.body.pop();
            if (from.body.length > 0)
                to.body.unshift(from);
                
            // Generate a new return by merging to and from returns if necessary and deleting the old to return if necessary. Then add the new return at
            // the end. Make sure any loc values from copied returns are retained.
            var r = this.generateNewReturn(_.last(to.body), fromLast);
            if (r.returnInTo){
                r.newReturn.loc = _.last(to.body).loc;
                to.body.pop();
            }
            else
                r.newReturn.loc = fromLast.loc;
            to.body.push(r.newReturn);

            if (r.returnInTo && u.hasOwnPropertyChain(fromLast, 'argument'))
                bothHaveReturns = true;
        }
        
        return bothHaveReturns;
    }
    
    // Generates a new return given the two return bodies. Returns the new return and if the merging to return has a return statement in object:
    //     {newReturn: <the generated return>
    //      returnInTo: <if the second function body had a return>}
    this.generateNewReturn = function(to, from){
        var returnInTo = false;
        var newReturn = {
            type: "ReturnStatement",
            argument: {}
        }
        
        // Merge return values if both from and to both have return statements
        if (!u.enu(to) && u.hasOwnPropertyChain(to, 'argument')){
            returnInTo = true;
            
            // Deal with toLast having an array of returns (already merged to it)
            var elements = [];
            if (u.hasOwnPropertyChain(to, 'argument', 'elements')){
                // Deep copy of toLast to ensure it is not modified by adding to elements
                elements = _.cloneDeep(to.argument.elements);
                elements = this.addArgsToElements(from, elements);
            }
            else{
                elements = [to.argument];
                elements = this.addArgsToElements(from, elements);
            }
                
            newReturn.argument = {
                "type": "ArrayExpression",
                "elements": elements
            }
        }
        // If the second return cannot work give the return the first functions argument
        else if(!u.enu(from))
            newReturn.argument = from.argument;
        
        return {newReturn: newReturn, returnInTo: returnInTo};
    }
    
    // Adds all the elements of the arguments from item to the arguments in the elements list. Returns the elements list with those arguments appended
    // at the beginning.
    this.addArgsToElementsError = 'Elements to add to was null or undefined.';
    this.addArgsToElements = function(item, elements){
        if (u.nullOrUndefined(elements))
            throw(this.addArgsToElementsError);

        if (!_.isEmpty(item)){
            if (u.hasOwnPropertyChain(item, 'argument', 'elements')){
                item.argument.elements.reverse().forEach(function(element){
                    elements.unshift(element);
                });
                item.argument.elements.reverse();// reverse is an in place modifier so must reset state
            }
            else if (u.hasOwnPropertyChain(item, 'argument'))
                elements.unshift(item.argument);
        }
            
        return elements;
    }
    
    return this;
}