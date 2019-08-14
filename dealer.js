on('chat:message', (msg) => {
    if ('api' === msg.type && /!deal\b/i.test(msg.content) && msg.selected) {

        //get arguments
        const args = msg.content.split(/\s+--/);
        
       // use default of 'give' if parameter is missing or malformed
        const actions = ['give', 'take'];
        let cardAction = 'give';
        if (args[1] && actions.includes(args[1])) {
            cardAction = args[1];
        }
        
        //Use 'Playing Cards' if deck is not specified
        let deckChoice = args[2] || 'Playing Cards';

        log('cardAction is ' + cardAction);
        log('deckChoice is ' + deckChoice);

        //getid of deck
        let theDeck = findObjs({
            _type: "deck",
            name: deckChoice
        })[0];

        //test if deck exists
        if (!theDeck) {
            sendChat('Deal', '/w gm Create a deck named ' + deckChoice + '. If the intent is an Inspiration deck, it must be an infinite deck of one card only.');
            return;
        }


        let deckID = theDeck.id;
        let deckCards = theDeck.get('_currentDeck');
        log('The deck cards are ' + deckCards);
        // Necessary to shuffle at least once after deck creation because of Roll20 Deck bug
        //shuffleDeck(deckID);
        //get id of card
        let cardid = drawCard(deckID);

        // get playerId of Token controller
        //assign selected token to a variable

        log('number of tokens selected is ' + msg.selected.length);
        if (msg.selected.length > 1) {
            sendChat('Deal', '/w gm Please select only one token. It must represent player-controlled character.');
            return;
        }

        let token = getObj(msg.selected[0]._type, msg.selected[0]._id);

        //assign associated character to a variable
        if (!token.get('represents')) {
            sendChat('Deal', '/w gm This token does not represent a player character. Only players get cards.');
            return;
        }
        let character = getObj("character", token.get('represents'));

        //Get owner IDs of each -- Not needed at this point
        //tokenOwner = (token.get('controlledby').split(',')[0]);
        //characterOwner = (character.get('controlledby').split(',')[0]);
        // If the token represents a character, get the character's controller, otherwise the token's
        let ownerids = (token.get('controlledby').split(','));


        if (character) {
            ownerids = (character.get('controlledby').split(','));
        }
        //reduces to one ownerid that is not ['all']
        ownerid = ownerids.filter(s => s !== 'all')[0];


        // give card to player
        // If the ownerid is undefined (no valid controller) perform the transaction
        if (!ownerid) {
            sendChat('deal', '/w gm If a token represents a character controlled by \'All Players\', an individual player must be also be specified. If there are multiple controllers, only the first will get inspiration.');
            return;
        }

        switch (cardAction) {
            case 'take':

                let hand = findObjs({
                    type: 'hand',
                    parentid: ownerid
                })[0];
                let theHand = hand.get('currentHand');
                log('The cards in hand are  ' + theHand);

                cardid = (theHand.split(',').filter(x => deckCards.split(',').includes(x)))[0];

                log('The card to take is ' + cardid);


                if (theHand.length !== 0 && cardid !== undefined) {

                    takeCardFromPlayer(ownerid, {
                        cardid: cardid
                    });
                } else {
                    let deckName = theDeck.get('name');
                    sendChat('deal', '/w gm ' + token.get('name') + ' has no cards left to take from the ' + deckName + ' deck.');
                }

                break;
            default:
                giveCardToPlayer(cardid, ownerid);
                break;
        }
    }
});
