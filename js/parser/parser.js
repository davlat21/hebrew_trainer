// ======================================================
// parser.js
// Главный контроллер распознавания.
//
// Поддерживает:
// 1. Иврит | транскрипция | перевод
// 2. Иврит | | перевод
// 3. Иврит | транскрипция |
// 4. Иврит + Latin + русский
// 5. Иврит + русский перевод
// 6. Иврит + кириллическая транскрипция + перевод
// 7. Только иврит
//
// ВАЖНО:
// отсутствие транскрипции больше НЕ считается ошибкой.
// ======================================================


const PARSER_SETTINGS = {

    minimumConfidence: 0.35,

    automaticConfidence: 0.80,

    reviewConfidence: 0.55

};


// ======================================================
// СОЗДАТЬ РЕЗУЛЬТАТ
// ======================================================

function createParsedResult(
    hebrew,
    transcription,
    russian,
    confidence,
    exact,
    method
) {

    return {

        hebrew:
            String(hebrew || "").trim(),

        transcription:
            String(transcription || "").trim(),

        russian:
            String(russian || "").trim(),

        confidence:
            typeof confidence === "number"
                ? confidence
                : 0,

        exact:
            Boolean(exact),

        method:
            method || "unknown"

    };

}


// ======================================================
// ФОРМАТ ЧЕРЕЗ |
//
// שלום | шалом | привет
// שלום | | привет
// שלום | шалом |
// ======================================================

function parseSeparatedInput(text) {

    if (!text.includes("|")) {

        return null;

    }


    const sections =
        text
            .split("|")
            .map(function (section) {

                return section.trim();

            });


    if (sections.length !== 3) {

        return null;

    }


    const hebrew =
        sections[0];


    const transcription =
        sections[1];


    const russian =
        sections[2];


    if (
        !hebrew ||
        !containsHebrew(hebrew)
    ) {

        return null;

    }


    // Теперь разрешаем отсутствие
    // транскрипции или перевода.

    if (
        !transcription &&
        !russian
    ) {

        return createParsedResult(

            hebrew,
            "",
            "",
            1,
            true,
            "separator-hebrew-only"

        );

    }


    return createParsedResult(

        hebrew,
        transcription,
        russian,
        1,
        true,
        "separator"

    );

}


// ======================================================
// ТРИ РАЗНЫХ АЛФАВИТА
//
// שלוםshalomпривет
// ======================================================

function parseMixedAlphabetInput(text) {

    const groups =
        splitByAlphabet(text);


    const hebrew =
        collectAlphabetGroups(
            groups,
            "hebrew"
        );


    const latin =
        collectAlphabetGroups(
            groups,
            "latin"
        );


    const cyrillic =
        collectAlphabetGroups(
            groups,
            "cyrillic"
        );


    if (!hebrew) {

        return null;

    }


    if (
        latin &&
        cyrillic
    ) {

        return createParsedResult(

            hebrew,
            latin,
            cyrillic,
            0.98,
            false,
            "alphabet-three-parts"

        );

    }


    if (latin) {

        return createParsedResult(

            hebrew,
            latin,
            "",
            0.92,
            false,
            "alphabet-hebrew-latin"

        );

    }


    return null;

}


// ======================================================
// ОПРЕДЕЛИТЬ:
// КИРИЛЛИЦА — ЭТО СКОРЕЕ РУССКИЙ ПЕРЕВОД?
//
// Это особенно важно для:
//
// אני מבין מה אתה אומר Я понимаю, что ты говоришь.
//
// Здесь НЕ надо искать транскрипцию.
// ======================================================

function looksLikeRussianTranslation(text) {

    const clean =
        String(text || "")
            .trim()
            .toLowerCase();


    if (!clean) {

        return false;

    }


    // ----------------------------------------------
    // Если исходный текст содержит нормальные
    // пробелы между несколькими русскими словами,
    // это сильный признак перевода.
    // ----------------------------------------------

    const words =
        clean
            .split(/\s+/)
            .filter(Boolean);


    if (words.length >= 2) {

        let russianWordHits = 0;


        if (
            typeof getRussianWordFrequency ===
            "function"
        ) {

            words.forEach(
                function (word) {

                    const normalized =
                        word
                            .replace(
                                /[^а-яё-]/gi,
                                ""
                            );


                    if (
                        normalized &&
                        getRussianWordFrequency(
                            normalized
                        )
                    ) {

                        russianWordHits++;

                    }

                }
            );

        }


        // Даже если наша русская база пока маленькая,
        // нормальное предложение из 3+ слов
        // считаем вероятным переводом.

        if (words.length >= 3) {

            return true;

        }


        if (
            russianWordHits >= 1
        ) {

            return true;

        }

    }


    // ----------------------------------------------
    // Пунктуация русского предложения
    // ----------------------------------------------

    if (
        /[,.!?;:]/.test(clean) &&
        words.length >= 2
    ) {

        return true;

    }


    return false;

}


