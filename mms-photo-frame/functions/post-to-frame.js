/* eslint-disable no-console, func-names, consistent-return */

/**
 *
 * post-to-frame.js
 * 
 * Used as the endpoint within a Studio Flow 
 * "Make HTTP Request" widget after the SMS/MMS
 * data capture is ready for posting
 * 
 */
exports.handler = function(context, event, callback) {

  // eslint-disable-next-line dot-notation
  const helpersPath = Runtime.getFunctions()['helpers'].path;
  const { checkPasscode } = require(helpersPath);

  if (!checkPasscode(event.passcode, context.ADMIN_PASSCODE)) {
    return callback('Not authorized.');
  }

  if (!context.SYNC_SERVICE_SID && !context.SYNC_LIST_NAME) {
    // Cannot post to a Sync list that doesn't exist!
    return callback('Your app is not ready. Please run the setup.');
  }

  const twilioClient = context.getTwilioClient();

  const request = twilioClient.sync.services(context.SYNC_SERVICE_SID)
    .syncLists(context.SYNC_LIST_NAME) // List name is defined automatically at setup as an env variable
    .syncListItems
    .create({
      data: {
        "caption": event.caption, // Decided within studio flow
        "imgPath": event.image // Decided within studio flow
      }
    });

  request.then(function(result) {
    return callback(null, 'Posted');
  }).catch(() => { return callback('Error') });

};