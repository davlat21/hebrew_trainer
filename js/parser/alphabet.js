// ======================================================
// alphabet.js
// Работа с алфавитами и нормализацией.
// ======================================================

function isHebrewChar(char) {
    return /[\u0590-\u05FF]/.test(char);
}

function isCyrillicChar(char) {
    return /[А-Яа-яЁё]/.test(char);
}

function isLatinChar(char) {
    return /[A-Za-z]/.test(char);
}

function containsHebrew(text) {
    return /[\u0590-\u05FF]/.test(String(text || ""));
}

function containsCyrillic(text) {
    return /[А-Яа-яЁё]/.test(String(text || ""));
}

function containsLatin(text) {
    return /[A-Za-z]/.test(String(text || ""));
}

function normalizeSpaces(text) {
    return String(text || "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeRussian(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^а-я]/g, "");
}

function normalizeLatin(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
}

function normalizeHebrew(text) {
    return String(text || "")
        .replace(/[^\u0590-\u05FF]/g, "");
}

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


// ======================================================
// Разделение при смене алфавита.
// שלוםshalomпривет
// ->
// שלום / shalom / привет
// ======================================================

function splitByAlphabet(text) {
    const groups = [];

    let currentText = "";
    let currentType = null;

    function pushCurrent() {
        const clean = normalizeSpaces(currentText);

        if (clean && currentType) {
            groups.push({
                type: currentType,
                text: clean
            });
        }

        currentText = "";
    }

    for (const char of String(text || "")) {
        const type = getCharacterType(char);

        if (type === "space") {
            if (currentText && !currentText.endsWith(" ")) {
                currentText += " ";
            }

            continue;
        }

        if (type === "other") {
            if (currentText) {
                currentText += char;
            }

            continue;
        }

        if (currentType === null) {
            currentType = type;
            currentText = char;
            continue;
        }

        if (type === currentType) {
            currentText += char;
            continue;
        }

        pushCurrent();

        currentType = type;
        currentText = char;
    }

    pushCurrent();

    return groups;
}


function collectAlphabetGroups(groups, type) {
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


function extractHebrew(text) {
    return collectAlphabetGroups(
        splitByAlphabet(text),
        "hebrew"
    );
}


function extractCyrillic(text) {
    return collectAlphabetGroups(
        splitByAlphabet(text),
        "cyrillic"
    );
}


function extractLatin(text) {
    return collectAlphabetGroups(
        splitByAlphabet(text),
        "latin"
    );
}