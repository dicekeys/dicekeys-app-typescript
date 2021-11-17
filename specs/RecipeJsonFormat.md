# Format for Recipes in DiceKeys Applications

The DiceKeys application recipe format extends the [JSON Recipe format from the seeded cryptography library](https://dicekeys.github.io/seeded-crypto/recipe_format.html).

A single-character change to a recipe will change the derived values, and so if a user re-constructs a recipe with a different field ordering or choice of white space they will be unable to reconstruct secrets.

To reduce the risk, the app will canonicalize Recipes before feeding them to the seeded cryptography engine.  It must remove all formatting whitespace (whitespace that is not contained within string values, such that  `{ "purpose" : "Encrypting Stuff" }` becomes `{"purpose":"Encrypting Stuff"}`)
(NOTE: may update this if adding a flag to the cryptography library to remove whitespace).

The order of object fields in recipes should be in UTF8 sort order of field name, with two exceptions of:
  - `"#"` (the sequence number field), if present, should appear last.
  - `"purpose"`, if present, should appear first

The alphabetical ordering of fields applies to all objects, not just the top-level object, and so when an `"allow"` field of the top-level object contains an array of objects, those descendent objects should place the `"host"` field before the (optional) `"paths"` field.

Sequence numbers must be encoded as numbers (not strings), should fields must always be excluded if 1, and so only included if > 1.

