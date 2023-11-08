# DiceKeys TypeScript App for DiceKeys.app and Electron

## Requirements

## Running web app locally
Tested to work with Node.js LTS v18.

Install [TypeScript](https://www.typescriptlang.org/download) in your system.
```bash
npm install -g typescript
```

Install [vite](https://vitejs.dev/) in your system.
```bash
npm install -g vite
```

We're currently using [GitHub Packages](https://docs.github.com/en/packages/) for the project's internal dependencies, which we now regret because it requires you to have a GitHub account and personal access token to install this repository's dependencies. (If this is arduous, please file an issue and we may move to NPM.) If you don't already have a personal access token with the read:packages permission set, create a GitHub personal access token [following the instructions in the GitHub documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token), ensure it has the read:packages permission, then use the following command to login to github before the step where you'll run `npm install`
> npm login --scope=@dicekeys --auth-type=legacy --registry=https://npm.pkg.github.com

(you will be prompted for the personal access token)

Install modules
```bash
cd web
npm install
```
_If `npm` fails, check **GitHub Packages** instructions._

```bash
npm run start
```

If seeing a browser error for `Uncaught ReferenceError: WebAssembly is not defined` you may need to turn off browser safe mode for localhost.  (In edge, go to the circle `i` just to the left of the address in the address bar and then look for the enhanced security option.)

Due to an [incompatibility](https://github.com/vitejs/vite/issues/4586) between vite's handling of imports and FireFox, workers don't work in FireFox on dev (but works fine when built for production and deployed to a web server, so test on the staging server.)

## Running electron app

```bash
cd electron
sh build_modules.sh
npm run start
```
or manually
```bash
cd common
npm install
npm run build
cd ..
cd web
npm install
npm run build-electron-html
cd ../electron
npm install
npm run start
```
## Build electron app for macOS

First do all the steps of the previous section and then:
```bash
cd electron
npm run build

# if you just want the .app 
npm run pack

# or dmg distribution files
npm run dist-macos
```

## Build electron app for Windows/Linux

Using docker to create distributions written under `/electron/out`
  - Linux **deb**, **rpm**, and **zip**
  - Windows: **setup**

```bash
# Build steps need to be executed from within the `electron` subdirectory.
cd electron

# Create a docker container with everything needed to build the electron app
docker buildx build --platform linux/amd64 -f Dockerfile . --tag dicekeys_build

# Run the electron build process within the docker container:
docker run --platform linux/amd64 --name dicekeys_build --rm -v $PWD:/dicekeys dicekeys_build
```

If you run into problems, it may be helpful to clear docker's cache, via:
```bash
# DO NOT RUN unless you run into problems.
docker builder prune
```

## Run tests
```bash
cd web/
npm run test
```

## Architecture

The app uses a reactive-style of UI coding in which code is divided into:
  - State objects, which represent the current state of the application, and
  - Views, which render mostly-stateless UI components to reflect the application state.

Global state is under the `state` directory and `views` are under the views directory.
State-objects that are local to one or more views may be stored adjacent to their view.

State is managed with MobX, and state classes contain actions (methods) that will modify state.

MobX-enhanced React components automatically re-render views as needed when state changes.
We inject state into these components through their React props (React's name for the parameters passed to a view by its parent).

We borrow from environments like SwiftUI, which allow you to run and inspect individual components by rendering previews, by manually
creating preview HTML files for key components that operate only on the subset of the application state that required for those views.

```bash
npm run preview
```

### Windows USB device handling
Windows requires the app to have admin rights in order to list FIDO usb devices and write to them.

## Security notes

### Dependencies

Due to our strict security requirements, we try to minimize dependencies.  The only non-dev components we use are our own support libraries
  - our own `SeededCrypto` library, built on `LibSodium`
  - our DiceKey scanning library, built on `OpenCV`
  - `emscripten`, the WebAssembly compiler used to build the above two libraries and marshall data
  - `React`, the highly-popular UI library with a great security track record.
  - `MobX`, not quite as popular as React, but a small code base with a great security track record.
  - `vite` generates code during the build process and relies on other dependencies.
  
Testing with `jest` introduces other dependencies, but those should not be compiled into the production applications.


## Build notes

Using `vite` bundler.

## Electron notes

### macOS - Supporting Associated Domains
Associated Domains ([see Apple's developer documentation](https://developer.apple.com/documentation/xcode/supporting-associated-domains)) establish a secure association between the domain(s) associated with the DiceKeys app (dicekeys.app) and this application package.

_To support associated domains, this electron app uses a custom entitlements file ([electron/packaging/entitlements.mac.plist](./electron/packaging/entitlements.mac.plist)) which is not managed by XCode.  That file includes documentation on entitlement settings required by this application to run without crashing._

Useful resources:
- https://github.com/electron-userland/electron-builder/issues/4040
- https://twitter-archive-eraser.medium.com/notarize-electron-apps-7a5f988406db
- https://github.com/electron-userland/electron-builder/issues/3940

### Development mode
#### Refresh HTML contents

You can run _web_ codebase with the following commands. Any change to the html files will trigger an update to the electron html contents without restarting the application itself.
```
cd web
npm run watch-electron-html
```

#### Restart Electron
Restarting electron every time there is a change in the _electron_ codebase can be accomplished by running the following commands in two separates terminal windows.
```
cd electron
npm run watch
```

```
cd electron
npm run start-electron
```
