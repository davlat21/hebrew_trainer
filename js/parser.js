// ==================================================
// PARSER.JS
// УМНОЕ РАСПОЗНАВАНИЕ:
// ИВРИТ + ТРАНСКРИПЦИЯ + ПЕРЕВОД
//
// ПОДДЕРЖИВАЕТ:
//
// 1.
// שלום | shalom | привет
//
// 2.
// שלום shalom привет
//
// 3.
// שלוםshalomпривет
//
// 4.
// שלום шалом привет
//
// 5.
// שלוםшаломпривет
//
// 6.
// אני רוצה ללמוד עברית
// ani rotze lilmod ivrit
// я хочу учить иврит
//
// ВАЖНО:
// одна физическая строка textarea = одна запись.
// ==================================================


// ==================================================
// НАСТРОЙКИ
// ==================================================

const PARSER_SETTINGS = {

    // Минимальная уверенность,
    // которую уже принимает import.js

    minimumConfidence: 0.35,


    // Насколько далеко от предполагаемой
    // длины транскрипции искать границу

    boundarySearchRadius: 12,


    // Максимальное количество символов,
    // которые перебираем полностью
    // при кириллической транскрипции

    maxFullBoundarySearch: 160

};


// ==================================================
// ПРОВЕРКА СИМВОЛОВ
// ==================================================

function isHebrewChar(char) {

    return /[\u0590-\u05FF]/.test(
        char
    );

}


function isCyrillicChar(char) {

    return /[А-Яа-яЁё]/.test(
        char
    );

}


function isLatinChar(char) {

    return /[A-Za-z]/.test(
        char
    );

}


// ==================================================
// ПРОВЕРКА СТРОК
// ==================================================

function containsHebrew(text) {

    return /[\u0590-\u05FF]/.test(
        text
    );

}


function containsCyrillic(text) {

    return /[А-Яа-яЁё]/.test(
        text
    );

}


function containsLatin(text) {

    return /[A-Za-z]/.test(
        text
    );

}


// ==================================================
// НОРМАЛИЗАЦИЯ ПРОБЕЛОВ
// ==================================================

function normalizeSpaces(text) {

    return String(text || "")
        .replace(/\s+/g, " ")
        .trim();

}


// ==================================================
// НОРМАЛИЗАЦИЯ РУССКОГО
// ==================================================

function normalizeRussian(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^а-я]/g, "");

}


// ==================================================
// НОРМАЛИЗАЦИЯ ЛАТИНИЦЫ
// ==================================================

function normalizeLatin(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");

}


// ==================================================
// НОРМАЛИЗАЦИЯ ИВРИТА
// ==================================================

function normalizeHebrew(text) {

    return String(text || "")
        .replace(
            /[^\u0590-\u05FF]/g,
            ""
        );

}


// ==================================================
// ОПРЕДЕЛЯЕМ ТИП СИМВОЛА
// ==================================================

function getCharacterType(char) {

    if (isHebrewChar(char)) {

        return "hebrew";

    }


    if (isLatinChar(char)) {

        return "latin";

    }


    if (isCyrillicChar(char)) {

        return "cyrillic";

    }


    if (/\s/.test(char)) {

        return "space";

    }


    return "other";

}


// ==================================================
// РАЗБИВАЕМ СТРОКУ ПРИ СМЕНЕ АЛФАВИТА
//
// שלוםshalomпривет
//
// станет:
//
// שלום
// shalom
// привет
// ==================================================

