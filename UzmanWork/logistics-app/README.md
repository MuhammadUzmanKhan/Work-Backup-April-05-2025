# Coram App

This readme lists the steps to set up the development environment and the dev workflow.

## Git LFS

Make sure `git lfs` is installed and set up correctly so all webpages load properly in dev workflow.

```
git lfs install
git lfs pull
```

## Poetry

We use _poetry_ to manage python dependencies.

**Note:** poetry will use the python available when it was installed to create envs. This might not be what you want (e.g. if you installed poetry before setting a pyenv global env). If that is the case, you can either:

- refer to [this link](https://python-poetry.org/docs/managing-environments/#:~:text=By%20default%2C%20Poetry%20will%20try,python%20requirement%20of%20the%20project.) to tell poetry to use the currently activated env (**highly** recommended);
- use a local venv, which you must place in `.venv` (usually by running `python -m venv .venv`)

Install using

```
curl -sSL https://install.python-poetry.org | python3 -
```

After to install the dependencies run

```
poetry install
```

Note: there might be an issue with some locks [link](https://github.com/python-poetry/poetry/issues/6906),
in that case follow the instructions to remove them from your cache

```
find `poetry config cache-dir` -name '*.lock' -delete
```

## Yarn

We use _yarn_ to manage javascript dependencies. We
use [yarn workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/)to manage common functionality between the
frontend and the mobile apps. You can find them in [coram-common-utils](frontend%2Fcoram-common-utils)

The installation of yarn depends on the platform you are running, and it might require _node_ and/or _npm_.

To install javascript dependencies run

```
cd frontend
yarn install -D
cd ..
```

The final `-D` will install dev dependencies too.

Use yarn workspace to run scripts in different subprojects.

For example, to transpile TS into JS in the _web_, you can run:

```
cd frontend
yarn workspace web tsc
```

To lint the whole project, you run:

```
cd frontend
yarn lint
```

To lint an individual project, you run:

```
cd frontend
yarn workspace web lint
```

## Secrets

You will need to setup a secrets file in the `backend` folder. This file is not tracked by git and should not be committed. The file should be named `secrets.env` and the content can be copied from [this aws secrets page](https://us-west-2.console.aws.amazon.com/secretsmanager/secret?name=api-dev&region=us-west-2)

## Compose

We use docker compose for both dev and prod. This allows you to run multiple containers with a single instruction. Make sure both `docker` and `docker-compose` are properly installed on your machine (note that on macOS `docker-desktop` already provides both).

Note: on linux docker is NOT [installed via apt](https://docs.docker.com/get-docker/).

## DB Migrations

For automatically upgrading the DB when we make schema changes we use a tool called [`alembic`](https://alembic.sqlalchemy.org/en/latest/index.html).

If you make changes to the DB created a new alembic revision by executing the following inside the backend container. Make sure you are inside `/app`.

```
docker exec -it logistics-app-backend-1 alembic -c backend/alembic.ini revision --autogenerate -m "Revision message"
```

This will create a migration file inside `backend/alembic/versions`. Check the generated pythons file and make sure that both the `upgrade` and `downgrade` functions are doing what they are supposed to do. Automatic generation of the revision is not always working, so you need to check that.

After that the next time you start the up it will automatically change the DB schema.

Developers can undo the DB change using the following command:

```
alembic -c backend/alembic.ini downgrade -1
```

This command reverts the last commit. Refer to [the alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html) for more options.

## Dev Workflow

For the dev workflow you want to be able to see live changes reflected for both front and back-end.
We use docker volumes and hot-reload (through `vite` and `uvicorn`) for this.

1. **Start Development Containers**
   Run this 2x:
```
./run_compose_dev.sh
```

This will:

- install python and javascript new dependencies;
- generate APIs on the front-end;
- run both containers with docker compose

You have to run that script twice if you haven't set up your db yet.

2. **Populate the Database**:
  You will need to at least add an organization to the db. You can do so by running the following command:

```docker exec -it logistics-app-backend-1 scripts/populate_db.sh```

3. **Verify that the db has been populated with organizations**:
  `psql -U postgres -p 5432 -h localhost` and `select * from organizations;` in postgres.

  If you ever need to drop the db entirely you can use the following command:
  `docker exec -it logistics-app-backend-1 scripts/drop_db.sh`

  **Note:** You will need to restart the script if you install any new dependency.

  **Note:** Postgres needs to restart with lower permissions after it creates the db. This means that we always lose the database connection the first time we run the script. On the second try, the db is already created, so there is no restart. We spent 2 hours looking for a workaround and did not find one.
  

4. **Forward Ports to machine where you want to access frontend**
   Once the containers are running, forward the ports to your local machine by running the following command on your local machine:

```
ssh -L 5173:localhost:5173 -L 8000:localhost:8000 -L 6006:localhost:6006 ubuntu@100.107.233.76
```

   adjust the user and IP address to the machine you are running the backend containers on.


5. **Connect NVR to the backend**: 
   If you are running the core stack on the NVR, you will need to connect the NVR to the backend. To do this, you will need to set the `BACKEND_ADDRESS` in the `.env` file on the NVR to the IP address of the machine running the backend containers. Once you have done this, you can start running the core stack on the NVR. The NVR will send heartbeats to the backend, which will add the NVR to the DB. This process should take only ~10 seconds, but you have to wait for this to complete before you go to the next step.


6. **Access and Login to the App**:
   On the local machine, the frontend will now be available at `localhost:5173`, open this in your browser.
   Login with the coram credentials and you should be able to see the app. For the first login, you will need be added to the organization in auth0.
   Ask auth0 admin to add you to an organization. The admin needs to add org ids and a role, here's an example for adding to the default 'Coram' org:

```
{
  "coram_organization_ids": [
    "6bg6959n"
  ],
  "role_assignment": "admin"
}
```

  Once you are added to the organization, you can login to the app. After logging into the frontend, go to the devices page and add your appliance on the Appliances tab.


### Dev workflow with front-end only

You can also run your front-end locally and connect to the staging back-end and DB. This is possible because the staging backend allows localhost as origin. To do this run:

`./run_compose_dev.sh frontend-only`

This will spin the front-end only and will target the staging backend for all requests.

### Testing

Tests will automatically run in CI. If you want to run them locally, run with:

`./run_backend_tests.sh`

This will spin up a container and run the entire test suite inside of it. This should work on macOS too (where running tests outside the container is expected to fail because of some missing system deps). To run a particular test, use

`./run_backend_tests.sh -k /path/to/test_file`

Please read the [test README](https://github.com/orcamobility/logistics-app/blob/main/backend/test/README.md) before developing new tests.

## Deploy to [prod/release/staging]

### Deploy service through Github action

Run corresponding [Github action](https://github.com/orcamobility/logistics-app/actions)

## Native App (iOS/Android)

We use [Capacitor.js](https://capacitorjs.com/) to build native apps for iOS and Android. The native apps are built using the same codebase as the web app. The way capacitor works is that it creates a webview and loads the web app inside it. The web app can then communicate with the native app through plugins written in native languages (Swift for iOS and Java for Android).

In terms of web dev, this is similar to running a local server and loading the web app in a browser.

### iOS Requirements

For iOS, you will need to have xCode installed. You can't develop for iOS on linux. The installation should be straightforward. You will need to add a simulator from xCode. Go to `Xcode -> Open Developer Tools -> Simulator` and create one. You can pin it to the dock for easy access.

### Android Requirements

For Android, you will need to have Android Studio installed. This is a jetBrain editor so it's not the best experience ever. On first setup, it might complain it does not find the SDK. This can be installed from inside Android Studio itself, you **don't need** to install a jdk from brew. You will need to create an emulator from Android Studio too.

### Capacitor CLI

Capacitor comes with a CLI which is installed as a dev module. Because we use `yarn`, you can run the CLI by running `yarn cap`. The CLI is used to install and manage plugins, open the project in xCode/Android Studio, sync the web app with the native app, etc.

We provide a script (`copy_to_native.sh`) to do all the heavy lifting which:

- build the `dist` folder for the web app using docker;
- sync the web app with the native app;
  After running this script, you will need to open the project in Xcode/Android Studio and run it from there; you can do it through capacitor (see below).

An alternative workflow which allows for hot-reloading the frontend is the following:

1. Run `run_compose_dev.sh frontend-only`
2. Run `yarn cap sync` from the `frontend` folder.
3. (For android only) You need to set up port forwarding. See below for more information.
4. Run the native app in the simulator - you should see any frontend changes be immediately reflected without needing to restart the mobile app.

Port forwarding:

1. Open `chrome://inspect/devices#devices` in Google Chrome
2. Click `Port forwarding` and set up 5173 to point to localhost:5173.

### Stuff that you will not have to setup (but is good to know)

This is a list of stuff which is already setup and you don't need to worry about, unless something goes south.

#### Custom URL Scheme

When we perform a login request the app opens a safari/chrome tab. After the login is performed, the user is redirected to the app. The link is not a regular http link, which means that the browser can't open it, unless the system knows that an app can handle it. This is setup differently for iOS and Android.

On iOS this is done by setting a `URL Types` in Xcode with:

- identifier: `com.coramai.coram`
- URL Schemes: `$(PRODUCT_BUNDLE_IDENTIFIER)`

**Note:** A custom URL scheme is not an universal link. Universal links can also be used, but they are a pain to setup and require a developer account.

On Android this is done in `AndroidManifest.xml` by setting a custom intent filter for a [deep link](https://developer.android.com/training/app-links/deep-linking) with data:
`<data android:scheme="com.coramai.coram" android:host="*.auth0.com"/>`
The `*.` allows to use a single intent filter for both dev and prod.

#### Generating icons and splash screens

You will need an icon with size `1024x1024` and a splash screen with size `2732x2732`.
The splash screen should have quite a bit of padding around the icon, otherwise it will be cropped.

Because we run capacitor V4 we use [cordova-res](https://capacitorjs.com/docs/guides/splash-screens-and-icons) for this. This does not have to be run from the repo, and it's actually better to do it in a temporary folder. Once the icons and splash screens are generated, they can be copied to the repo.

For ios, icons and splash screens can be copied directly to the repo. Xcode will automatically pick them up and will tell you if any is missing or unused.

For android, I suggest to generate and copy the splash screens to the repo, but to generate the icons using Android Studio. This is because Android Studio has a tool to generate the icons starting from your starting image which is much easier than doing it manually.

### Apple Developer Account

TODO (not required if running in simulator)
This is a lot of pain.

#### Making a new iOS release

Assuming you've set up signing keys etc.
Run `copy_to_native.sh prod`
Increment the version number in the "App" -> "Info" tab.
Select "Product" -> "Archive" from the top menu in Xcode.
Select the newest archive and click "Distribute App".
"App Store Connect" method of distribution.
"Upload" destination
"Automatically manage signing" for re-signing.
"Upload"

### Android Developer Account

TODO (not required if running in emulator)
I've not done this yet, but you can create an `.apk` even without it.

# Making a new Android release

Increment `versionCode` and `versionName` in `build.gradle`.
Run `copy_to_native.sh prod`
In android studio: "Build" -> "Make Project"
"Build" -> "Generate Signed Bundle/APK"
Go to the Google Play Console.
Select the Coram App.
"Release" -> "Production" -> "Edit Release"
Drag the .aab file generated above to the file field and click "Next"

## Docker Compose Files

Here is a list of all the docker compose files and their purpose. The reason we separated the frontend and backend compose files is that building the backend images does not require the environment at build time, while the frontend does, since it compiles to static files.

`docker-compose.backend.yaml` - Base backend configuration file.

`docker-compose.frontend.yaml` - Base frontend configuration file

`docker-compose.backend-env.yaml` - Environment variables config. Used for running the backend services. Not used for building the backend images.

`docker-compose.dev.yaml` - Used to overwrite the config for local development and run a local database.

`docker-compose.native.yaml` - Used for building the native mobile apps.

`docker-compose.build-backend.yaml` - Used for building the backend images.

`docker-compose.build-frontend.yaml` - Used for building the frontend image.

`docker-compose.pull.yaml` - Used for running with pre-built images.

## Fixing vulnerabilities

Vulnerabilities are reported by Github Actions. You can find them in the `Security` tab of the repo. We can have vulnerabilities in both the backend and the frontend.

### Backend

Vulnerabilities on the backend can usually be fixed by updating dependencies in the `pyproject.toml` file using poetry.

### Frontend

The situation here is more complicated. Each package can install its subdeps independently from other packages. This means that you can have two versions of the same package installed as a result. This commands are useful to find out which packages are vulnerable and which packages are using them:

- `yarn audit` - this will list all the vulnerabilities and the packages which are using them;
- `yarn list --pattern <package>` - this will list all the versions of the package and the packages which are using them;
