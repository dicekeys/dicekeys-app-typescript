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
    ]
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
        "darwin"
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
      name: '@electron-forge/maker-snap',
      config: {
        features: {
          audio: false,
          mpris: 'com.dicekeys.app',
          webgl: true
        },
        summary: 'DiceKeys'
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO'
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
