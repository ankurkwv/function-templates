/* thanks to the vaccine-standby team for the boilerplate for this function : https://github.com/twilio-labs/function-templates/blob/main/vaccine-standby/functions/auth.private.js */

async function getCurrentEnvironment(context) {
  if (context.DOMAIN_NAME && context.DOMAIN_NAME.startsWith("localhost")) {
    return;
  }
  const client = context.getTwilioClient();
  const services = await client.serverless.services.list();
  for (let service of services) {
    console.log("Searching for environment. Looping through service: " + service.sid);
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

async function getEnvironmentVariables(context, environment) {
  const client = context.getTwilioClient();
  return await client.serverless
    .services(environment.serviceSid)
    .environments(environment.sid)
    .variables.list();
}

async function getEnvironmentVariable(context, environment, key) {
  const client = context.getTwilioClient();
  // The list filter method isn't implemented yet.
  const envVars = await getEnvironmentVariables(context, environment);
  return envVars.find(variable => variable.key === key);
}

async function createEnvironmentVariable(context, environment, key, value) {
  const client = context.getTwilioClient();
  try {
    if (!environment) {throw new Error('No Env!')}
    console.log(`Creating variable ${key}`);
    await client.serverless
      .services(environment.serviceSid)
      .environments(environment.sid)
      .variables.create({
        key: key,
        value: value
      });

  } catch (err) {
    console.error(`Creating env variables error: '${key}': '${value}': ${err}`);
    return false;
  }
  return true;
}

module.exports = {
    getCurrentEnvironment,
    getEnvironmentVariables,
    getEnvironmentVariable,
    createEnvironmentVariable
}