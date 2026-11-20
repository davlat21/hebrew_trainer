"""Создать браузерную копию words.js из words.json: python sync_database.py."""
import json
from pathlib import Path


def main():
    folder = Path(__file__).resolve().parent
    records = json.loads((folder / "words.json").read_text(encoding="utf-8"))
    if not isinstance(records, list):
        raise ValueError("words.json должен содержать массив записей")
    categories = json.loads((folder / "parts-of-speech.json").read_text(encoding="utf-8"))
    seen = set()
    for number, record in enumerate(records, 1):
        if not isinstance(record, dict) or set(record) != {"hebrew", "transcription", "russian", "partOfSpeech"}:
            raise ValueError(f"Запись {number}: нужны hebrew, transcription, russian, partOfSpeech")
        if any(not isinstance(value, str) or not value.strip() for value in record.values()):
            raise ValueError(f"Запись {number}: все три поля должны содержать текст")
        if record["partOfSpeech"] not in categories:
            raise ValueError(f"Запись {number}: неизвестная часть речи")
        key = tuple(record[field] for field in ("hebrew", "transcription", "russian"))
        if key in seen:
            raise ValueError(f"Запись {number}: точный повтор записи")
        seen.add(key)
    data = json.dumps(records, ensure_ascii=False, indent=2).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    output = "// Создано из words.json. Изменяй words.json и запускай sync_database.py.\n"
    output += "window.HEBREW_RUSSIAN_WORDS = Object.freeze(" + data + ".map(function (record) { return Object.freeze(record); }));\n"
    output += "window.HEBREW_RUSSIAN_PARTS = Object.freeze(" + json.dumps(categories, ensure_ascii=False) + ");\n"
    groups = folder / "groups"
    groups.mkdir(exist_ok=True)
    for code in categories:
        group = [record for record in records if record["partOfSpeech"] == code]
        (groups / f"{code}.json").write_text(json.dumps(group, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    target = folder / "words.js"
    temporary = folder / "words.js.tmp"
    temporary.write_text(output, encoding="utf-8")
    temporary.replace(target)
    print(f"Готово. Записей: {len(records)}")


if __name__ == "__main__":
    main()
