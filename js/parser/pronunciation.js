// ======================================================
// pronunciation.js
//
// ДВИЖОК ПОЛУЧЕНИЯ ТРАНСКРИПЦИИ ИВРИТА
//
// ПРИОРИТЕТ:
// 1. Точная фраза из LANGUAGE_REFERENCE
// 2. Точное слово из LANGUAGE_REFERENCE
// 3. HEBREW_TRANSCRIPTIONS
// 4. Подтверждённая/изученная транскрипция
// 5. Генерация по ניקוד
// 6. Осторожная генерация без ניקוד
//
// ВАЖНО:
// Транскрипция из словаря всегда важнее генератора.
// ======================================================


// ======================================================
// НАСТРОЙКИ
// ======================================================

const PRONUNCIATION_SETTINGS = {

    // Минимальная уверенность,
    // при которой автоматически рассчитанная
    // транскрипция может быть предложена.

    minimumGeneratedConfidence: 0.45,

    // Уверенность для полностью огласованного слова.

    niqqudConfidence: 0.90,

    // Уверенность для неогласованного слова.

    unpointedConfidence: 0.52

};


// ======================================================
// ПРОВЕРКА НА НИКУД
// ======================================================

function hasHebrewNiqqud(text) {

    return /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/.test(
        String(text || "")
    );

}


// ======================================================
// НОРМАЛИЗАЦИЯ КЛЮЧА
// ======================================================

function normalizePronunciationHebrew(text) {

    return String(text || "")
        .trim()
        .replace(/\s+/g, " ")
        .normalize("NFD")
        .replace(/[\u0591-\u05AF]/g, "")
        .normalize("NFC");

}


// ======================================================
// УБРАТЬ НИКУД
// ======================================================

function stripPronunciationNiqqud(text) {

    return String(text || "")
        .normalize("NFD")
        .replace(/[\u0591-\u05C7]/g, "")
        .normalize("NFC");

}


// ======================================================
// НОРМАЛИЗАЦИЯ ВАРИАНТОВ ТРАНСКРИПЦИИ
// ======================================================

function normalizeTranscriptionVariants(value) {

    if (!value) {

        return [];

    }


    if (Array.isArray(value)) {

        return value
            .map(function (item) {

                return String(item || "").trim();

            })
            .filter(Boolean);

    }


    if (typeof value === "string") {

        return [value.trim()]
            .filter(Boolean);

    }


    return [];

}


// ======================================================
// ВЫБРАТЬ РУССКУЮ ТРАНСКРИПЦИЮ
// ======================================================

function chooseRussianTranscription(variants) {

    const list =
        normalizeTranscriptionVariants(
            variants
        );


    if (!list.length) {

        return "";

    }


    const cyrillic =
        list.find(
            function (variant) {

                return /[а-яё]/i.test(
                    variant
                );

            }
        );


    return (
        cyrillic ||
        list[0] ||
        ""
    );

}


// ======================================================
// ПОИСК ЦЕЛОЙ ФРАЗЫ В ОСНОВНОЙ БАЗЕ
// ======================================================

function findPhrasePronunciationInReference(
    hebrew
) {

    const clean =
        stripPronunciationNiqqud(
            normalizePronunciationHebrew(
                hebrew
            )
        );


    if (
        typeof LANGUAGE_REFERENCE ===
            "undefined" ||
        !LANGUAGE_REFERENCE.phrases
    ) {

        return null;

    }


    const entry =
        LANGUAGE_REFERENCE
            .phrases[clean];


    if (
        !entry ||
        !entry.transcription
    ) {

        return null;

    }


    return {

        transcription:
            String(
                entry.transcription
            ).trim(),

        source:
            "dictionary-phrase",

        confidence:
            1,

        generated:
            false

    };

}


// ======================================================
// ПОИСК СЛОВА В LANGUAGE_REFERENCE
// ======================================================

function findWordPronunciationInReference(
    hebrew
) {

    const clean =
        stripPronunciationNiqqud(
            normalizePronunciationHebrew(
                hebrew
            )
        );


    if (
        typeof LANGUAGE_REFERENCE ===
            "undefined" ||
        !LANGUAGE_REFERENCE.words
    ) {

        return null;

    }


    const entry =
        LANGUAGE_REFERENCE
            .words[clean];


    if (
        !entry ||
        !entry.transcription
    ) {

        return null;

    }


    return {

        transcription:
            String(
                entry.transcription
            ).trim(),

        source:
            "dictionary-word",

        confidence:
            1,

        generated:
            false

    };

}


// ======================================================
// ПОИСК В HEBREW_TRANSCRIPTIONS
// ======================================================

