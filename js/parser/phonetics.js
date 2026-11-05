// ======================================================
// phonetics.js
// Фонетическое сравнение иврита и транскрипции.
// ======================================================

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

    for (const char of String(text || "")) {
        if (
            Object.prototype.hasOwnProperty.call(
                map,
                char
            )
        ) {
            result += map[char];
        }
    }

    return result;
}


function russianToConsonants(text) {
    return normalizeRussian(text)
        .replace(/[аеёиоуыэюяйьъ]/g, "");
}


function simplifySounds(text) {
    return String(text || "")
        .replace(/б/g, "в")
        .replace(/ф/g, "п")
        .replace(/к/g, "х")
        .replace(/ц/g, "с")
        .replace(/щ/g, "ш");
}


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


// ======================================================
// Levenshtein.
// ======================================================

function levenshtein(a, b) {
    a = String(a || "");
    b = String(b || "");

    if (a === b) {
        return 0;
    }

    if (!a.length) {
        return b.length;
    }

    if (!b.length) {
        return a.length;
    }

    if (a.length > b.length) {
        const temp = a;
        a = b;
        b = temp;
    }

    let previous = new Array(a.length + 1);
    let current = new Array(a.length + 1);

    for (let j = 0; j <= a.length; j++) {
        previous[j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        current[0] = i;

        for (let j = 1; j <= a.length; j++) {
            const cost =
                b.charAt(i - 1) === a.charAt(j - 1)
                    ? 0
                    : 1;

            current[j] = Math.min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + cost
            );
        }

        const temp = previous;
        previous = current;
        current = temp;
    }

    return previous[a.length];
}


function similarity(a, b) {
    if (!a || !b) {
        return 0;
    }

    const maxLength = Math.max(
        a.length,
        b.length
    );

    if (!maxLength) {
        return 0;
    }

    return Math.max(
        0,
        1 - levenshtein(a, b) / maxLength
    );
}


// ======================================================
// Сравнение с известной транскрипцией.
// ======================================================

function knownTranscriptionScore(
    hebrew,
    candidate
) {
    const known = getKnownTranscriptions(hebrew);

    if (!known.length) {
        return 0;
    }

    const candidateRussian =
        normalizePhoneticRussian(candidate);

    const candidateLatin =
        normalizeLatin(candidate);

    let best = 0;

    known.forEach(function (variant) {
        let score = 0;

        if (containsCyrillic(variant)) {
            score = similarity(
                candidateRussian,
                normalizePhoneticRussian(variant)
            );
        } else {
            score = similarity(
                candidateLatin,
                normalizeLatin(variant)
            );
        }

        if (score > best) {
            best = score;
        }
    });

    return best;
}


// ======================================================
// Сравнение с обученными пользователем вариантами.
// ======================================================

function learnedTranscriptionScore(
    hebrew,
    candidate
) {
    if (
        typeof getLearnedTranscriptions !== "function"
    ) {
        return 0;
    }

    const learned =
        getLearnedTranscriptions(hebrew);

    if (!learned.length) {
        return 0;
    }

    let best = 0;

    learned.forEach(function (variant) {
        let score;

        if (containsCyrillic(candidate)) {
            score = similarity(
                normalizePhoneticRussian(candidate),
                normalizePhoneticRussian(variant)
            );
        } else {
            score = similarity(
                normalizeLatin(candidate),
                normalizeLatin(variant)
            );
        }

        best = Math.max(best, score);
    });

    return best;
}


// ======================================================
// Общая оценка транскрипции.
// ======================================================

function transcriptionScore(
    hebrewText,
    candidateText
) {
    if (!hebrewText || !candidateText) {
        return 0;
    }

    let hebrewConsonants =
        simplifySounds(
            hebrewToConsonants(hebrewText)
        );

    let russianConsonants =
        simplifySounds(
            russianToConsonants(candidateText)
        );

    let basicSoundScore = 0;

    if (
        hebrewConsonants &&
        russianConsonants
    ) {
        basicSoundScore = similarity(
            hebrewConsonants,
            russianConsonants
        );
    }

    const knownScore =
        knownTranscriptionScore(
            normalizeHebrew(hebrewText),
            candidateText
        );

    const learnedScore =
        learnedTranscriptionScore(
            normalizeHebrew(hebrewText),
            candidateText
        );

    const hebrewLength =
        normalizeHebrew(hebrewText).length;

    const candidateLength =
        containsLatin(candidateText)
            ? normalizeLatin(candidateText).length
            : normalizeRussian(candidateText).length;

    let lengthScore = 0;

    if (
        hebrewLength > 0 &&
        candidateLength > 0
    ) {
        const ratio =
            Math.min(
                hebrewLength,
                candidateLength
            ) /
            Math.max(
                hebrewLength,
                candidateLength
            );

        lengthScore = ratio;
    }

    // Известный или выученный вариант получает
    // значительно больший вес.
    const dictionaryScore =
        Math.max(
            knownScore,
            learnedScore
        );

    if (dictionaryScore >= 0.85) {
        return Math.min(
            1,
            dictionaryScore * 0.65 +
            basicSoundScore * 0.20 +
            lengthScore * 0.15
        );
    }

    return Math.min(
        1,
        basicSoundScore * 0.72 +
        lengthScore * 0.18 +
        dictionaryScore * 0.10
    );
}