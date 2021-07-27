/* eslint-disable no-console, func-names, consistent-return */

/* thanks to the vaccine-standby team for the boilerplate for this function : https://github.com/twilio-labs/function-templates/blob/main/vaccine-standby/functions/auth.private.js */

function checkPasscode(passwordProvided, passwordExpected) {
  if (!passwordProvided) {
    return false;
  }
  if (passwordProvided === passwordExpected) {
    return true;
  }
  return false;
}

async function getCurrentEnvironment(context) {

  if (context.DOMAIN_NAME && context.DOMAIN_NAME.startsWith("localhost")) {
    return;
  }

  const client = context.getTwilioClient();
  const services = await client.serverless.services.list();
  for (const service of services) {
    console.log(`Searching for environment. Looping through service: ${ service.sid }`);
    const environments = await client.serverless
      .services(service.sid)
      .environments.list();
    const environment = environments.find(
      env => env.domainName === context.DOMAIN_NAME
    );
    if (environment) {
      // Exit the function
      return environment;
    }
  }
}

function updateLocalVariable(key, value) {
  process.env[key] = value;
  return true;
}

async function createEnvironmentVariable(context, hostedEnvironment, key, value) {

  if (!hostedEnvironment) { 
    return updateLocalVariable(key, value)
  }

  const client = context.getTwilioClient();

  try {
    console.log(`Creating variable ${key}`);
    await client.serverless
      .services(hostedEnvironment.serviceSid)
      .environments(hostedEnvironment.sid)
      .variables.create({
        key,
        value
      });

  } catch (err) {
    console.error(`Creating env variables error: '${key}': '${value}': ${err}`);
    return false;
  }
  return true;
}

module.exports = {
    getCurrentEnvironment,
    createEnvironmentVariable,
    checkPasscode
}