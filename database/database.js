// Общая база доступна будущим функциям сайта через window.HebrewRussianDatabase.
// Личные слова пользователя в localStorage хранятся отдельно.
(function (global) {
    "use strict";
    const records = global.HEBREW_RUSSIAN_WORDS;
    if (!Array.isArray(records)) {
        throw new Error("Сначала подключи database/words.js");
    }
    function normalize(value) {
        return String(value == null ? "" : value).normalize("NFC")
            .replace(/[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, "")
            .replace(/\s+/g, " ").trim().toLowerCase();
    }
    function copy(record) {
        return { hebrew: record.hebrew, transcription: record.transcription, russian: record.russian, partOfSpeech: record.partOfSpeech };
    }
    const index = records.map(function (record) {
        return { record: record, fields: [record.hebrew, record.transcription, record.russian].map(normalize) };
    });
    global.HebrewRussianDatabase = Object.freeze({
        get count() { return records.length; },
        getAll: function () { return records.map(copy); },
        getGroups: function () {
            return Object.entries(global.HEBREW_RUSSIAN_PARTS).map(function (pair) {
                return { code: pair[0], name: pair[1], count: records.filter(function (r) { return r.partOfSpeech === pair[0]; }).length };
            });
        },
        getByPartOfSpeech: function (code) {
            const groups = global.HEBREW_RUSSIAN_PARTS;
            const found = Object.keys(groups).find(function (key) { return key === code || normalize(groups[key]) === normalize(code); });
            if (!found) throw new RangeError("Неизвестная группа: " + code);
            return records.filter(function (record) { return record.partOfSpeech === found; }).map(copy);
        },

        findRussian: function (word) {
            const query = normalize(word);
            if (!query) return [];
            return records.filter(function (record) {
                const full = normalize(record.russian);
                // Parenthetical meaning labels remain in saved data. Match the
                // complete headword, never a substring (отец != отчим).
                const head = normalize(record.russian.replace(/\([^)]*\)/g, ""));
                return full === query || head === query;
            }).map(copy);
        },
        findHebrew: function (word) {
            const query = normalize(word);
            if (!query) return [];
            return index.filter(function (item) { return item.fields[0] === query; })
                .map(function (item) { return copy(item.record); });
        },
        search: function (query, limit) {
            const text = normalize(query);
            const count = limit === undefined ? 50 : limit;
            if (!Number.isInteger(count) || count < 0) throw new RangeError("limit должен быть целым числом >= 0");
            if (!text || count === 0) return [];
            const matches = [];
            for (const item of index) {
                if (item.fields.some(function (field) { return field.includes(text); })) {
                    matches.push(copy(item.record));
                    if (matches.length >= count) break;
                }
            }
            return matches;
        }
    });
})(window);
