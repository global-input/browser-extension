# Global Input App Chrome Extension
This browser extension allows you to use your mobile device to operate on websites and web applications that are loaded on your computer. You can carry out various mobile-to-computer operations like [Mobile Authentication](https://globalinput.co.uk/global-input-app/mobile-authentication), [Mobile Content Transfer](https://globalinput.co.uk/global-input-app/mobile-content-transfer), [Mobile Input & Control](https://globalinput.co.uk/global-input-app/mobile-input-control), and [Mobile Encryption](https://globalinput.co.uk/global-input-app/mobile-content-encryption). 

This extension comes preloaded with configurations for operating on some common websites that includes Google, GitHub, GitLab, Amazon+AWS, Dropbox, Apple, Twitter, Facebook, Digital Ocean, LinkedIn, Wordpress, Lucidchart, ProtonMail, to name a few. Creating a new configuration for a new website is a straight-forward process. You just need to specify the configuration for locating the HTML elements that you would like to control using your mobile. 

Instead of direct web page control, you may choose to use the extension window and your your clipboard as a go-between medium 
for transferring data between your mobile and the forms on the web page.

Best of all, you can encrypt/decrypt content using your mobile and transfer the resulting text back to your computer. 

## How to Install
You can install this extension on [Chrome Web Store](https://chrome.google.com/webstore/detail/global-input-app/hcklienddlealndjnakkagefaelhnjkp?hl=en) or [Firefox ADD-ONS](https://addons.mozilla.org/en-GB/firefox/addon/global-input-app/).

Alternatively, you may choose to install the extension directly from the source code (React JS).  Download the source code from this git repository, and then run the following command in the project folder to create the necessary extension files in the ```build``` folder:

```
npm run build
```
Then, go to the Extensions window (load ```chrome://extensions``` on your Chrome, ```about://debugging``` on your Firefox), and click on the "Load unpacked" button there, which should pop up a File dialogue box. Please navigate to the ```build``` folder in the project folder and press the ```Select``` button.

