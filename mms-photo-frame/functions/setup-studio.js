/* eslint-disable no-console, func-names */

/**
 *
 * setup-studio.js
 * 
 * Deploys a Studio flow based on the export json inside assets/studio_flow.private.json
 * 
 * Makes one automatic edit to the Studio flow JSON in that it updates one of the widgets
 * to point to the deployer's function service by using context.DOMAIN_NAME
 */

exports.handler = async function (context, event, callback) {

  // Like a cache, return early if the 
  // env has already been set.
  if (context.FLOW_SID && context.FLOW_URL) {
    return callback(null, {
      flowSid: context.FLOW_SID,
      webhookUrl: context.FLOW_URL
    });
  }

  const helpersPath = Runtime.getFunctions()['helpers'].path;
  const { getCurrentEnvironment, createEnvironmentVariable } = require(helpersPath);
  const assets = Runtime.getAssets();
  const flowDefinition = require('fs').readFileSync(assets["/studio_flow.json"].path, 'utf8');
  const client = context.getTwilioClient();

  // Substitue the correct URL into the studio flow JSON
  function strReplaceFlowData() {
    let customUrl = "https://" + context.DOMAIN_NAME + '/post-to-frame';
    let updatedFlowDefinition = flowDefinition.replace('{{__replace--function_url}}', customUrl);
    console.log('Definition replaced.'); 
  }

  // Deploy Twilio Studio Flow
  function deployStudio() {
    return client.studio.flows
        .create({
          friendlyName: 'The MMS Photo Frame',
          status: 'published',
          definition: updatedFlowDefinition,
        })
        .then((flow) => flow)
        .catch((err) => { console.log(err.details); throw new Error(err.details) });
  }

  strReplaceFlowData(); // Customize the studio flow
  const flow = await deployStudio(); // Deploy it
  console.log('Studio delployed: ' + flow.sid); 

  // Making sure we only try and update the env if this file
  // is being run inside a Twilio Function service, not locally
  if (context.DOMAIN_NAME && !context.DOMAIN_NAME.startsWith("localhost")) {
    const environment = await getCurrentEnvironment(context);
    await createEnvironmentVariable(context, environment, 'FLOW_SID', flow.sid);
    await createEnvironmentVariable(context, environment, 'FLOW_URL', flow.webhookUrl);
    console.log('Hosted environment variables created');
  }

  return callback(null, {
    accountSid: context.ACCOUNT_SID,
    flowSid: flow.sid, 
    webhookUrl: flow.webhookUrl
  });
  
};