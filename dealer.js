on('chat:message', (msg) => {
    if ('api' === msg.type && /!deal\b/i.test(msg.content) && msg.selected) {
        //        log(msg);
        //get parameter and use default of 'give' if parameter is missing or malformed
        let cardAction = msg.content.split(/\s+--/)[1];
		let deckChoice = msg.content.split(/\s+--/)[2];
        if ((cardAction !== "give" && cardAction !== "take") || cardAction === false) {
            cardAction = 'give';
        }
		        if (deckChoice === false) {
            deckChoice = 'Playing Cards';
        }
		
        //getid of deck
        let theDeck = findObjs({
            _type: "deck",
            name: deckChoice
        })[0];

        //test if deck exists
        if (theDeck) {

            let deckID = theDeck.id;
            let deckCards = theDeck.get('_currentDeck');
            // Removed command to shuffle because of Roll20 Deck bug
//            shuffleDeck(deckID);
            //get id of card
            let cardid = drawCard(deckID);

            // get playerId of Token controller
            //assign selected token to a variable

            if (msg.selected.length <= 1) {

                let token = getObj(msg.selected[0]._type, msg.selected[0]._id);

                //assign associated character to a variable
                if (token.get('represents')) {
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
                    if (ownerid) {

                        switch (cardAction) {
                            case 'take':
                                
//                                let mydeck = getObj('deck',deckID);
//                                let myhand = mydeck.get('currentHand');
                                
                                let hand = findObjs({type:'hand',parentid:ownerid})[0];
                                let theHand = hand.get('currentHand');

                               cardid = (theHand.split(',').filter(x => deckCards.split(',').includes(x)))[0];
                               
                             



                                
                               if(theHand.length !== 0 && cardid!==undefined) {

                                takeCardFromPlayer(ownerid, {
                                    cardid: cardid
                                });
                               } else {
                                   let deckName = theDeck.get('name'); 
                               sendChat('deal', '/w gm '+ token.get('name') +' has no cards left to take from the '+deckName+' deck.');

                               }
                                
                                
                                
                                break;
                            default:
                                giveCardToPlayer(cardid, ownerid);
                                break;

                        }

                    } else {

                        sendChat('deal', '/w gm If a token represents a character controlled by \'All Players\', an individual player must be also be specified. If there are multiple controllers, only the first will get inspiration.');
                    }
                } else {
                    sendChat('Deal', '/w gm This token does not represent a player character. Only players get cards.');
                }
            } else {
                sendChat('Deal', '/w gm Please select only one token. It must represent player-controlled character.');
            }
        } else {
            sendChat('Deal', '/w gm Create a deck named '+deckChoice+ '. If the intent is an Inspiration deck, it must be an infinite deck of one card only.');
        }
    }
});
