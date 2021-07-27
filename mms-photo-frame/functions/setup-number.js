/* eslint-disable no-console, func-names */

/**
 *
 * setup-number.js
 * 
 * Used to cofigure a Twilio number by setting its webhook to be that
 * of a Studio flow previously provisioned by setup-studio.js
 *
 * Expects to have a TWILIO_PHONE_NUMBER in the env variables to use. 
 * Expects that TWILIO_PHONE_NUMBER to not currently be inside a Messaging Service.
 */

exports.handler = async function (context, event, callback) {

  const helpersPath = Runtime.getFunctions()['helpers'].path;
  const { checkPasscode, getCurrentEnvironment, createEnvironmentVariable } = require(helpersPath);

  if (!checkPasscode(event.passcode, context.ADMIN_PASSCODE)) {
    return callback('Not authorized.');
  }
  
  // Like a cache, return early if the 
  // env has already been set.
  if (context.UPDATED_PHONE_SID) {
    return callback(null, {
      phoneNumberSid: context.UPDATED_PHONE_SID,
      phoneNumber: context.TWILIO_PHONE_NUMBER,
    });
  }

  const webhookUrl = event.webhookUrl; // URL to set passed into this function
  const client = context.getTwilioClient();

  // Returns SID of our phone number
  function getPhoneNumberSid() {
    return new Promise((resolve, reject) => {
      client.incomingPhoneNumbers
        .list({ phoneNumber: context.TWILIO_PHONE_NUMBER, limit: 1 }) // Filter by our phone number set in env
        .then((incomingPhoneNumbers) => {
          const n = incomingPhoneNumbers[0]; // Get the first result
          resolve(n.sid); // Return the number's sid
        })
        .catch((err) => reject(err));
    });
  }

  // Updates our phone number's webhook. 
  // Needs the webhook url and sid to update.
  function updatePhoneNumberWebhook(webhook, numberSid) {
    return new Promise((resolve, reject) => {
      client.incomingPhoneNumbers(numberSid)
        .update({
          smsUrl: webhook,
        })
        .then(() => {
          resolve('success');
        })
        .catch((err) => reject(err));
    });
  }

  // Here is where we call the above functions.
  const phoneNumberSid = await getPhoneNumberSid();
  await updatePhoneNumberWebhook(webhookUrl, phoneNumberSid);
  console.log('Phone number sid updated: ' + phoneNumberSid);

  const environment = await getCurrentEnvironment(context);
  await createEnvironmentVariable(context, environment, 'UPDATED_PHONE_SID', phoneNumberSid);
  console.log('Variables created/updated');

  return callback(null, {
    phoneNumberSid: phoneNumberSid,
    phoneNumber: context.TWILIO_PHONE_NUMBER,
  });
};