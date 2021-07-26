# MMS to Photo Frame

This silly project will let you show off your newfound texting power in style. With a one-click deploy, you'll have a website hosted on Twilio that displays any photo and caption which is texted in to a Twilio number of your choosing. 

![Demo GIF in Use](sample_gif.gif)

## What's in this project?
- Assets: Files that will be hosted inside Twilio's serverless environment to be used by browsers/clients. 
	- `index.html`: The "website" that will display texted-in images. Also kicks off our setup scripts.
	- `app.js`: Powers the display of the images by connecting to Sync SDK. Also makes calls to our server-side Twilio Functions to configure your Twilio account.
	- `mms-photo-frame.css`: Makes everything look nice :)
	- `studio_flow.private.json`: Used by our `setup-studio.js` function to create a Studio Flow inside your account.
- Functions: Node JS functions that will be uploaded to your Twilio Functions environment.
	- `helpers.private.js`: Some shared functionality, mainly to interact with the Twilio Functions environment variables. 
	- `post-to-frame.js`: Called by our Studio Flow to update a Sync List with new photos/captions to our photo frame. 
	- `sync-token.js`: Issues a sync token, called when `index.html` is accessed.
	- `setup-number.js`, `setup-studio.js`, and `setup-sync.js`: Everytime that `index.html` is accessed, these three functions are called. They make sure that your Twilio account is properly configured with the right Studio flows, numbers, and Sync services.

### Environment variables

This project requires some environment variables to be set. To keep your tokens and secrets secure, make sure to not commit the `.env` file in git. When setting up the project with `twilio serverless:init ...` the Twilio CLI will create a `.gitignore` file that excludes `.env` from the version history.

In your `.env` file, set the following values:

| Variable | Description | Required |
| :------- | :---------- | :------- |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number in E.164 format | Yes; *note: this is automatically added when using Quick Deploy |
| `SYNC_LIST_NAME` | The name of your Sync List to be created during setup | Yes *note: this is automatically set as `MMS_SYNC_LIST` when using Quick Deploy |

## Create a new project with the template

1. Install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart#install-twilio-cli)
2. Install the [serverless toolkit](https://www.twilio.com/docs/labs/serverless-toolkit/getting-started)

```shell
twilio plugins:install @twilio-labs/plugin-serverless
```

3. Initiate a new project

```
twilio serverless:init example --template=mms-photo-frame && cd example
```

4. Deploy the project to your account with [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart):


5. Open the web page at https://<your_function_domain>/index.html and wait for the setup to complete.

ℹ️ Check the developer console and terminal for any errors, make sure you've set your environment variables.
