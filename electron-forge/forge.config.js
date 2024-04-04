const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    "icon": "./packaging/icon",
    "extendInfo": {
      "CFBundleURLSchemes": ["dicekeys"]
    },
    osxSign: {
      "identity": "DiceKeys, LLC (CTDV6HX5KK)",
//      teamId: "CTDV6HX5KK",
      optionsForFile: (filePath) => {
        // Here, we keep it simple and return a single entitlements.plist file.
        // You can use this callback to map different sets of entitlements
        // to specific files in your packaged app.
        return {
          entitlements: './packaging/entitlements.mac.plist'
        };
      },
    },
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: "CTDV6HX5KK",
    },
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      "name": "@electron-forge/maker-deb",
      "config": {
        "mimeType": ["x-scheme-handler/electron-fiddle"]
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    }, {
      name: '@electron-forge/maker-dmg',
      config: {
        "format": "ULMO",
        "icon": "./packaging/icon.icns",
        "background": "./packaging/dmg/background.tiff",
        "debug": true,
      }
    },    
  ],
  "protocols": [
    {
      "name": "Electron Fiddle",
      "schemes": ["electron-fiddle"]
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
