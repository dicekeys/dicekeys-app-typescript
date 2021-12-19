/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
    "appId": "com.dicekeys.electron",
    "files": [
        "!.idea",
        "!.eslintrc",
        "!tsconfig.tsbuildinfo",
        "!tsconfig.json",
        "!forge.config.js",
        "!package-lock.json",
        "!**provisionprofile",
        "!README.md",
        "!Dockerfile",
        "!electron-builder.js",
        "!packaging",
        "!src",
        "!build_modules.sh",
    ],
    "mac": {
        "category": "public.app-category.utilities",
        "identity": "DiceKeys, LLC (CTDV6HX5KK)",
        "icon": "./packaging/icon.icns",
        "extendInfo": {
            "CFBundleURLSchemes": ["dicekeys"]
        },
        "hardenedRuntime": true,
        // Full specification is required as this file will replace the one from electron-builder.
        // The equivalent XCode project can have fewer options but this won't work here as XCode adds required fields at
        // compile time eg. com.apple.application-identifier
        "entitlements": "./packaging/entitlements.mac.plist",
        "entitlementsInherit": "./packaging/entitlements.mac.plist",
        "provisioningProfile": "./DiceKeys_Electron.provisionprofile",
        "gatekeeperAssess": false,
    },
    "directories": {
        "output": "out"
    },
    "asar": true,
    "protocols": [
        {
            "name": "dicekeys",
            "schemes": ["dicekeys"]
        }
    ],
    "dmg": {
        "format": "ULFO",
        "icon": "./packaging/icon.icns",
        "iconSize": 80,
        "background": "./packaging/dmg/background.tiff",
        "sign": true,
    },
    "linux": {
        "maintainer": "DiceKeys LLC",
        "category": 'Utility',
        "executableName": "dicekeys",
        "target" : ["AppImage", "snap", "deb", "rpm", "zip"]
    },
    "win": {
        "target" : ["nsis"],
        "icon": "./packaging/icon.ico",
    },
    "nsis":{
        "oneClick": false
    }
}
