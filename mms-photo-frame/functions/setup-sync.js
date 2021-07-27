/* eslint-disable no-console, func-names */

/**
 *
 * setup-sync.js
 * 
 * Creates a Sync Service and Sync List to utilize for
 * this deployment of the photo frame. 
 * 
 * Also creates an API Key/Secret pair to be used 
 * inside sync-token.js in signing the tokens
 * 
 * Returns the service SID
 */

exports.handler = async function (context, event, callback) {

  const helpersPath = Runtime.getFunctions()['helpers'].path;
  const { checkPasscode, getCurrentEnvironment, createEnvironmentVariable } = require(helpersPath);

  if (!checkPasscode(event.passcode, context.ADMIN_PASSCODE)) {
    return callback('Not authorized.');
  }

  /*
   * Like a cache, return early if the 
   * env has already been set.
   */
  if (context.SYNC_SERVICE_SID && context.TWILIO_API_KEY && context.TWILIO_API_SECRET) {
    return callback(null, {
      syncServiceSid: context.SYNC_SERVICE_SID
    });
  }

  const client = context.getTwilioClient();

  // Creating a Twilio API Key
  function createApiKey() {
    return client.newKeys.create()
        .then(new_key => new_key)
        .catch((err) => { throw new Error(err.details) });
  }

  // Creating a Sync Service
  function createSyncService() {
    return client.sync.services.create()
        .then(service => service)
        .catch((err) => { throw new Error(err.details) });
  }

  // Adding a List to a specified service
  function createSyncList(serviceSid) {
    return client.sync.services(serviceSid)
        .syncLists
        .create({
          uniqueName: context.SYNC_LIST_NAME
        })
        .then(sync_list => sync_list)
        .catch((err) => { throw new Error(err.details) });
  }

  const key = await createApiKey();
  console.log(`API Key created: ${ key.sid }`);
  const syncService = await createSyncService();
  console.log(`Sync Service created: ${ syncService.sid }`);
  const syncList = await createSyncList(syncService.sid);
  console.log(`Sync List created: ${ syncList.sid }`);

  const environment = await getCurrentEnvironment(context);
  await createEnvironmentVariable(context, environment, 'SYNC_SERVICE_SID', syncService.sid);
  await createEnvironmentVariable(context, environment, 'TWILIO_API_KEY', key.sid);
  await createEnvironmentVariable(context, environment, 'TWILIO_API_SECRET', key.secret);
  console.log('Variables created/updated');

  return callback(null, {
    syncServiceSid: syncService.sid
  });
};