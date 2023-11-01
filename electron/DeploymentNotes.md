

```bash
MacBook-Pro:electron stuart$ spctl -avv out/mac-universal/DiceKeys.app
out/mac-universal/DiceKeys.app: accepted
source=Notarized Developer ID
origin=Developer ID Application: DiceKeys, LLC (CTDV6HX5KK)
MacBook-Pro:electron stuart$ codesign -vv --deep-verify out/mac-universal/DiceKeys.app
out/mac-universal/DiceKeys.app: valid on disk
out/mac-universal/DiceKeys.app: satisfies its Designated Requirement
```