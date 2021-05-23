module.exports = {
  packagerConfig: {
    sourcedir : "dist/electron"
  },
  makers: [
    {
      "name": "@electron-forge/maker-dmg",
      "config": {
        "format": "ULFO"
      }
    },
    {
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "name": "dicekeys_webapp"
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
      "config": {}
    },
    {
      "name": "@electron-forge/maker-rpm",
      "config": {}
    }
  ]
}
