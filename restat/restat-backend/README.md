# Restat

## Cloning the Project

Clone the project  

```bash
  git clone https://github.com/Phaedra-Solutions/restat.git
```

## Latest Code Branch 

For latest code, please use Staging branch

## Installing Dependecies

Go to the project directory

```bash
  cd restat
```

Install dependencies

```bash
  npm install
```

## Starting Database

You have to start a Postgres database and connect it to the app by inputting the below mentioned environment variables.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

1. Application Setting ( To change app from local to production. )
   `PORT`
   `APP_MODE`

2. Database Setting ( To connect to your local database during development. )
   `DB_HOST`
   (Host on which database is running)
   `DB_USERNAME`
   (Databse username)
   `DB_PASSWORD`
   (Database password)
   `DB_DATABASE`
   (Database name)
   `SYNC_DATABASE`
   (Database configuration to sync the databse with server on startup. It can be set 1 for true and 0 for false.)

## Commands

1. To build App

```bash
  npm build
```

2. To start the App in Development

```bash
  npm start:dev
```

3. To start the App in Production

```bash
  npm start
```
