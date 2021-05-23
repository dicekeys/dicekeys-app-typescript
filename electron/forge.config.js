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
      "config": {}
    },
    {
      "name": "@electron-forge/maker-rpm",
      "config": {}
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO'
      }
    }
  ]
}
