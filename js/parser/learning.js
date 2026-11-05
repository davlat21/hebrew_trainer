// ======================================================
// learning.js
// Локальное обучение парсера.
// ======================================================

const PARSER_LEARNING_KEY =
    "hebrewParserLearning";


let parserLearningData =
    loadParserLearningData();


// ======================================================
// Загрузка.
// ======================================================

function loadParserLearningData() {
    try {
        const raw =
            localStorage.getItem(
                PARSER_LEARNING_KEY
            );

        if (!raw) {
            return {};
        }

        const parsed =
            JSON.parse(raw);

        if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
        ) {
            return {};
        }

        return parsed;

    } catch (error) {
        console.error(
            "Ошибка загрузки обучения парсера:",
            error
        );

        return {};
    }
}


// ======================================================
// Сохранение.
// ======================================================

function saveParserLearningData() {
    try {
        localStorage.setItem(
            PARSER_LEARNING_KEY,
            JSON.stringify(
                parserLearningData
            )
        );
    } catch (error) {
        console.error(
            "Ошибка сохранения обучения парсера:",
            error
        );
    }
}


// ======================================================
// Получение вариантов.
// ======================================================

function getLearnedTranscriptions(
    hebrew
) {
    const key =
        normalizeHebrew(
            hebrew
        );

    if (!key) {
        return [];
    }

    const entry =
        parserLearningData[key];

    if (!entry) {
        return [];
    }

    if (Array.isArray(entry)) {
        return entry;
    }

    if (
        Array.isArray(
            entry.transcriptions
        )
    ) {
        return entry.transcriptions;
    }

    return [];
}


// ======================================================
// Научить парсер.
// ======================================================

function learnTranscription(
    hebrew,
    transcription
) {
    const key =
        normalizeHebrew(
            hebrew
        );

    const value =
        String(
            transcription || ""
        ).trim();

    if (
        !key ||
        !value
    ) {
        return;
    }

    if (!parserLearningData[key]) {
        parserLearningData[key] = {
            transcriptions: [],
            confirmations: 0
        };
    }

    // Совместимость, если в localStorage
    // когда-нибудь лежал старый массив.
    if (
        Array.isArray(
            parserLearningData[key]
        )
    ) {
        parserLearningData[key] = {
            transcriptions:
                parserLearningData[key],

            confirmations: 0
        };
    }

    const list =
        parserLearningData[key]
            .transcriptions;

    const exists =
        list.some(function (item) {
            return (
                item.toLowerCase() ===
                value.toLowerCase()
            );
        });

    if (!exists) {
        list.push(value);
    }

    parserLearningData[key]
        .confirmations++;

    saveParserLearningData();

    if (
        typeof addRuntimeTranscription ===
        "function"
    ) {
        addRuntimeTranscription(
            key,
            value
        );
    }
}


// ======================================================
// Удалить выученное соответствие.
// ======================================================

function forgetLearnedTranscription(
    hebrew,
    transcription
) {
    const key =
        normalizeHebrew(
            hebrew
        );

    if (!parserLearningData[key]) {
        return;
    }

    const entry =
        parserLearningData[key];

    const list =
        Array.isArray(entry)
            ? entry
            : entry.transcriptions;

    if (!Array.isArray(list)) {
        return;
    }

    const target =
        String(
            transcription || ""
        ).toLowerCase();

    const filtered =
        list.filter(function (item) {
            return (
                item.toLowerCase() !==
                target
            );
        });

    if (!filtered.length) {
        delete parserLearningData[key];
    } else {
        parserLearningData[key] = {
            transcriptions:
                filtered,

            confirmations:
                entry.confirmations || 0
        };
    }

    saveParserLearningData();
}


// ======================================================
// Очистить только обучение.
// Сам словарь пользователя не затрагивается.
// ======================================================

function clearParserLearning() {
    parserLearningData = {};

    localStorage.removeItem(
        PARSER_LEARNING_KEY
    );
}