/* eslint-disable no-console, func-names */
/* thanks to the vaccine-standby team for the boilerplate for this function : https://github.com/twilio-labs/function-templates/blob/main/vaccine-standby/functions/setup.js */

exports.handler = async function (context, event, callback) {

  if (context.SYNC_SERVICE_SID && context.TWILIO_API_KEY && context.TWILIO_API_SECRET) {
    return callback(null, {
      syncServiceSid: context.SYNC_SERVICE_SID
    });
  }

  const helpersPath = Runtime.getFunctions()['helpers'].path;
  const { getCurrentEnvironment, createEnvironmentVariable } = require(helpersPath);

  const client = context.getTwilioClient();

  function createApiKey() {
    return client.newKeys.create()
        .then(new_key => new_key)
        .catch((err) => { throw new Error(err.details) });
  }

  function createSyncService() {
    return client.sync.services.create()
        .then(service => service)
        .catch((err) => { throw new Error(err.details) });
  }

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
  console.log('API Key created: ' + key.sid);
  const syncService = await createSyncService();
  console.log('Sync Service created: ' + syncService.sid);
  const syncList = await createSyncList(syncService.sid);
  console.log('Sync List created: ' + syncList.sid);

  // No environment exists when developing locally
  if (context.DOMAIN_NAME && !context.DOMAIN_NAME.startsWith("localhost")) {
    const environment = await getCurrentEnvironment(context);
    await createEnvironmentVariable(context, environment, 'SYNC_SERVICE_SID', syncService.sid);
    await createEnvironmentVariable(context, environment, 'TWILIO_API_KEY', key.sid);
    await createEnvironmentVariable(context, environment, 'TWILIO_API_SECRET', key.secret);
    console.log('Hosted environment variables created');
  }

  return callback(null, {
    syncServiceSid: syncService.sid
  });
};