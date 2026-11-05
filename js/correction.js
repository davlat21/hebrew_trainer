// ======================================================
// correction.js
//
// ПРОВЕРКА СЛОВ, ФРАЗ И ПРЕДЛОЖЕНИЙ
// ПЕРЕД ДОБАВЛЕНИЕМ В ЛИЧНЫЙ СЛОВАРЬ
// ======================================================


// ======================================================
// УБРАТЬ ОГЛАСОВКИ
// ======================================================

function removeHebrewNiqqud(text) {

    return String(text || "")
        .normalize("NFD")
        .replace(/[\u0591-\u05C7]/g, "")
        .normalize("NFC");

}


// ======================================================
// НОРМАЛИЗАЦИЯ
// ======================================================

function normalizeCorrectionText(text) {

    return String(text || "")
        .trim()
        .replace(/\s+/g, " ");

}


// ======================================================
// РАССТОЯНИЕ ЛЕВЕНШТЕЙНА
// ======================================================

function correctionLevenshtein(
    a,
    b
) {

    a =
        String(a || "");


    b =
        String(b || "");


    const previous =
        new Array(
            b.length + 1
        );


    const current =
        new Array(
            b.length + 1
        );


    for (
        let j = 0;
        j <= b.length;
        j++
    ) {

        previous[j] = j;

    }


    for (
        let i = 1;
        i <= a.length;
        i++
    ) {

        current[0] = i;


        for (
            let j = 1;
            j <= b.length;
            j++
        ) {

            const cost =
                a[i - 1] ===
                b[j - 1]
                    ? 0
                    : 1;


            current[j] =
                Math.min(

                    previous[j] + 1,

                    current[j - 1] + 1,

                    previous[j - 1] +
                        cost

                );

        }


        for (
            let j = 0;
            j <= b.length;
            j++
        ) {

            previous[j] =
                current[j];

        }

    }


    return previous[
        b.length
    ];

}


// ======================================================
// ВСЕ ИЗВЕСТНЫЕ ИВРИТСКИЕ СЛОВА
// ======================================================

function getCorrectionHebrewDictionary() {

    const result =
        new Set();


    // ==================================================
    // ОСНОВНАЯ БАЗА
    // ==================================================

    if (
        typeof LANGUAGE_REFERENCE !==
        "undefined"
    ) {

        Object.keys(
            LANGUAGE_REFERENCE.words ||
            {}
        )
            .forEach(
                function (word) {

                    result.add(

                        removeHebrewNiqqud(
                            word
                        )

                    );

                }
            );

    }


    // ==================================================
    // БАЗА ТРАНСКРИПЦИЙ
    // ==================================================

    if (
        typeof HEBREW_TRANSCRIPTIONS !==
        "undefined"
    ) {

        Object.keys(
            HEBREW_TRANSCRIPTIONS
        )
            .forEach(
                function (word) {

                    result.add(

                        removeHebrewNiqqud(
                            word
                        )

                    );

                }
            );

    }


    return Array.from(
        result
    );

}


// ======================================================
// НАЙТИ БЛИЖАЙШЕЕ СЛОВО
// ======================================================

function findClosestHebrewWord(word) {

    const original =
        removeHebrewNiqqud(

            normalizeCorrectionText(
                word
            )

        );


    if (!original) {

        return null;

    }


    // ==================================================
    // ЯВНАЯ БАЗА ОШИБОК
    // ==================================================

    if (
        typeof LANGUAGE_REFERENCE !==
            "undefined" &&

        LANGUAGE_REFERENCE
            .replacements &&

        LANGUAGE_REFERENCE
            .replacements[
                original
            ]
    ) {

        return {

            original:
                original,

            corrected:
                LANGUAGE_REFERENCE
                    .replacements[
                        original
                    ],

            distance:
                1,

            confidence:
                1

        };

    }


    const dictionary =
        getCorrectionHebrewDictionary();


    // ==================================================
    // УЖЕ ПРАВИЛЬНОЕ СЛОВО
    // ==================================================

    if (
        dictionary.includes(
            original
        )
    ) {

        return {

            original:
                original,

            corrected:
                original,

            distance:
                0,

            confidence:
                1

        };

    }


    let bestWord =
        null;


    let bestDistance =
        Infinity;


    dictionary.forEach(
        function (candidate) {

            if (
                Math.abs(
                    candidate.length -
                    original.length
                ) > 2
            ) {

                return;

            }


            const distance =
                correctionLevenshtein(

                    original,

                    candidate

                );


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;


                bestWord =
                    candidate;

            }

        }
    );


    if (!bestWord) {

        return null;

    }


    let allowedDistance =
        1;


    if (
        original.length >= 7
    ) {

        allowedDistance =
            2;

    }


    if (
        bestDistance >
        allowedDistance
    ) {

        return null;

    }


    const confidence =
        Math.max(

            0,

            1 -
            bestDistance /
            Math.max(
                original.length,
                bestWord.length
            )

        );


    return {

        original:
            original,

        corrected:
            bestWord,

        distance:
            bestDistance,

        confidence:
            confidence

    };

}


