# GopherFit Frontend
Welcome to the frontend for **GopherFit**, a fitness app for University of Minnesota students that will feature macro and workout tracking, barcode scanning for logging, a fitness related social media page, and more!

## Core Tech Stack
| Technology  | Description              |
| ----------- |:------------------------:|
| React Native| User Interface Framework |
| TypeScript  | Language                 |
| Bun         | Package Manager          |

## Setup
Make sure to download the following if you don't have it already:
* [Bun](https://bun.com/)
* [Android Studio](https://developer.android.com/studio) (if you want to run on android emulator)


Then clone this repo into your machine wherever you want it to be
```
git clone https://github.com/umn-adc/gopher-fit-front.git
```
Then run the following command to install all dependencies
```
bun install
```
Now check the branch you're in, and if you haven't already, switch to develop and pull to make sure you're up to date
```
git checkout dev
git pull
```
Run the following command to start the app
```
bun run start
```
You should see a QR code pop up along with a list of commands from Expo if you configured yourself correctly. From here, you can choose how you want to run the app whether on an Android or iPhone emulator, or directly on your device by scanning the QR code

## 📚 Readings
For those not familiar with the technologies used, the following readings will be helpful so you can start contributing

### 1. [TypeScript](https://www.typescriptlang.org/docs/)
If you are familiar with JavaScript, this should be a quick skim, otherwise you can get started here

### 2. [React Native](https://reactnative.dev/docs/getting-started)
The main sections you should read are all of [The Basics](https://reactnative.dev/docs/getting-started), the first section of [UI & Interaction](https://reactnative.dev/docs/style), and [Workflow - Using TypeScript](https://reactnative.dev/docs/typescript)

### 3. [Expo](https://docs.expo.dev/get-started/introduction/)
Read the following sections:
* [Get Started - Introduction](https://docs.expo.dev/get-started/introduction/)
* [Get Started - Start Developing](https://docs.expo.dev/get-started/start-developing/) (skimming other pages in this section recommended)
* [Develop - Development Builds - Introduction](https://docs.expo.dev/develop/development-builds/introduction/)
* [User Interface - Safe Areas](https://docs.expo.dev/develop/user-interface/safe-areas/) (also skim other pages in this section)

### 3. [Nativewind](https://www.nativewind.dev/docs)
Read the [Overview](https://www.nativewind.dev/docs) and all of the [Core Concepts](https://www.nativewind.dev/docs/core-concepts/tailwindcss) section

## Start Contributing
Once you have set up your environment and and read up on the technologies, you can now start contributing! 

Navigate to the task board in the Projects section of the GitHub repo and assign yourself to a task that is in the Ready section. Remember to make a seperate branch and link the PR to the issue when you are done. You should always request a PR from your branch into `dev` and not `main`

