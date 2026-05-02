# JMdict-Tokime

Parses the JMdict XML dictionary and outputs simplified JSON formats for use by Tokime and other applications.

## Output Files

All files contain the same 30,105 filtered entries (common Japanese words with priority tags).

### jmdict-tokime.json.zip

Filtered version with only fields needed by the Tokime app:
- `id` - Entry ID
- `kanji` - Kanji elements with `text` and `priority` tags
- `kana` - Reading elements with `text` and `priority`
- `sense` - Meanings with `partOfSpeech` and `gloss` (text + lang)

Ideal for applications that need a lightweight dictionary focused on common words with English translations.

### jmdict-common.json.zip

Same 30,105 entries as above but with all original XML tags from JMdict (full dictionary data). Includes:
- All kanji information (readings, priorities, cross-references)
- All reading information
- All sense data (part of speech, meanings, translations, examples, etc.)
- All metadata from the original JMdict format

Useful for applications that need access to the complete dictionary data.

### jpdb-freq-v2.json.zip

Parsed JPDB frequency data. Contains frequency rankings for Japanese words from the JPDB corpus.

### jmdict+jpdb-freq.json.zip

Merged dictionary with embedded frequency data. Same entries as jmdict-tokime.json but with JPDB frequency ranks included on each kanji/kana element:
- `kanji[].freq` - Frequency rank (number or undefined)
- `kana[].freq` - Frequency rank (number or undefined)

Ideal for applications that want dictionary + frequency in a single file.

**Note:** All files contain only English translations from JMdict.

## Download

Pre-built releases are available on the [GitHub Releases](https://github.com/smsms70/jmdict-tokime/releases) page.

## Building from Source

```bash
bun install
bun run download   # Download and decompress JMdict XML
bun run build      # Parse XML to JSON
bun run build-freq # Parse JPDB frequency data
bun run merge-freq # Merge dictionary with frequency data
bun run compress  # Compress to ZIP files
bun run validate  # Validate output
```

## License

This project uses [JMdict](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project), a dictionary created by the [Electronic Dictionary Research and Development Group](https://www.edrdg.org/).

JMdict is licensed under [CC BY-SA 4.0](https://www.edrdg.org/edrdg/licence.html). This project's output is also licensed under CC BY-SA 4.0.