function splitByAlphabet(text) {

    const groups = [];

    let currentText = "";

    let currentType = null;


    for (const char of text) {

        const type =
            getCharacterType(char);


        // ----------------------------------------------
        // ПРОБЕЛ
        // ----------------------------------------------

        if (type === "space") {

            if (
                currentText !== "" &&
                !currentText.endsWith(" ")
            ) {

                currentText += " ";

            }

            continue;

        }


        // ----------------------------------------------
        // ЗНАКИ ПРЕПИНАНИЯ
        // ----------------------------------------------

        if (type === "other") {

            if (currentText !== "") {

                currentText += char;

            }

            continue;

        }


        // ----------------------------------------------
        // ПЕРВАЯ БУКВА
        // ----------------------------------------------

        if (currentType === null) {

            currentType = type;

            currentText = char;

            continue;

        }


        // ----------------------------------------------
        // ТОТ ЖЕ АЛФАВИТ
        // ----------------------------------------------

        if (type === currentType) {

            currentText += char;

            continue;

        }


        // ----------------------------------------------
        // АЛФАВИТ ИЗМЕНИЛСЯ
        // ----------------------------------------------

        const cleanCurrent =
            normalizeSpaces(
                currentText
            );


        if (cleanCurrent !== "") {

            groups.push({

                type:
                    currentType,

                text:
                    cleanCurrent

            });

        }


        currentType =
            type;

        currentText =
            char;

    }


    // ==================================================
    // ПОСЛЕДНЯЯ ГРУППА
    // ==================================================

    const cleanCurrent =
        normalizeSpaces(
            currentText
        );


    if (
        cleanCurrent !== "" &&
        currentType !== null
    ) {

        groups.push({

            type:
                currentType,

            text:
                cleanCurrent

        });

    }


    return groups;

}


// ==================================================
// СОБИРАЕМ ВСЕ ГРУППЫ
// ОДНОГО АЛФАВИТА
// ==================================================

function collectAlphabetGroups(
    groups,
    type
) {

    return groups
        .filter(function (group) {

            return group.type === type;

        })
        .map(function (group) {

            return group.text;

        })
        .join(" ")
        .trim();

}


// ==================================================
// УПРОЩЁННОЕ ПРЕДСТАВЛЕНИЕ
// ИВРИТСКИХ СОГЛАСНЫХ
// ==================================================

function hebrewToConsonants(text) {

    const map = {

        "א": "",

        "ב": "в",

        "ג": "г",

        "ד": "д",

        "ה": "х",

        "ו": "в",

        "ז": "з",

        "ח": "х",

        "ט": "т",

        "י": "й",

        "כ": "х",

        "ך": "х",

        "ל": "л",

        "מ": "м",

        "ם": "м",

        "נ": "н",

        "ן": "н",

        "ס": "с",

        "ע": "",

        "פ": "п",

        "ף": "ф",

        "צ": "ц",

        "ץ": "ц",

        "ק": "к",

        "ר": "р",

        "ש": "ш",

        "ת": "т"

    };


    let result = "";


    for (const char of text) {

        if (
            Object.prototype
                .hasOwnProperty.call(
                    map,
                    char
                )
        ) {

            result +=
                map[char];

        }

    }


    return result;

}


// ==================================================
// УБИРАЕМ ГЛАСНЫЕ ИЗ
// РУССКОЙ ТРАНСКРИПЦИИ
// ==================================================

function russianToConsonants(text) {

    return normalizeRussian(text)
        .replace(
            /[аеёиоуыэюяйьъ]/g,
            ""
        );

}


// ==================================================
// УПРОЩАЕМ ПОХОЖИЕ ЗВУКИ
// ==================================================

function simplifySounds(text) {

    return String(text || "")
        .replace(/б/g, "в")
        .replace(/ф/g, "п")
        .replace(/к/g, "х")
        .replace(/ц/g, "с")
        .replace(/щ/g, "ш");

}


// ==================================================
// РАССТОЯНИЕ ЛЕВЕНШТЕЙНА
//
// Оптимизированная версия.
// Храним только две строки матрицы,
// а не всю матрицу целиком.
// ==================================================

function levenshtein(a, b) {

    a =
        String(a || "");

    b =
        String(b || "");


    if (a === b) {

        return 0;

    }


    if (a.length === 0) {

        return b.length;

    }


    if (b.length === 0) {

        return a.length;

    }


    // Меньшую строку используем
    // как горизонтальную

    if (a.length > b.length) {

        const temp = a;

        a = b;

        b = temp;

    }


    let previousRow =
        new Array(
            a.length + 1
        );


    let currentRow =
        new Array(
            a.length + 1
        );


    for (
        let j = 0;
        j <= a.length;
        j++
    ) {

        previousRow[j] =
            j;

    }


    for (
        let i = 1;
        i <= b.length;
        i++
    ) {

        currentRow[0] =
            i;


        for (
            let j = 1;
            j <= a.length;
            j++
        ) {

            const cost =
                b.charAt(i - 1) ===
                a.charAt(j - 1)
                    ? 0
                    : 1;


            currentRow[j] =
                Math.min(

                    previousRow[j] + 1,

                    currentRow[j - 1] + 1,

                    previousRow[j - 1] +
                        cost

                );

        }


        const temp =
            previousRow;

        previousRow =
            currentRow;

        currentRow =
            temp;

    }


    return previousRow[
        a.length
    ];

}