// ======================================================
// ИВРИТ + КИРИЛЛИЦА
//
// Возможны ДВА принципиально разных случая:
//
// 1.
// שלום шалом привет
//
// transcription + translation
//
// 2.
// אני מבין מה אתה אומר Я понимаю, что ты говоришь.
//
// только translation
// ======================================================

function parseHebrewCyrillicInput(text) {

    if (
        !containsHebrew(text) ||
        !containsCyrillic(text)
    ) {

        return null;

    }


    const hebrew =
        extractHebrew(text);


    const cyrillic =
        extractCyrillic(text);


    if (
        !hebrew ||
        !cyrillic
    ) {

        return null;

    }


    // ==================================================
    // СНАЧАЛА ПРОВЕРЯЕМ:
    // не является ли вся кириллица переводом.
    // ==================================================

    if (
        looksLikeRussianTranslation(
            cyrillic
        )
    ) {

        return createParsedResult(

            hebrew,

            "",

            cyrillic,

            0.90,

            false,

            "hebrew-russian"

        );

    }


    // ==================================================
    // ИНАЧЕ ПРОБУЕМ СТАРЫЙ АЛГОРИТМ:
    //
    // שלוםшаломпривет
    //
    // или
    //
    // שלום шалом привет
    // ==================================================

    const result =
        findBestCyrillicBoundary(
            hebrew,
            cyrillic
        );


    if (!result) {

        // Не смогли надёжно разделить.
        //
        // Но сам иврит мы всё равно
        // не должны терять.

        return createParsedResult(

            hebrew,
            "",
            cyrillic,
            0.45,
            false,
            "hebrew-cyrillic-uncertain"

        );

    }


    result.method =
        "cyrillic-boundary";


    return addConfidenceMetadata(
        result
    );

}


// ======================================================
// ТОЛЬКО ИВРИТ
// ======================================================

function parseHebrewOnlyInput(text) {

    const clean =
        normalizeSpaces(text);


    if (
        !clean ||
        !containsHebrew(clean)
    ) {

        return null;

    }


    // Если есть другие алфавиты,
    // значит это уже не Hebrew-only.

    if (
        containsLatin(clean) ||
        containsCyrillic(clean)
    ) {

        return null;

    }


    return createParsedResult(

        clean,
        "",
        "",
        0.95,
        false,
        "hebrew-only"

    );

}


// ======================================================
// ОБЫЧНЫЙ ВВОД С ПРОБЕЛАМИ
// ======================================================

function parseTraditionalInput(text) {

    const parts =
        normalizeSpaces(text)
            .split(/\s+/)
            .filter(Boolean);


    if (!parts.length) {

        return null;

    }


    const hebrewParts = [];

    const latinParts = [];

    const cyrillicParts = [];


    parts.forEach(
        function (part) {

            if (
                containsHebrew(part)
            ) {

                hebrewParts.push(
                    part
                );

                return;

            }


            if (
                containsLatin(part)
            ) {

                latinParts.push(
                    part
                );

                return;

            }


            if (
                containsCyrillic(part)
            ) {

                cyrillicParts.push(
                    part
                );

            }

        }
    );


    if (!hebrewParts.length) {

        return null;

    }


    const hebrew =
        hebrewParts.join(" ");


    // ==================================================
    // ИВРИТ + LATIN + РУССКИЙ
    // ==================================================

    if (
        latinParts.length &&
        cyrillicParts.length
    ) {

        return createParsedResult(

            hebrew,

            latinParts.join(" "),

            cyrillicParts.join(" "),

            0.95,

            false,

            "traditional-three-parts"

        );

    }


    // ==================================================
    // ИВРИТ + LATIN
    // ==================================================

    if (
        latinParts.length &&
        !cyrillicParts.length
    ) {

        return createParsedResult(

            hebrew,

            latinParts.join(" "),

            "",

            0.90,

            false,

            "traditional-hebrew-latin"

        );

    }


    // ==================================================
    // ИВРИТ + КИРИЛЛИЦА
    // ==================================================

    if (
        cyrillicParts.length
    ) {

        const cyrillicText =
            cyrillicParts.join(" ");


        if (
            looksLikeRussianTranslation(
                cyrillicText
            )
        ) {

            return createParsedResult(

                hebrew,

                "",

                cyrillicText,

                0.90,

                false,

                "traditional-hebrew-russian"

            );

        }


        if (
            cyrillicParts.length >= 2
        ) {

            const result =
                findBestCyrillicBoundary(

                    hebrew,

                    cyrillicParts.join("")

                );


            if (result) {

                result.method =
                    "traditional-cyrillic";


                return addConfidenceMetadata(
                    result
                );

            }

        }


        return createParsedResult(

            hebrew,

            "",

            cyrillicText,

            0.45,

            false,

            "traditional-hebrew-cyrillic-uncertain"

        );

    }


    // ==================================================
    // ТОЛЬКО ИВРИТ
    // ==================================================

    return createParsedResult(

        hebrew,
        "",
        "",
        0.95,
        false,
        "traditional-hebrew-only"

    );

}


