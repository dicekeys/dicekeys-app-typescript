#!/bin/sh

cd ..
cd common
npm install
npm run build
cd ..
cd web
npm install
npm run build-electron-html
cd ../electron
npm install
