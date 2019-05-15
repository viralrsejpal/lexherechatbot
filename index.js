'use strict';

 const request = require('request');

 // FORMAT of Lex <> Lambda Request and Response 
 // REF : https://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html

 function formatResponse(sessionAttributes, fulfillmentState, location) {
     var chatReply = "Not able to locate!";
     if (location) {
         chatReply = location;
     }
     var message = {'contentType': 'PlainText', 'content': chatReply};
     return {
         sessionAttributes,
         dialogAction: {
             type: 'Close',
             fulfillmentState,
             message,
         },
     };
 }

 // Get the coordinates for a Truck by name
 // Coordinates are hard-coded for demo purposes
 function getTruckXYZ(name) {
     var coords = null;
     switch(name) {
     case 'ironman':
         coords = '28.63412, 77.2169';  // Delhi
         break;
     case 'captainamerica':
         coords = '18.94017, 72.83486';  // Mumbai
         break;
     case 'hulk':
         coords = '18.50422, 73.85302';  // Pune
         break;
     case 'thor':
         coords = '21.15707, 79.08218';  // Nagpur
         break;
     default:
         coords = null;  // for demo purposes we only, no error handling
     }
     return coords;
 }

 // --------------- Events -----------------------

 function dispatch(intentRequest, callback) {
     console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
     
     // Obtain APPID, APPCode from developer.here.com with a Freemium account
     // Configure the APP ID and APP Code in environment variables for the lambda runtime
     const APP_ID = process.env.APP_ID; // HERE APP ID stored in environment variables
     const APP_CODE = process.env.APP_CODE; // HERE APP Code stored in environment variables

     // FORMAT of Lex <> Lambda Request and Response 
     // REF : https://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html

     const sessionAttributes = intentRequest.sessionAttributes;
     const slots = intentRequest.currentIntent.slots;

     // Lower case to simplify the handling for case sensitive confusions
     const trackableTruck = slots.truckName.toLowerCase();
     var formattedResponse = null;
     var prox = getTruckXYZ(trackableTruck);
     if (prox) {

        // HERE Location Service to ( Reverse ) Geo Code 
        // REF : https://developer.here.com/api-explorer/rest/geocoder/reverse-geocode-district

         const url = 'https://reverse.geocoder.api.here.com/6.2/reversegeocode.json' +
             '?app_id=' + APP_ID +
             '&app_code=' + APP_CODE +
             '&prox=' + prox +
             '&mode=retrieveAreas&maxresults=1&gen=9';  
         request(url, { json: true }, (err, res, body) => {
             if (err) { return console.log('err: ', err); }
             console.log('statusCode:', res && res.statusCode);
             console.log('body: ', JSON.stringify(body));
             var location = body.Response.View[0].Result[0].Location.Address.Label;
             formattedResponse = formatResponse(sessionAttributes, 'Fulfilled', location);
             callback(formattedResponse);
         });
     } else {
         formattedResponse = formatResponse(sessionAttributes, 'Fulfilled', null);
     }
 }

 // --------------- Main handler -----------------------
 exports.handler = (event, context, callback) => {
     try {
         dispatch(event,
             (response) => {
                 callback(null, response);
             });
     } catch (err) {
         callback(err);
     }
 };