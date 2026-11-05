(function (global) {
"use strict";
const records = global.GENERAL_HEBREW_RUSSIAN_WORDS;
if (!Array.isArray(records)) throw new Error("Сначала подключите general-words/words.js");
const copy = r => ({...r});
const normalize = v => String(v ?? "").normalize("NFC").replace(/[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
global.GeneralHebrewRussianDatabase = Object.freeze({
 get count() { return records.length; },
 getAll: () => records.map(copy),
 findRussian: word => records.filter(r => normalize(word) && normalize(r.russian) === normalize(word)).map(copy),
 findHebrew: word => records.filter(r => normalize(word) && normalize(r.hebrew) === normalize(word)).map(copy),
 search: function(query, limit = 50) {
  if (!Number.isInteger(limit) || limit < 0) throw new RangeError("limit должен быть целым числом >= 0");
  const text = normalize(query);
  return text ? records.filter(r => [r.hebrew, r.transcription, r.russian].some(v => normalize(v).includes(text))).slice(0, limit).map(copy) : [];
 }
});
})(window);
