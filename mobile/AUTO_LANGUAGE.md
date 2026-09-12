# ONDOQ automatic language detection

ONDOQ detects the device/browser language on first launch using `navigator.language` and `navigator.languages`.

Supported languages: Arabic, English, French, Spanish, German. If the device language is unsupported, English is used as the fallback.

After the user manually selects a language, that choice is saved and takes precedence over device language until the app is changed manually again.
