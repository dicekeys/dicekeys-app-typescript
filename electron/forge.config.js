module.exports = {
  "packagerConfig": {
    "asar": false,
    "ignore": [
      ".idea",
      ".git",
      ".gitignore",
      ".eslintrc.json",
      "tsconfig.json",
      "forge.config.js",
      "package-lock.json",
      "^(/README.md$)",
      "src"
    ],
    "executableName": "dicekeys",
    "icon": "./packaging/icon.icns"
},
  "makers": [
    {
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "name": "dicekeys_electron"
      }
    },
    {
      "name": "@electron-forge/maker-zip",
      "platforms": [
        "darwin",
        "linux"
      ]
    },
    {
      "name": "@electron-forge/maker-deb",
      "config": {
        options: {
          maintainer: 'DiceKeys LLC',
          homepage: 'https://dicekeys.com'
        }
      }
    },
    {
      "name": "@electron-forge/maker-rpm",
      "config": {
        options: {
          maintainer: 'DiceKeys LLC',
          homepage: 'https://dicekeys.com'
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        overwrite: true,
        icon: "./packaging/icon.icns",
        iconSize: 128,
        background: './packaging/dmg/dmg-background.png',
        additionalDMGOptions: {
          window:{
            size: {
              width: 750,
              height: 545
            }
          }
        }
      }
    },
    // {
    //   name: '@electron-forge/maker-pkg',
    //   config: {
    //     keychain: 'dicekeys-keychain'
    //   }
    // }
  ]
}