function findPronunciationInOldDatabase(
    hebrew
) {

    const clean =
        stripPronunciationNiqqud(
            normalizePronunciationHebrew(
                hebrew
            )
        );


    // Сначала используем уже существующую
    // функцию проекта.

    if (
        typeof getKnownTranscriptions ===
        "function"
    ) {

        const variants =
            getKnownTranscriptions(
                clean
            );


        const transcription =
            chooseRussianTranscription(
                variants
            );


        if (transcription) {

            return {

                transcription:
                    transcription,

                source:
                    "transcription-database",

                confidence:
                    1,

                generated:
                    false

            };

        }

    }


    // Резервный прямой доступ.

    if (
        typeof HEBREW_TRANSCRIPTIONS ===
            "undefined"
    ) {

        return null;

    }


    const variants =
        HEBREW_TRANSCRIPTIONS[
            clean
        ];


    const transcription =
        chooseRussianTranscription(
            variants
        );


    if (!transcription) {

        return null;

    }


    return {

        transcription:
            transcription,

        source:
            "transcription-database",

        confidence:
            1,

        generated:
            false

    };

}


// ======================================================
// ПОИСК ОБУЧЕННОЙ ТРАНСКРИПЦИИ
// ======================================================

function findLearnedPronunciation(
    hebrew
) {

    const clean =
        stripPronunciationNiqqud(
            normalizePronunciationHebrew(
                hebrew
            )
        );


    // learning.js может иметь разные версии.
    // Поэтому сначала проверяем наличие функции.

    if (
        typeof getLearnedTranscriptions ===
        "function"
    ) {

        const variants =
            getLearnedTranscriptions(
                clean
            );


        const transcription =
            chooseRussianTranscription(
                variants
            );


        if (transcription) {

            return {

                transcription:
                    transcription,

                source:
                    "learned",

                confidence:
                    0.98,

                generated:
                    false

            };

        }

    }


    return null;

}


// ======================================================
// ДАННЫЕ НИКУДА
// ======================================================

const HEBREW_VOWEL_MAP = {

    "\u05B0": "э",   // шва
    "\u05B1": "э",   // хатаф-сеголь
    "\u05B2": "а",   // хатаф-патах
    "\u05B3": "о",   // хатаф-камац
    "\u05B4": "и",   // хирик
    "\u05B5": "э",   // цере
    "\u05B6": "э",   // сеголь
    "\u05B7": "а",   // патах
    "\u05B8": "а",   // камац
    "\u05B9": "о",   // холам
    "\u05BA": "о",
    "\u05BB": "у",   // кубуц
    "\u05C7": "о"    // камац катан
};


// ======================================================
// БАЗОВЫЕ СОГЛАСНЫЕ
// ======================================================

const HEBREW_CONSONANT_MAP = {

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
    "פ": "ф",
    "ף": "ф",
    "צ": "ц",
    "ץ": "ц",
    "ק": "к",
    "ר": "р",
    "ש": "ш",
    "ת": "т"

};


// ======================================================
// ПРОВЕРКА ДАГЕША
// ======================================================

function letterHasDagesh(cluster) {

    return String(cluster || "")
        .includes("\u05BC");

}


// ======================================================
// ШИН / СИН
// ======================================================

function getShinSound(cluster) {

    if (
        String(cluster || "")
            .includes("\u05C2")
    ) {

        return "с";

    }


    return "ш";

}


// ======================================================
// СОГЛАСНАЯ С УЧЁТОМ ДАГЕША
// ======================================================

function getHebrewConsonantSound(
    letter,
    cluster
) {

    if (letter === "ב") {

        return letterHasDagesh(cluster)
            ? "б"
            : "в";

    }


    if (
        letter === "כ" ||
        letter === "ך"
    ) {

        return letterHasDagesh(cluster)
            ? "к"
            : "х";

    }


    if (
        letter === "פ" ||
        letter === "ף"
    ) {

        return letterHasDagesh(cluster)
            ? "п"
            : "ф";

    }


    if (letter === "ש") {

        return getShinSound(
            cluster
        );

    }


    return (
        HEBREW_CONSONANT_MAP[
            letter
        ] || ""
    );

}


// ======================================================
// РАЗБИТЬ ОГЛАСОВАННОЕ СЛОВО
// НА БУКВЕННЫЕ КЛАСТЕРЫ
// ======================================================

function splitHebrewIntoClusters(word) {

    const chars =
        Array.from(
            String(word || "")
                .normalize("NFD")
        );


    const clusters = [];

    let current = "";


    chars.forEach(
        function (char) {

            if (
                /[\u05D0-\u05EA]/.test(
                    char
                )
            ) {

                if (current) {

                    clusters.push(
                        current
                    );

                }


                current = char;

            } else if (current) {

                current += char;

            }

        }
    );


    if (current) {

        clusters.push(
            current
        );

    }


    return clusters;

}


