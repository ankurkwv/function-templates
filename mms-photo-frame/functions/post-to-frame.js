/* eslint-disable no-console, func-names */

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
	if (!context.SYNC_SERVICE_SID && !context.SYNC_LIST_NAME) {
		// Cannot post to a Sync list that doesn't exist!
		return callback('Your app is not ready. Please run the setup.');
	}

    const twilioClient = context.getTwilioClient();

    let request = twilioClient.sync.services(context.SYNC_SERVICE_SID)
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
    });
};