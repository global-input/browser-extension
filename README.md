# Global Input App Browser Extension
This is the source code of the [Global Input App Chrome extension](https://chrome.google.com/webstore/detail/global-input-app/hcklienddlealndjnakkagefaelhnjkp?hl=en) and the [Global Input App Firefox ADD-ONS](https://addons.mozilla.org/en-GB/firefox/addon/global-input-app/). It allows you to use your mobile to operate on a web page loaded on a browser in your computer, or transfer data between them, or encrypt content that only your mobile can decrypt. The communication between your mobile and the extension is secured using end-to-end encryption.

It comes preloaded with configurations for operating directly on some common websites like Google, GitHub, GitLab, Amazon+AWS, Dropbox, Apple, Twitter, Facebook, Digital Ocean, LinkedIn, Wordpress, Lucidchart, ProtonMail, although you can easily create a new configuration for any web page by simply adding a configuration specifying the HTML element that you would like to interact with using your mobile.



 This extension offers an array of features like [Mobile Authentication](https://globalinput.co.uk/global-input-app/mobile-authentication), [Mobile Content Transfer](https://globalinput.co.uk/global-input-app/mobile-content-transfer), [Mobile Input](https://globalinput.co.uk/global-input-app/mobile-input-control), [Mobile Control](https://globalinput.co.uk/global-input-app/mobile-input-control), and [Mobile Encryption](https://globalinput.co.uk/global-input-app/mobile-content-encryption). 

## How to Build

This is a React.js application, you can build it like any other normal React.js applications, and you can run it without installing it as a browser extension.

```
git clone https://github.com/global-input/browser-extension.git
cd browser-extension
npm install
npm run build
npm start
```