// ======================================================
// ГЛАСНАЯ КЛАСТЕРА
// ======================================================

function getClusterVowel(cluster) {

    const chars =
        Array.from(
            String(cluster || "")
        );


    for (
        let i = 0;
        i < chars.length;
        i++
    ) {

        if (
            HEBREW_VOWEL_MAP[
                chars[i]
            ] !== undefined
        ) {

            return HEBREW_VOWEL_MAP[
                chars[i]
            ];

        }

    }


    return "";

}


// ======================================================
// ГЕНЕРАЦИЯ ПО НИКУДУ
// ======================================================

function generatePointedPronunciation(
    word
) {

    const clusters =
        splitHebrewIntoClusters(
            word
        );


    if (!clusters.length) {

        return null;

    }


    let output = "";


    for (
        let i = 0;
        i < clusters.length;
        i++
    ) {

        const cluster =
            clusters[i];


        const letter =
            cluster[0];


        let consonant =
            getHebrewConsonantSound(
                letter,
                cluster
            );


        let vowel =
            getClusterVowel(
                cluster
            );


        const nextCluster =
            clusters[i + 1] || "";


        const nextLetter =
            nextCluster
                ? nextCluster[0]
                : "";


        // ----------------------------------------------
        // וֹ = о
        // ----------------------------------------------

        if (
            letter === "ו" &&
            cluster.includes(
                "\u05B9"
            )
        ) {

            output += "о";

            continue;

        }


        // ----------------------------------------------
        // וּ = у
        // ----------------------------------------------

        if (
            letter === "ו" &&
            cluster.includes(
                "\u05BC"
            ) &&
            !vowel
        ) {

            output += "у";

            continue;

        }


        // ----------------------------------------------
        // Ивритская ה в конце слова
        // часто является немой.
        // ----------------------------------------------

        if (
            letter === "ה" &&
            i ===
                clusters.length - 1 &&
            !vowel
        ) {

            consonant = "";

        }


        // ----------------------------------------------
        // י после хирика часто формирует "и"
        // и не требует отдельного "й".
        // ----------------------------------------------

        if (
            letter === "י" &&
            i > 0
        ) {

            const previous =
                clusters[i - 1];


            if (
                previous.includes(
                    "\u05B4"
                ) &&
                !vowel
            ) {

                consonant = "";

            }

        }


        output +=
            consonant +
            vowel;


        // ----------------------------------------------
        // Патах гнува:
        // например רוח.
        //
        // Полная реализация будет позже
        // вместе с морфологической базой.
        // ----------------------------------------------

        if (
            i ===
                clusters.length - 1 &&
            (
                letter === "ח" ||
                letter === "ע"
            ) &&
            cluster.includes(
                "\u05B7"
            )
        ) {

            // Не меняем автоматически,
            // чтобы не получить ложное чтение.

        }


        void nextLetter;

    }


    output =
        normalizeGeneratedTranscription(
            output
        );


    if (!output) {

        return null;

    }


    return {

        transcription:
            output,

        source:
            "rules-niqqud",

        confidence:
            PRONUNCIATION_SETTINGS
                .niqqudConfidence,

        generated:
            true

    };

}


// ======================================================
// НОРМАЛИЗАЦИЯ РЕЗУЛЬТАТА
// ======================================================

function normalizeGeneratedTranscription(
    text
) {

    return String(text || "")
        .replace(/ээ+/g, "э")
        .replace(/аа+/g, "а")
        .replace(/оо+/g, "о")
        .replace(/ии+/g, "и")
        .replace(/уу+/g, "у")
        .replace(/\s+/g, " ")
        .trim();

}


// ======================================================
// ГЕНЕРАЦИЯ БЕЗ НИКУДА
//
// Это НЕ словарно подтверждённое произношение.
// Без ניקוד чтение не всегда однозначно.
//
// Поэтому этот слой имеет меньший confidence.
// ======================================================

