/* eslint-disable no-console, func-names */
/* thanks to the vaccine-standby team for the boilerplate for this function : https://github.com/twilio-labs/function-templates/blob/main/vaccine-standby/functions/setup.js */

exports.handler = async function (context, event, callback) {

  if (context.UPDATED_PHONE_SID) {
    return callback(null, {
      phoneNumberSid: context.UPDATED_PHONE_SID,
      phoneNumber: context.TWILIO_PHONE_NUMBER,
    });
  }

  const helpersPath = Runtime.getFunctions()['helpers'].path;
  const { getCurrentEnvironment, createEnvironmentVariable } = require(helpersPath);
  const webhookUrl = event.webhookUrl; 

  const client = context.getTwilioClient();

  function getPhoneNumberSid() {
    return new Promise((resolve, reject) => {
      client.incomingPhoneNumbers
        .list({ phoneNumber: context.TWILIO_PHONE_NUMBER, limit: 1 })
        .then((incomingPhoneNumbers) => {
          const n = incomingPhoneNumbers[0];
          resolve(n.sid);
        })
        .catch((err) => reject(err));
    });
  }

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

  const phoneNumberSid = await getPhoneNumberSid();
  await updatePhoneNumberWebhook(webhookUrl, phoneNumberSid);
  console.log('Phone number sid updated: ' + phoneNumberSid);

  const environment = await getCurrentEnvironment(context);
  await createEnvironmentVariable(context, environment, 'UPDATED_PHONE_SID', phoneNumberSid);
  console.log('Hosted environment variables created');

  return callback(null, {
    phoneNumberSid: phoneNumberSid,
    phoneNumber: context.TWILIO_PHONE_NUMBER,
  });
};