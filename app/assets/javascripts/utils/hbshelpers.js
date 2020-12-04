Handlebars.registerHelper( "when",function(operand_1, operator, operand_2, options) {

    var operators = {
        'eq': function(l,r) { return l == r; },
        'noteq': function(l,r) { return l != r; },
        'gt': function(l,r) { return Number(l) > Number(r); },
        'or': function(l,r) { return l || r; },
        'and': function(l,r) { return l && r; },
        '%': function(l,r) { return (l % r) === 0; }
    }
    , result = operators[operator](operand_1,operand_2);

    if (result) return options.fn(this);
    else  return options.inverse(this);

});

/* Get user attributes by giving a collection, the user_id, the attribute key name */
/* Example : {{#getUserAttributes ../members user_id "image"}} */

Handlebars.registerHelper('getUserAttributes', function(collection, id, attribute) {
    if (!collection || !id || !attribute)
        return null;
    var collectionLength = collection.length;
    for (var i = 0; i < collectionLength; i++) {
        if (collection[i].id === id) {
            return collection[i][attribute];
        }
    }
    return null;
});

Handlebars.registerHelper('ifIn', function(elem, list, options) {
    if (list && list.indexOf(elem) > -1) {
      return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('ifNotIn', function(elem, list, options) {
    if (list && list.indexOf(elem) == -1) {
      return options.fn(this);
    }
    return options.inverse(this);
});

// Or test on 1 boolean + 1 string
Handlebars.registerHelper('ifOr', function(aBoolean, bValue, bTested, options) {

    if (aBoolean || bValue == bTested)
        return options.fn(this);
    return options.inverse(this);
});

Handlebars.registerHelper('ifDm', function(userID, otherUserID, dmRooms, options) {

    if (!userID || !otherUserID || !dmRooms)
        return null;
    for (var count = 0; count < dmRooms.length; count++)
    {
        if ((userID == dmRooms[count].attributes.user1_id
            && otherUserID == dmRooms[count].attributes.user2_id)
            || (userID == dmRooms[count].attributes.user2_id
            && otherUserID == dmRooms[count].attributes.user1_id))
            return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('findDmRoom', function(userID, otherUserID, dmRooms) {

    if (!userID || !otherUserID || !dmRooms)
        return null;
    for (var count = 0; count < dmRooms.length; count++) {
        if ((userID == dmRooms[count].attributes.user1_id
            && otherUserID == dmRooms[count].attributes.user2_id)
            || (userID == dmRooms[count].attributes.user2_id
            && otherUserID == dmRooms[count].attributes.user1_id))
            return dmRooms[count].attributes.id;
    }
    return null;
});

Handlebars.registerHelper('ifCurrentDmRoom', function(userID, otherUserID, dmRooms, thisChatID, options) {

    if (!userID || !otherUserID || !dmRooms || !thisChatID)
        return null;
    for (var count = 0; count < dmRooms.length; count++)
    {
        if ((userID == dmRooms[count].attributes.user1_id
            && otherUserID == dmRooms[count].attributes.user2_id)
            || (userID == dmRooms[count].attributes.user2_id
            && otherUserID == dmRooms[count].attributes.user1_id))
        {
            if (dmRooms[count].attributes.id == thisChatID)
                return options.fn(this);
            else
                return options.inverse(this);
        }
    }
    return options.inverse(this);
});

Handlebars.registerHelper('ifDualReq', function(isDualReq, options) {

    if (isDualReq)
        return options.fn(this);
    return options.inverse(this);
});

Handlebars.registerHelper('ifRanked', function(isRanked, options) {

    if (isRanked)
        return options.fn(this);
    return options.inverse(this);
});