// ==================================================
// СХОДСТВО СТРОК
// ==================================================

function similarity(a, b) {

    if (!a || !b) {

        return 0;

    }


    const distance =
        levenshtein(
            a,
            b
        );


    const maxLength =
        Math.max(
            a.length,
            b.length
        );


    if (maxLength === 0) {

        return 0;

    }


    return Math.max(
        0,
        1 -
        distance /
        maxLength
    );

}


// ==================================================
// ДОПОЛНИТЕЛЬНАЯ ФОНЕТИЧЕСКАЯ
// НОРМАЛИЗАЦИЯ
// ==================================================

function normalizePhoneticRussian(text) {

    return normalizeRussian(text)

        .replace(/дж/g, "ж")

        .replace(/тс/g, "ц")

        .replace(/шч/g, "щ")

        .replace(/йа/g, "я")

        .replace(/йу/g, "ю")

        .replace(/йо/g, "е")

        .replace(/йе/g, "е");

}


// ==================================================
// ОЦЕНКА КИРИЛЛИЧЕСКОЙ ТРАНСКРИПЦИИ
// ==================================================

function transcriptionScore(
    hebrewText,
    candidateText
) {

    let hebrewConsonants =
        hebrewToConsonants(
            hebrewText
        );


    let russianConsonants =
        russianToConsonants(
            candidateText
        );


    hebrewConsonants =
        simplifySounds(
            hebrewConsonants
        );


    russianConsonants =
        simplifySounds(
            russianConsonants
        );


    const soundScore =
        similarity(
            hebrewConsonants,
            russianConsonants
        );


    // ==================================================
    // СРАВНИВАЕМ ДЛИНУ
    // ==================================================

    const hebrewLetters =
        normalizeHebrew(
            hebrewText
        ).length;


    const candidateLetters =
        normalizeRussian(
            candidateText
        ).length;


    let lengthScore = 0;


    if (
        hebrewLetters > 0 &&
        candidateLetters > 0
    ) {

        const ratio =
            Math.min(
                hebrewLetters,
                candidateLetters
            ) /
            Math.max(
                hebrewLetters,
                candidateLetters
            );


        lengthScore =
            ratio;

    }


    // ==================================================
    // ЕСЛИ ЕСТЬ ПРОБЕЛЫ —
    // УЧИТЫВАЕМ ЧИСЛО СЛОВ
    // ==================================================

    const hebrewWords =
        normalizeSpaces(
            hebrewText
        )
            .split(/\s+/)
            .filter(Boolean);


    const candidateWords =
        normalizeSpaces(
            candidateText
        )
            .split(/\s+/)
            .filter(Boolean);


    const wordDifference =
        Math.abs(
            hebrewWords.length -
            candidateWords.length
        );


    const wordCountScore =
        1 /
        (1 + wordDifference);


    return (
        soundScore * 0.70 +
        lengthScore * 0.20 +
        wordCountScore * 0.10
    );

}


// ==================================================
// ТОЧНЫЙ РАЗБОР ЧЕРЕЗ |
//
// Иврит | транскрипция | перевод
//
// Здесь пробелы внутри частей
// вообще не обязательны.
// ==================================================

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
        hebrew === "" ||
        transcription === "" ||
        russian === ""
    ) {

        return null;

    }


    if (!containsHebrew(hebrew)) {

        return null;

    }


    return {

        hebrew:
            hebrew,

        transcription:
            transcription,

        russian:
            russian,

        confidence:
            1,

        exact:
            true

    };

}


// ==================================================
// РАЗБОР ПРИ РАЗНЫХ АЛФАВИТАХ
//
// שלוםshalomпривет
//
// или:
//
// אנירוצהללמודעבריתanirotzelilmodivritяхочуучитьиврит
// ==================================================

