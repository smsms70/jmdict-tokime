# JMdict-Tokime

Parses the JMdict XML dictionary and outputs a simplified JSON format for use by Tokime.

## Output Format

JSON Lines format (one entry per line):
- `id` - Entry ID
- `kanji` - Kanji elements with `text` and `priority` tags
- `kana` - Reading elements with `text`, `priority`, and `appliesToKanji`
- `sense` - Meanings with `partOfSpeech` and `gloss` (text + lang)

## License

This project uses [JMdict](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project), a dictionary created by the [Electronic Dictionary Research and Development Group](https://www.edrdg.org/).

JMdict is licensed under [CC BY-SA 4.0](https://www.edrdg.org/edrdg/licence.html). This project's output is also licensed under CC BY-SA 4.0.
