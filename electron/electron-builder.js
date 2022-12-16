/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
    "appId": "com.dicekeys",
    "files": [
        "!.idea",
        "!.eslintrc",
        "!tsconfig.tsbuildinfo",
        "!tsconfig.json",
        "!forge.config.js",
        "!package-lock.json",
        "!**provisionprofile",
        // On 2022-12-16, Stuart asks
        //  Does the provisionprofile need to go here?, it appears in:
        //   https://jondot.medium.com/shipping-electron-apps-to-mac-app-store-with-electron-builder-e960d46148ec
        "!README.md",
        "!Dockerfile",
        "!electron-builder.js",
        "!packaging",
        "!src",
        "!build_modules.sh",
    ],
    "mac": {
        "target": ["dmg", "mas"],
        "category": "public.app-category.utilities",
        "icon": "./packaging/icon.icns",
        "extendInfo": {
            "CFBundleURLSchemes": ["dicekeys"]
        },
        "provisioningProfile": "./DiceKeys_For_Distribution_Outside_App_Store.provisionprofile",
        "hardenedRuntime": true,
        // Full specification is required as this file will replace the one from electron-builder.
        // The equivalent XCode project can have fewer options but this won't work here as XCode adds required fields at
        // compile time eg. com.apple.application-identifier
        "entitlements": "./packaging/entitlements.mac.plist",
        "entitlementsInherit": "./packaging/entitlements.mac.plist",
        // "provisioningProfile": "./DiceKeys_For_Distribution_Outside_App_Store.provisionprofile",
        // TODO - set to true when adding support for dark mode in
        // https://github.com/dicekeys/dicekeys-app-typescript/issues/218
        "darkModeSupport": false,
        "gatekeeperAssess": false,
    },
    "buildVersion": 31,
    "dmg": {
        "format": "ULFO",
        "icon": "./packaging/icon.icns",
        "iconSize": 80,
        "background": "./packaging/dmg/background.tiff",
        // https://www.electron.build/configuration/dmg.html
        // "Signing is not required and will lead to unwanted errors in combination with notarization requirements."
        // "sign": true,
    },
    "mas": {
        // NOTE: inherits from "mac" section above
        "provisioningProfile": "./Profile_App_Store_Cert_on_M1.provisionprofile",
        // "identity": "Apple Distribution",
        "target": ["dmg"],
        "type": "distribution",
        "entitlements": "./packaging/entitlements.mas.plist",
        "entitlementsInherit": "./packaging/entitlements.mas.inherit.plist",
        "entitlementsLoginHelper": "./packaging/entitlements.mas.loginhelper.plist",        
        // should inherit
        // "icon": "./packaging/icon.icns",
        "hardenedRuntime": false,
        "strictVerify": false,
        "gatekeeperAssess": true,
    },
    "afterSign": "scripts/notarize.js",
    "directories": {
        "output": "out"
    },
    "asar": true,
    // See https://github.com/electron-userland/electron-builder/issues/3940#issuecomment-900527250
    "asarUnpack": [
        "node_modules/keytar"
     ],
    "protocols": [
        {
            "name": "dicekeys",
            "schemes": ["dicekeys"]
        }
    ],
    "linux": {
        "maintainer": "DiceKeys LLC",
        "category": 'Utility',
        "executableName": "dicekeys",
        "target" : ["AppImage", "snap", "deb", "rpm", "zip"]
    },
    "win": {
        "target" : ["nsis"],
        "icon": "./packaging/icon.ico",
        "certificateSha1": "7ADE682BA7E91845B88494377341851B426FFD5C", 
        "certificateSubjectName": "DiceKeys, LLC",
    },
    "nsis":{
        "oneClick": false
    }
}