function parseMixedAlphabetInput(text) {

    const groups =
        splitByAlphabet(
            text
        );


    if (groups.length < 3) {

        return null;

    }


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


    if (
        hebrew !== "" &&
        latin !== "" &&
        cyrillic !== ""
    ) {

        return {

            hebrew:
                hebrew,

            transcription:
                latin,

            russian:
                cyrillic,

            confidence:
                1,

            exact:
                false

        };

    }


    return null;

}


// ==================================================
// ПОЛУЧИТЬ ТОЛЬКО ИВРИТ
// ==================================================

function extractHebrew(text) {

    const groups =
        splitByAlphabet(
            text
        );


    return collectAlphabetGroups(
        groups,
        "hebrew"
    );

}


// ==================================================
// ПОЛУЧИТЬ ТОЛЬКО КИРИЛЛИЦУ
// ==================================================

function extractCyrillic(text) {

    const groups =
        splitByAlphabet(
            text
        );


    return collectAlphabetGroups(
        groups,
        "cyrillic"
    );

}


// ==================================================
// ПРОВЕРКА ГРАНИЦЫ:
//
// [транскрипция][перевод]
//
// Пример:
//
// шаломпривет
//
// проверяем:
//
// ш | аломпривет
// ша | ломпривет
// шал | омпривет
// шало | мпривет
// шалом | привет
// ...
// ==================================================

function scoreCyrillicBoundary(
    hebrew,
    cyrillicText,
    boundary
) {

    const transcription =
        cyrillicText
            .slice(
                0,
                boundary
            )
            .trim();


    const russian =
        cyrillicText
            .slice(
                boundary
            )
            .trim();


    if (
        transcription === "" ||
        russian === ""
    ) {

        return null;

    }


    const phoneticScore =
        transcriptionScore(
            hebrew,
            transcription
        );


    // ==================================================
    // ОЦЕНКА РАЗМЕРА ТРАНСКРИПЦИИ
    //
    // Транскрипция обычно имеет длину,
    // близкую к ивритскому оригиналу,
    // хотя точное совпадение не требуется.
    // ==================================================

    const hebrewLength =
        normalizeHebrew(
            hebrew
        ).length;


    const transcriptionLength =
        normalizeRussian(
            transcription
        ).length;


    let lengthScore = 0;


    if (
        hebrewLength > 0 &&
        transcriptionLength > 0
    ) {

        const ratio =
            transcriptionLength /
            hebrewLength;


        // Нормальная транскрипция
        // часто несколько длиннее иврита.

        if (
            ratio >= 0.7 &&
            ratio <= 2.4
        ) {

            lengthScore =
                1;

        } else {

            const distance =
                Math.min(
                    Math.abs(
                        ratio - 0.7
                    ),
                    Math.abs(
                        ratio - 2.4
                    )
                );


            lengthScore =
                Math.max(
                    0,
                    1 - distance
                );

        }

    }


    // ==================================================
    // ПЕРЕВОД ДОЛЖЕН ОСТАТЬСЯ
    // ==================================================

    const translationLength =
        normalizeRussian(
            russian
        ).length;


    let translationScore =
        translationLength > 0
            ? 1
            : 0;


    // Если после предполагаемой транскрипции
    // осталась буквально одна буква,
    // это подозрительно.

    if (translationLength === 1) {

        translationScore =
            0.2;

    }


    const finalScore =
        phoneticScore * 0.78 +
        lengthScore * 0.17 +
        translationScore * 0.05;


    return {

        hebrew:
            hebrew,

        transcription:
            transcription,

        russian:
            russian,

        confidence:
            finalScore,

        exact:
            false,

        boundary:
            boundary

    };

}


// ==================================================
// НАЙТИ ГРАНИЦУ МЕЖДУ
// КИРИЛЛИЧЕСКОЙ ТРАНСКРИПЦИЕЙ
// И РУССКИМ ПЕРЕВОДОМ
// ==================================================

