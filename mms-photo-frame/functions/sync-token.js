/* eslint-disable no-console, func-names */

/**
 *
 * sync-token.js
 * 
 * Called by our client side JS code to generate a 
 * Sync token to our Sync Service.
 * 
 * Returns a token and a list name.
 */

 exports.handler = function(context, event, callback) {  

  // eslint-disable-next-line dot-notation
  const helpersPath = Runtime.getFunctions()['helpers'].path;
  const { checkPasscode } = require(helpersPath);

  if (!checkPasscode(event.passcode, context.ADMIN_PASSCODE)) {
    return callback('Not authorized.');
  }

  const TWILIO_ACCOUNT_SID = context.ACCOUNT_SID;
  const SERVICE_SID = context.SYNC_SERVICE_SID;
  const API_KEY = context.TWILIO_API_KEY;
  const API_SECRET = context.TWILIO_API_SECRET;
  
  const response = new Twilio.Response();
  
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');

  const IDENTITY = 'photo_frame_user';

  const {AccessToken} = Twilio.jwt;
  const {SyncGrant} = AccessToken;

  const syncGrant = new SyncGrant({
    serviceSid: SERVICE_SID
  });

  const accessToken = new AccessToken(
    TWILIO_ACCOUNT_SID,
    API_KEY,
    API_SECRET
  );

  accessToken.addGrant(syncGrant);
  accessToken.identity = IDENTITY;
  
  response.setBody({ 
    token: accessToken.toJwt(),
    listName: context.SYNC_LIST_NAME
  });

  return callback(null, response);
}