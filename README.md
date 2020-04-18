# Global Input App Browser Extension
This browser extension allows you to use your mobile device to operate on web pages loaded on a browser in your computer. The communication between your mobile and the extension is secured using end-to-end encryption, and it provides an array of features, which includes [Mobile Authentication](https://globalinput.co.uk/global-input-app/mobile-authentication), [Mobile Content Transfer](https://globalinput.co.uk/global-input-app/mobile-content-transfer), [Mobile Input & Control](https://globalinput.co.uk/global-input-app/mobile-input-control), and [Mobile Encryption](https://globalinput.co.uk/global-input-app/mobile-content-encryption). 

It comes preloaded with configurations for operating directly on some common websites like Google, GitHub, GitLab, Amazon+AWS, Dropbox, Apple, Twitter, Facebook, Digital Ocean, LinkedIn, Wordpress, Lucidchart, ProtonMail, although you can easily create a new configuration for any web page by simply adding a configuration specifying the HTML element that you would like to interact with using your mobile.

Instead of using the direct web page control, you may choose to use the extension window and your clipboard as go-between medium 
for transferring data between your mobile and the HTML elements on a web page.

The [Mobile Encryption](https://globalinput.co.uk/global-input-app/mobile-content-encryption) feature allows you to encrypt/decrypt content using your mobile and transfer the result back to your computer. 

## How to Install
You can install this extension on [Chrome Web Store](https://chrome.google.com/webstore/detail/global-input-app/hcklienddlealndjnakkagefaelhnjkp?hl=en) or [Firefox ADD-ONS](https://addons.mozilla.org/en-GB/firefox/addon/global-input-app/).

Alternatively, you may install it from its source code, which is this repository.  Download the source code and run:


```
git clone https://github.com/global-input/browser-extension.git
cd browser-extension
npm install
npm run build
```
This will build the React.js application into its build folder.

Then, go to the extensions window (type the URL  ```chrome://extensions``` on your Chrome or ```about://debugging``` on your Firefox), and click on the "Load unpacked" button there, and then navigate to the ```build```  folder when the file dialogue box appears, and follow the instruction there for installing the extension.

You may also load it as a React.js web application rather installing it into your browser as an extension:

```
npm start
```