function findBestCyrillicBoundary(
    hebrew,
    cyrillicText
) {

    const cleanText =
        normalizeSpaces(
            cyrillicText
        );


    if (
        cleanText.length < 2
    ) {

        return null;

    }


    let bestResult =
        null;


    let secondBestScore =
        -Infinity;


    // ==================================================
    // ЕСЛИ ЕСТЬ ПРОБЕЛЫ
    //
    // Сначала проверяем границы между словами.
    // ==================================================

    const wordsArray =
        cleanText
            .split(/\s+/)
            .filter(Boolean);


    if (wordsArray.length >= 2) {

        for (
            let boundaryWord = 1;
            boundaryWord < wordsArray.length;
            boundaryWord++
        ) {

            const transcription =
                wordsArray
                    .slice(
                        0,
                        boundaryWord
                    )
                    .join(" ");


            const russian =
                wordsArray
                    .slice(
                        boundaryWord
                    )
                    .join(" ");


            const score =
                transcriptionScore(
                    hebrew,
                    transcription
                );


            const result = {

                hebrew:
                    hebrew,

                transcription:
                    transcription,

                russian:
                    russian,

                confidence:
                    score,

                exact:
                    false

            };


            if (
                !bestResult ||
                result.confidence >
                bestResult.confidence
            ) {

                if (bestResult) {

                    secondBestScore =
                        Math.max(
                            secondBestScore,
                            bestResult.confidence
                        );

                }


                bestResult =
                    result;

            } else {

                secondBestScore =
                    Math.max(
                        secondBestScore,
                        result.confidence
                    );

            }

        }

    }


    // ==================================================
    // ТЕПЕРЬ ПРОВЕРЯЕМ ГРАНИЦЫ
    // МЕЖДУ СИМВОЛАМИ.
    //
    // Именно это позволяет понимать:
    //
    // שלוםшаломпривет
    // ==================================================

    const compact =
        cleanText.replace(
            /\s+/g,
            ""
        );


    if (compact.length >= 2) {

        let startBoundary =
            1;


        let endBoundary =
            compact.length - 1;


        // Для очень длинной строки
        // не обязательно проверять заведомо
        // невозможные края.

        if (
            compact.length >
            PARSER_SETTINGS
                .maxFullBoundarySearch
        ) {

            const hebrewLength =
                Math.max(
                    1,
                    normalizeHebrew(
                        hebrew
                    ).length
                );


            const estimated =
                Math.round(
                    hebrewLength * 1.4
                );


            startBoundary =
                Math.max(
                    1,
                    estimated -
                    PARSER_SETTINGS
                        .boundarySearchRadius
                );


            endBoundary =
                Math.min(
                    compact.length - 1,
                    estimated +
                    PARSER_SETTINGS
                        .boundarySearchRadius
                );

        }


        for (
            let boundary =
                startBoundary;

            boundary <=
                endBoundary;

            boundary++
        ) {

            const result =
                scoreCyrillicBoundary(
                    hebrew,
                    compact,
                    boundary
                );


            if (!result) {

                continue;

            }


            if (
                !bestResult ||
                result.confidence >
                bestResult.confidence
            ) {

                if (bestResult) {

                    secondBestScore =
                        Math.max(
                            secondBestScore,
                            bestResult.confidence
                        );

                }


                bestResult =
                    result;

            } else {

                secondBestScore =
                    Math.max(
                        secondBestScore,
                        result.confidence
                    );

            }

        }

    }


    if (!bestResult) {

        return null;

    }


    // ==================================================
    // ЕСЛИ ДВА ВАРИАНТА ПОЧТИ ОДИНАКОВЫ,
    // СНИЖАЕМ УВЕРЕННОСТЬ.
    //
    // Это защищает словарь от случайного
    // неправильного разделения.
    // ==================================================

    if (
        secondBestScore !== -Infinity
    ) {

        const difference =
            bestResult.confidence -
            secondBestScore;


        if (difference < 0.015) {

            bestResult.confidence *=
                0.72;

        } else if (
            difference < 0.04
        ) {

            bestResult.confidence *=
                0.85;

        }

    }


    return bestResult;

}


// ==================================================
// РАЗБОР:
//
// ИВРИТ + КИРИЛЛИЦА
//
// Например:
//
// שלוםשаломпривет
//
// или:
//
// שלום шалом привет
// ==================================================