// ======================================================
// ПРОВЕРКА ИВРИТСКОГО ТЕКСТА
// ======================================================

function checkHebrewText(text) {

    const original =
        normalizeCorrectionText(
            text
        );


    if (!original) {

        return {

            original: "",

            corrected: "",

            changed: false,

            changes: [],

            reference: null

        };

    }


    // ==================================================
    // ТОЧНАЯ ФРАЗА В БАЗЕ
    // ==================================================

    if (
        typeof LANGUAGE_REFERENCE !==
            "undefined" &&

        LANGUAGE_REFERENCE.phrases &&

        LANGUAGE_REFERENCE.phrases[
            original
        ]
    ) {

        return {

            original:
                original,

            corrected:
                original,

            changed:
                false,

            changes:
                [],

            reference:
                LANGUAGE_REFERENCE
                    .phrases[
                        original
                    ]

        };

    }


    // ==================================================
    // ПРОВЕРКА ПО СЛОВАМ
    // ==================================================

    const tokens =
        original.split(
            /\s+/
        );


    const correctedTokens =
        [];


    const changes =
        [];


    tokens.forEach(
        function (token) {

            const prefixMatch =
                token.match(
                    /^[^\u0590-\u05FF]*/
                );


            const suffixMatch =
                token.match(
                    /[^\u0590-\u05FF]*$/
                );


            const prefix =
                prefixMatch
                    ? prefixMatch[0]
                    : "";


            const suffix =
                suffixMatch
                    ? suffixMatch[0]
                    : "";


            const endIndex =
                token.length -
                suffix.length;


            const hebrewPart =
                token.slice(
                    prefix.length,
                    endIndex
                );


            if (!hebrewPart) {

                correctedTokens.push(
                    token
                );

                return;

            }


            const result =
                findClosestHebrewWord(
                    hebrewPart
                );


            if (
                result &&

                result.corrected !==
                    removeHebrewNiqqud(
                        hebrewPart
                    ) &&

                result.confidence >=
                    0.72
            ) {

                correctedTokens.push(

                    prefix +
                    result.corrected +
                    suffix

                );


                changes.push({

                    from:
                        hebrewPart,

                    to:
                        result.corrected,

                    reason:
                        "Возможная ошибка написания"

                });


                return;

            }


            correctedTokens.push(
                token
            );

        }
    );


    const corrected =
        correctedTokens.join(
            " "
        );


    let reference =
        null;


    if (
        typeof LANGUAGE_REFERENCE !==
            "undefined" &&

        LANGUAGE_REFERENCE.phrases
    ) {

        reference =
            LANGUAGE_REFERENCE
                .phrases[
                    corrected
                ] ||
            null;

    }


    return {

        original:
            original,

        corrected:
            corrected,

        changed:
            original !==
            corrected,

        changes:
            changes,

        reference:
            reference

    };

}


// ======================================================
// ПОЛУЧИТЬ ПОЛНУЮ ИНФОРМАЦИЮ
// О ТРАНСКРИПЦИИ
// ======================================================

function getReferenceTranscriptionInfo(
    hebrew
) {

    if (
        typeof getHebrewPronunciation ===
        "function"
    ) {

        return getHebrewPronunciation(
            hebrew
        );

    }


    return {

        transcription:
            "",

        source:
            "none",

        confidence:
            0,

        generated:
            false,

        words:
            []

    };

}


// ======================================================
// СТАРАЯ СОВМЕСТИМАЯ ФУНКЦИЯ
//
// Оставляем её, чтобы другие части проекта,
// если они её вызывают, не сломались.
// ======================================================

function getReferenceTranscription(
    hebrew
) {

    const info =
        getReferenceTranscriptionInfo(
            hebrew
        );


    return (
        info.transcription ||
        ""
    );

}


// ======================================================
// ПЕРЕВОД
// ======================================================

function getReferenceRussian(
    hebrew
) {

    const clean =
        removeHebrewNiqqud(

            normalizeCorrectionText(
                hebrew
            )

        );


    // ==================================================
    // ЦЕЛАЯ ФРАЗА
    // ==================================================

    if (
        typeof LANGUAGE_REFERENCE !==
            "undefined" &&

        LANGUAGE_REFERENCE.phrases &&

        LANGUAGE_REFERENCE.phrases[
            clean
        ]
    ) {

        return (

            LANGUAGE_REFERENCE
                .phrases[
                    clean
                ]
                .russian ||

            ""

        );

    }


    // ==================================================
    // ОДНО СЛОВО
    // ==================================================

    if (
        typeof LANGUAGE_REFERENCE !==
            "undefined" &&

        LANGUAGE_REFERENCE.words &&

        LANGUAGE_REFERENCE.words[
            clean
        ]
    ) {

        return (

            LANGUAGE_REFERENCE
                .words[
                    clean
                ]
                .russian ||

            ""

        );

    }


    return "";

}


// ======================================================
// ОПИСАНИЕ ИСТОЧНИКА ТРАНСКРИПЦИИ
// ======================================================