// ======================================================
// ПРОВЕРКА РЕЗУЛЬТАТА
// ======================================================

function validateParsedResult(result) {

    if (!result) {

        return null;

    }


    result.hebrew =
        String(
            result.hebrew || ""
        ).trim();


    result.transcription =
        String(
            result.transcription || ""
        ).trim();


    result.russian =
        String(
            result.russian || ""
        ).trim();


    // ==================================================
    // ГЛАВНОЕ ИЗМЕНЕНИЕ:
    //
    // раньше требовались ВСЕ ТРИ поля.
    //
    // Теперь обязательным является только иврит.
    // ==================================================

    if (!result.hebrew) {

        return null;

    }


    if (
        !containsHebrew(
            result.hebrew
        )
    ) {

        return null;

    }


    if (
        typeof result.confidence !==
        "number"
    ) {

        result.confidence = 0;

    }


    return addConfidenceMetadata(
        result
    );

}


// ======================================================
// ГЛАВНАЯ ФУНКЦИЯ
//
// ИМЯ НЕ МЕНЯЕМ.
// import.js вызывает parseQuickInput().
// ======================================================

function parseQuickInput(text) {

    const cleanText =
        normalizeSpaces(text);


    if (!cleanText) {

        return null;

    }


    // ==================================================
    // 1. ТОЧНЫЙ РАЗДЕЛИТЕЛЬ |
// ==================================================

    if (
        cleanText.includes("|")
    ) {

        return validateParsedResult(

            parseSeparatedInput(
                cleanText
            )

        );

    }


    // ==================================================
    // 2. ТРИ АЛФАВИТА
    //
    // שלוםshalomпривет
    // ==================================================

    if (
        containsHebrew(cleanText) &&
        containsLatin(cleanText) &&
        containsCyrillic(cleanText)
    ) {

        const result =
            parseMixedAlphabetInput(
                cleanText
            );


        if (result) {

            return validateParsedResult(
                result
            );

        }

    }


    // ==================================================
    // 3. ИВРИТ + КИРИЛЛИЦА
    // ==================================================

    if (
        containsHebrew(cleanText) &&
        containsCyrillic(cleanText) &&
        !containsLatin(cleanText)
    ) {

        const result =
            parseHebrewCyrillicInput(
                cleanText
            );


        if (result) {

            return validateParsedResult(
                result
            );

        }

    }


    // ==================================================
    // 4. ТОЛЬКО ИВРИТ
    // ==================================================

    if (
        containsHebrew(cleanText) &&
        !containsLatin(cleanText) &&
        !containsCyrillic(cleanText)
    ) {

        return validateParsedResult(

            parseHebrewOnlyInput(
                cleanText
            )

        );

    }


    // ==================================================
    // 5. ОБЫЧНЫЙ ВАРИАНТ
    // ==================================================

    return validateParsedResult(

        parseTraditionalInput(
            cleanText
        )

    );

}


// ======================================================
// ПОЛЬЗОВАТЕЛЬ ПОДТВЕРДИЛ ТРАНСКРИПЦИЮ
// ======================================================

function confirmParsedTranscription(
    hebrew,
    transcription
) {

    if (
        !hebrew ||
        !transcription
    ) {

        return;

    }


    learnTranscription(
        hebrew,
        transcription
    );

}