function parseHebrewCyrillicInput(text) {

    if (
        !containsHebrew(text) ||
        !containsCyrillic(text)
    ) {

        return null;

    }


    const hebrew =
        extractHebrew(
            text
        );


    const cyrillic =
        extractCyrillic(
            text
        );


    if (
        hebrew === "" ||
        cyrillic === ""
    ) {

        return null;

    }


    return findBestCyrillicBoundary(
        hebrew,
        cyrillic
    );

}


// ==================================================
// СТАРЫЙ РАЗБОР ПО СЛОВАМ
//
// Оставляем его как дополнительный
// вариант для совместимости.
// ==================================================

function parseTraditionalInput(text) {

    const parts =
        text
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length < 3) {

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

            } else if (
                containsLatin(part)
            ) {

                latinParts.push(
                    part
                );

            } else if (
                containsCyrillic(part)
            ) {

                cyrillicParts.push(
                    part
                );

            }

        }
    );


    if (
        hebrewParts.length === 0
    ) {

        return null;

    }


    const hebrew =
        hebrewParts.join(" ");


    // ==================================================
    // ЛАТИНСКАЯ ТРАНСКРИПЦИЯ
    // ==================================================

    if (
        latinParts.length > 0 &&
        cyrillicParts.length > 0
    ) {

        return {

            hebrew:
                hebrew,

            transcription:
                latinParts.join(" "),

            russian:
                cyrillicParts.join(" "),

            confidence:
                1,

            exact:
                false

        };

    }


    // ==================================================
    // КИРИЛЛИЦА
    // ==================================================

    if (
        cyrillicParts.length >= 2
    ) {

        return findBestCyrillicBoundary(
            hebrew,
            cyrillicParts.join(" ")
        );

    }


    return null;

}


// ==================================================
// ПРОВЕРКА РЕЗУЛЬТАТА
// ==================================================

function validateParsedResult(
    result
) {

    if (!result) {

        return null;

    }


    if (
        !result.hebrew ||
        !result.transcription ||
        !result.russian
    ) {

        return null;

    }


    result.hebrew =
        result.hebrew.trim();


    result.transcription =
        result.transcription.trim();


    result.russian =
        result.russian.trim();


    if (
        result.hebrew === "" ||
        result.transcription === "" ||
        result.russian === ""
    ) {

        return null;

    }


    if (
        !containsHebrew(
            result.hebrew
        )
    ) {

        return null;

    }


    return result;

}


// ==================================================
// ГЛАВНАЯ ФУНКЦИЯ РАСПОЗНАВАНИЯ
// ==================================================

function parseQuickInput(text) {

    const cleanText =
        normalizeSpaces(
            text
        );


    if (cleanText === "") {

        return null;

    }


    // ==================================================
    // 1. ТОЧНЫЙ ФОРМАТ
    //
    // שלום | shalom | привет
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
    // 2. ИВРИТ + ЛАТИНИЦА + КИРИЛЛИЦА
    //
    // Это самый надёжный автоматический вариант.
    //
    // שלוםshalomпривет
    // ==================================================

    if (
        containsHebrew(cleanText) &&
        containsLatin(cleanText) &&
        containsCyrillic(cleanText)
    ) {

        const mixedResult =
            parseMixedAlphabetInput(
                cleanText
            );


        if (mixedResult) {

            return validateParsedResult(
                mixedResult
            );

        }

    }


    // ==================================================
    // 3. ИВРИТ + КИРИЛЛИЦА
    //
    // שלוםшаломпривет
    //
    // Здесь уже используется
    // фонетическое определение границы.
    // ==================================================

    if (
        containsHebrew(cleanText) &&
        containsCyrillic(cleanText) &&
        !containsLatin(cleanText)
    ) {

        const cyrillicResult =
            parseHebrewCyrillicInput(
                cleanText
            );


        if (cyrillicResult) {

            return validateParsedResult(
                cyrillicResult
            );

        }

    }


    // ==================================================
    // 4. СТАРЫЙ СПОСОБ
    // ==================================================

    return validateParsedResult(
        parseTraditionalInput(
            cleanText
        )
    );

}