function getTranscriptionSourceLabel(
    info
) {

    if (!info) {

        return "";

    }


    switch (
        info.source
    ) {

        case "dictionary-phrase":

            return "Транскрипция взята из языковой базы";


        case "dictionary-word":

        case "dictionary-words":

            return "Транскрипция взята из словарной базы";


        case "transcription-database":

            return "Транскрипция взята из базы произношений";


        case "learned":

            return "Использована ранее подтверждённая транскрипция";


        case "rules-niqqud":

            return "Транскрипция рассчитана по огласовкам";


        case "mixed":

            return "Транскрипция частично взята из базы и частично рассчитана";


        case "rules":

        case "rules-unpointed":

            return "Транскрипция рассчитана автоматически";


        default:

            return "Предлагаемая транскрипция";

    }

}


// ======================================================
// ПОЛНАЯ ПРОВЕРКА ЗАПИСИ
// ======================================================

function checkLanguageEntry(
    hebrew,
    transcription,
    russian
) {

    const original = {

        hebrew:
            normalizeCorrectionText(
                hebrew
            ),

        transcription:
            normalizeCorrectionText(
                transcription
            ),

        russian:
            normalizeCorrectionText(
                russian
            )

    };


    // ==================================================
    // 1. СНАЧАЛА ПРОВЕРЯЕМ ИВРИТ
    // ==================================================

    const hebrewCheck =
        checkHebrewText(
            original.hebrew
        );


    const correctedHebrew =
        hebrewCheck.corrected;


    // ==================================================
    // 2. ТОЛЬКО ПОСЛЕ ИСПРАВЛЕНИЯ ИВРИТА
    // ПОЛУЧАЕМ ТРАНСКРИПЦИЮ
    // ==================================================

    const transcriptionInfo =
        getReferenceTranscriptionInfo(
            correctedHebrew
        );


    const referenceTranscription =
        transcriptionInfo
            .transcription ||
        "";


    // ==================================================
    // 3. ПЕРЕВОД
    // ==================================================

    const referenceRussian =
        getReferenceRussian(
            correctedHebrew
        );


    // ==================================================
    // 4. СОБИРАЕМ ИСПРАВЛЕННЫЙ ВАРИАНТ
    // ==================================================

    const corrected = {

        hebrew:
            correctedHebrew,

        transcription:
            referenceTranscription ||
            original.transcription,

        russian:
            referenceRussian ||
            original.russian

    };


    const changes =
        [
            ...hebrewCheck.changes
        ];


    // ==================================================
    // 5. ТРАНСКРИПЦИЯ
    // ==================================================

    if (
        referenceTranscription
    ) {

        // ----------------------------------------------
        // ПОЛЬЗОВАТЕЛЬ НЕ ВВОДИЛ ТРАНСКРИПЦИЮ
        // ----------------------------------------------

        if (
            !original.transcription
        ) {

            changes.push({

                from:
                    "Транскрипция не указана",

                to:
                    referenceTranscription,

                reason:
                    getTranscriptionSourceLabel(
                        transcriptionInfo
                    )

            });

        }

        // ----------------------------------------------
        // ПОЛЬЗОВАТЕЛЬ ВВЁЛ ДРУГУЮ ТРАНСКРИПЦИЮ
        // ----------------------------------------------

        else if (
            referenceTranscription
                .toLowerCase() !==
            original.transcription
                .toLowerCase()
        ) {

            changes.push({

                from:
                    original.transcription,

                to:
                    referenceTranscription,

                reason:
                    getTranscriptionSourceLabel(
                        transcriptionInfo
                    )

            });

        }

    }


    // ==================================================
    // 6. ПЕРЕВОД
    // ==================================================

    if (
        referenceRussian &&
        referenceRussian
            .toLowerCase() !==
        original.russian
            .toLowerCase()
    ) {

        changes.push({

            from:
                original.russian ||
                "Перевод не указан",

            to:
                referenceRussian,

            reason:
                "Перевод отличается от справочного"

        });

    }


    // ==================================================
    // 7. ИЗМЕНИЛАСЬ ЛИ ЗАПИСЬ
    // ==================================================

    const changed =
        (
            original.hebrew !==
            corrected.hebrew
        ) ||
        (
            original.transcription
                .toLowerCase() !==
            corrected.transcription
                .toLowerCase()
        ) ||
        (
            original.russian
                .toLowerCase() !==
            corrected.russian
                .toLowerCase()
        );


    // ==================================================
    // 8. ВЕРИФИКАЦИЯ
    // ==================================================

    const verified =
        Boolean(

            hebrewCheck.reference ||

            referenceRussian ||

            (
                referenceTranscription &&
                transcriptionInfo
                    .confidence >= 0.80
            )

        );


    // ==================================================
    // РЕЗУЛЬТАТ
    // ==================================================

    return {

        original:
            original,

        corrected:
            corrected,

        changed:
            changed,

        changes:
            changes,

        verified:
            verified,


        // Дополнительная информация.
        // Пригодится нам дальше для интерфейса.

        transcriptionInfo:
            transcriptionInfo

    };

}