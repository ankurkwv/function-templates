/* eslint-disable no-console, func-names */
/* thanks to the vaccine-standby team for the boilerplate for this function : https://github.com/twilio-labs/function-templates/blob/main/vaccine-standby/functions/setup.js */

exports.handler = async function (context, event, callback) {

  if (context.FLOW_SID && context.FLOW_URL) {
    return callback(null, {
      flowSid: context.FLOW_SID,
      webhookUrl: context.FLOW_URL
    });
  }

  const helpersPath = Runtime.getFunctions()['helpers'].path;
  const { getCurrentEnvironment, createEnvironmentVariable } = require(helpersPath);

  const assets = Runtime.getAssets();
  let flowDefinition = require('fs').readFileSync(assets["/studio_flow.json"].path, 'utf8');
  console.log(flowDefinition);
  const client = context.getTwilioClient();

  // Substitue the correct URL into the studio flow JSON
  function strReplaceFlowData() {
    let postUrl = "https://" + context.DOMAIN_NAME + context.POST_HANDLER_PATH;
    flowDefinition = flowDefinition.replace('{{__replace--function_url}}', postUrl);
    console.log('Flow Definition replaced.');
  }

  // Deploy Twilio Studio Flow
  function deployStudio() {
    return client.studio.flows
        .create({
          friendlyName: 'The MMS Photo Frame',
          status: 'published',
          definition: flowDefinition,
        })
        .then((flow) => flow)
        .catch((err) => { console.log(err.details); throw new Error(err.details) });
  }

  strReplaceFlowData();
  const flow = await deployStudio(flowDefinition);
  console.log('Studio delployed: ' + flow.sid);

  const environment = await getCurrentEnvironment(context);
  await createEnvironmentVariable(context, environment, 'FLOW_SID', flow.sid);
  await createEnvironmentVariable(context, environment, 'FLOW_URL', flow.webhookUrl);
  console.log('Hosted environment variables created');

  return callback(null, {
    accountSid: context.ACCOUNT_SID,
    flowSid: flow.sid, 
    webhookUrl: flow.webhookUrl
  });
  
};