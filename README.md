# Global Input App Browser Extension
This is a browser extension application ([Chrome](https://chrome.google.com/webstore/detail/global-input-app/hcklienddlealndjnakkagefaelhnjkp?hl=en), [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/global-input-app/)) written with TypeScript, which is a typical React application, demonstrating how you can use the [global-input-react] module to achieve mobile collaboration for applications running on computers and other devices, leading to a series of use cases like one-click sign-in, one-click sign-up, mobile secure storage, mobile encryption to name a few.

This extension allows you to use your mobile to operate on web pages loaded on your computer, transferring data securely between your mobile and computers. You can try this extensions on sign-in pages that you use on a daily basis such as GitHub, GitLab, npm, Dropbox, Digital Ocean, Wordpress, Lucidchart, ProtonMail, Camscanner, Evernote, Heroku, join.me, Meetup,  MuleSoft, JS Bin, JSFiddle, Papa John's, Tesco, Wisepay, 123-reg, Pexels, Adobe, Atlassian, Amazon+AWS, Apple, Google, Twitter, Facebook, LinkedIn, and Microsoft. You can also specify HTML elements that you would like to control using your mobile.

## How to Build

You can build and run it as standalone React web application:

```
git clone https://github.com/global-input/browser-extension.git
cd browser-extension
npm install
npm run build
npm start
```

When you are installing it as a browser extension, you just need to configure your extension to point it to the build folder where all the necessary extensions files are located.
