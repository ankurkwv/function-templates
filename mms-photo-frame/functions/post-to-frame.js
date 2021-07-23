exports.handler = function(context, event, callback) {
	if (!context.SYNC_SERVICE_SID && !context.SYNC_LIST_NAME) {
		return callback('Your app is not ready. Please run the setup.');
	}

    const twilioClient = context.getTwilioClient();

    let request = twilioClient.sync.services(context.SYNC_SERVICE_SID)
       .syncLists(context.SYNC_LIST_NAME)
       .syncListItems
       .create({
	       	data: {
	       		"caption": event.caption,
	       		"imgPath": event.image
	       	}
	   });
    
    request.then(function(result) {
       return callback(null, 'Posted');
    });
};