function generateUnpointedPronunciation(
    word
) {

    const clean =
        stripPronunciationNiqqud(
            word
        );


    if (!clean) {

        return null;

    }


    let output = "";


    const letters =
        Array.from(clean);


    for (
        let i = 0;
        i < letters.length;
        i++
    ) {

        const letter =
            letters[i];


        const previous =
            letters[i - 1] || "";


        const next =
            letters[i + 1] || "";


        // ----------------------------------------------
        // Матрес лекционис.
        //
        // Это только эвристика.
        // ----------------------------------------------

        if (letter === "ו") {

            if (
                previous &&
                next
            ) {

                output += "о";

            } else {

                output += "в";

            }


            continue;

        }


        if (letter === "י") {

            if (
                previous &&
                next
            ) {

                output += "и";

            } else {

                output += "й";

            }


            continue;

        }


        if (
            letter === "א" ||
            letter === "ע"
        ) {

            // Без ניקוד гласную достоверно
            // восстановить невозможно.

            continue;

        }


        if (
            letter === "ה" &&
            i === letters.length - 1
        ) {

            continue;

        }


        output +=
            HEBREW_CONSONANT_MAP[
                letter
            ] || "";

    }


    output =
        normalizeGeneratedTranscription(
            output
        );


    if (!output) {

        return null;

    }


    return {

        transcription:
            output,

        source:
            "rules-unpointed",

        confidence:
            PRONUNCIATION_SETTINGS
                .unpointedConfidence,

        generated:
            true

    };

}


// ======================================================
// ПОЛУЧИТЬ ТРАНСКРИПЦИЮ ОДНОГО СЛОВА
// ======================================================

function getWordPronunciation(
    hebrew
) {

    const original =
        normalizePronunciationHebrew(
            hebrew
        );


    if (!original) {

        return null;

    }


    // ==================================================
    // 1. ОСНОВНАЯ СЛОВАРНАЯ БАЗА
    // ==================================================

    const reference =
        findWordPronunciationInReference(
            original
        );


    if (reference) {

        return reference;

    }


    // ==================================================
    // 2. СТАРАЯ БАЗА ТРАНСКРИПЦИЙ
    // ==================================================

    const database =
        findPronunciationInOldDatabase(
            original
        );


    if (database) {

        return database;

    }


    // ==================================================
    // 3. ОБУЧЕННЫЕ ВАРИАНТЫ
    // ==================================================

    const learned =
        findLearnedPronunciation(
            original
        );


    if (learned) {

        return learned;

    }


    // ==================================================
    // 4. НИКУД
    // ==================================================

    if (
        hasHebrewNiqqud(
            original
        )
    ) {

        const pointed =
            generatePointedPronunciation(
                original
            );


        if (pointed) {

            return pointed;

        }

    }


    // ==================================================
    // 5. БЕЗ НИКУДА
    // ==================================================

    return generateUnpointedPronunciation(
        original
    );

}


// ======================================================
// ТРАНСКРИПЦИЯ ЦЕЛОЙ ФРАЗЫ
// ======================================================

function getHebrewPronunciation(
    hebrew
) {

    const original =
        normalizePronunciationHebrew(
            hebrew
        );


    if (!original) {

        return {

            transcription: "",

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


    // ==================================================
    // 1. СНАЧАЛА ИЩЕМ ЦЕЛУЮ ФРАЗУ
    // ==================================================

    const phrase =
        findPhrasePronunciationInReference(
            original
        );


    if (phrase) {

        return {

            transcription:
                phrase.transcription,

            source:
                phrase.source,

            confidence:
                phrase.confidence,

            generated:
                false,

            words:
                []

        };

    }


    // ==================================================
    // 2. СОБИРАЕМ ПО СЛОВАМ
    // ==================================================

    const words =
        original
            .split(/\s+/)
            .filter(Boolean);


    const transcriptions = [];

    const details = [];


    let totalConfidence = 0;

    let generatedCount = 0;


    for (
        let i = 0;
        i < words.length;
        i++
    ) {

        const word =
            words[i];


        const result =
            getWordPronunciation(
                word
            );


        if (
            !result ||
            !result.transcription
        ) {

            details.push({

                hebrew:
                    word,

                transcription:
                    "",

                source:
                    "none",

                confidence:
                    0,

                generated:
                    false

            });


            continue;

        }


        transcriptions.push(
            result.transcription
        );


        totalConfidence +=
            result.confidence;


        if (
            result.generated
        ) {

            generatedCount++;

        }


        details.push({

            hebrew:
                word,

            transcription:
                result.transcription,

            source:
                result.source,

            confidence:
                result.confidence,

            generated:
                result.generated

        });

    }


    if (
        transcriptions.length !==
        words.length
    ) {

        return {

            transcription:
                "",

            source:
                "partial",

            confidence:
                0,

            generated:
                generatedCount > 0,

            words:
                details

        };

    }


    const confidence =
        words.length
            ?
            totalConfidence /
            words.length
            :
            0;


    let source =
        "dictionary-words";


    if (
        generatedCount > 0 &&
        generatedCount <
            words.length
    ) {

        source =
            "mixed";

    }


    if (
        generatedCount ===
            words.length
    ) {

        source =
            "rules";

    }


    return {

        transcription:
            transcriptions.join(" "),

        source:
            source,

        confidence:
            confidence,

        generated:
            generatedCount > 0,

        words:
            details

    };

}