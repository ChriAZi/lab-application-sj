# Fake Google News - Lab Application

## Prerequisites

- Setup [Node.js](https://nodejs.org/de) and [npm](https://www.npmjs.com/)
- Create a [Firebase Project](https://firebase.google.com/docs/web/setup)

## Folder Structure

- assets: contains all images, icons etc.
- data: contains the prepared (details see notebooks folder) dataset for loading a fixed set of data into the prototype and control condition

## Running the application

After having setup your development environment as described above, follow these steps:

1. Setup a local webserver using `npm install -g http-server && http-server` in the folder root

## Additional Notes

All credentials need to be edited in the `firestore.js` file by including a JS object after the imports with the following shape:
These need to be the same credentials as in the chrome extension so that tracking is unified.

```
const firebaseConfig = {
    apiKey: 'FIREBASEAPIKEAY'
    authDomain: 'FIREBASEAUTHDOMAIN
    projectId: 'FIREBASEPROJECTID',
    storageBucket: 'FIREABSESTORAGEBUCKET',
    messagingSenderId: 'FIREABSESENDERID',
    appId: 'FIREABSEAPPID'
}
```
