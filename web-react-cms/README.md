# Daleel App CMS
## Introduction

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

This document provides a detailed guide for setting up and using the Daleel App CMS. By following the instructions in this document, developers should be able to set up the project on their local machine, run the necessary commands, and deploy the project to different environments.

## Prerequisites

- Node.js version 14
- SSH key added to GitHub

## Local Setup
- Clone the [project](https://bitbucket.org/getdaleel/web-react-cms/)
- Install yarn globally on your local machine
- Install the dependencies and devDependencies and start the server by command yarn install 
- Run yarn start to start the project
- Export "REACT_APP_ENV=local" from the root of the directory to set the environment for the app.

## Commands
To starts the project environments
```sh
yarn start
yarn start-dev 
yarn start-uat
yarn start-prod
```

To Build the project in the environments
```sh
yarn build
yarn build-dev
yarn build-uat
yarn build-prod 
```

To Test the project environment
```sh
yarn test
```

For production environments
```sh
yarn deploy-dev
yarn deploy-uat
yarn deploy-prod
```

## Environments

- [AWS Amplify] Services
- [node.js] - evented I/O for the backend
- [Express] - fast node.js network app framework [@tjholowaychuk]
- [React] - for CMS development
- [Redux-Toolkit] - for state management
- [Material-UI] - for CMS styling



## Installation

Daleel requires [Node.js](https://nodejs.org/) v14+ to run.

To starts the project in the development environment
```sh
yarn start
```

For production environments...

```sh
yarn start-prod
REACT_APP_ENV=prod
```

