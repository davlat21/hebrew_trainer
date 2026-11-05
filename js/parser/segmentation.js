// ======================================================
// segmentation.js
// Сегментация текста без пробелов.
// ======================================================

const SEGMENTATION_SETTINGS = {
    maxRussianWordLength: 20,
    maxCandidates: 250,
    unknownCharacterPenalty: 3.0
};


// ======================================================
// Сегментация русского текста.
// Dynamic Programming.
// ======================================================

function segmentRussianText(text) {
    const source =
        normalizeRussian(text);

    if (!source) {
        return {
            words: [],
            text: "",
            score: 0,
            coverage: 0
        };
    }

    const length = source.length;

    const dp =
        new Array(length + 1)
            .fill(null);

    dp[0] = {
        score: 0,
        words: [],
        knownCharacters: 0
    };

    for (let i = 0; i < length; i++) {
        if (!dp[i]) {
            continue;
        }

        let foundKnownWord = false;

        const maxEnd = Math.min(
            length,
            i + SEGMENTATION_SETTINGS.maxRussianWordLength
        );

        for (
            let end = i + 1;
            end <= maxEnd;
            end++
        ) {
            const word =
                source.slice(i, end);

            const frequency =
                getRussianWordFrequency(word);

            if (!frequency) {
                continue;
            }

            foundKnownWord = true;

            const wordScore =
                Math.log(frequency + 1) +
                Math.min(word.length, 10) * 0.45;

            const newScore =
                dp[i].score + wordScore;

            if (
                !dp[end] ||
                newScore > dp[end].score
            ) {
                dp[end] = {
                    score: newScore,
                    words: [
                        ...dp[i].words,
                        word
                    ],
                    knownCharacters:
                        dp[i].knownCharacters +
                        word.length
                };
            }
        }

        // Неизвестный символ.
        // Позволяет алгоритму пройти через слово,
        // которого пока нет в словаре.
        const unknownEnd = i + 1;

        if (unknownEnd <= length) {
            const newScore =
                dp[i].score -
                SEGMENTATION_SETTINGS
                    .unknownCharacterPenalty;

            if (
                !dp[unknownEnd] ||
                newScore >
                    dp[unknownEnd].score
            ) {
                const previousWords =
                    [...dp[i].words];

                const last =
                    previousWords[
                        previousWords.length - 1
                    ];

                if (
                    last &&
                    last.startsWith("¤")
                ) {
                    previousWords[
                        previousWords.length - 1
                    ] =
                        last + source[i];
                } else {
                    previousWords.push(
                        "¤" + source[i]
                    );
                }

                dp[unknownEnd] = {
                    score: newScore,
                    words: previousWords,
                    knownCharacters:
                        dp[i].knownCharacters
                };
            }
        }
    }

    const result = dp[length];

    if (!result) {
        return {
            words: [source],
            text: source,
            score: 0,
            coverage: 0
        };
    }

    const words =
        result.words.map(function (word) {
            return word.replace(/^¤/, "");
        });

    return {
        words: words,

        text:
            words.join(" "),

        score:
            result.score,

        coverage:
            result.knownCharacters /
            Math.max(1, source.length)
    };
}


// ======================================================
// Насколько строка похожа на нормальный русский текст.
// ======================================================

function russianLanguageScore(text) {
    const result =
        segmentRussianText(text);

    if (!result.words.length) {
        return 0;
    }

    const wordCount =
        result.words.length;

    const coverage =
        result.coverage;

    let score =
        coverage;

    // Слишком большое количество односимвольных
    // сегментов подозрительно.
    const singleLetters =
        result.words.filter(function (word) {
            return word.length === 1 &&
                !["я", "и", "а", "в", "с", "к", "у"].includes(word);
        }).length;

    if (singleLetters > 0) {
        score -=
            Math.min(
                0.30,
                singleLetters * 0.05
            );
    }

    if (wordCount >= 2) {
        score += 0.05;
    }

    return Math.max(
        0,
        Math.min(1, score)
    );
}


// ======================================================
// Проверяем конкретную границу:
//
// шалом|привет
// ======================================================

function evaluateCyrillicBoundary(
    hebrew,
    compactText,
    boundary
) {
    const transcription =
        compactText
            .slice(0, boundary)
            .trim();

    const translationRaw =
        compactText
            .slice(boundary)
            .trim();

    if (
        !transcription ||
        !translationRaw
    ) {
        return null;
    }

    const phonetic =
        transcriptionScore(
            hebrew,
            transcription
        );

    const russianScore =
        russianLanguageScore(
            translationRaw
        );

    const segmentedTranslation =
        segmentRussianText(
            translationRaw
        );

    const hebrewLength =
        normalizeHebrew(hebrew).length;

    const transcriptionLength =
        normalizeRussian(
            transcription
        ).length;

    let lengthScore = 0;

    if (
        hebrewLength &&
        transcriptionLength
    ) {
        const ratio =
            transcriptionLength /
            hebrewLength;

        if (
            ratio >= 0.7 &&
            ratio <= 2.5
        ) {
            lengthScore = 1;
        } else {
            const distance =
                ratio < 0.7
                    ? 0.7 - ratio
                    : ratio - 2.5;

            lengthScore =
                Math.max(
                    0,
                    1 - distance / 2
                );
        }
    }

    return {
        hebrew: hebrew,

        transcription:
            transcription,

        russian:
            segmentedTranslation.coverage >= 0.60
                ? segmentedTranslation.text
                : translationRaw,

        scores: {
            phonetic: phonetic,
            russian: russianScore,
            length: lengthScore
        },

        rawBoundary:
            boundary
    };
}


// ======================================================
// Поиск лучшей границы.
// ======================================================

function findBestCyrillicBoundary(
    hebrew,
    cyrillicText
) {
    const compact =
        normalizeRussian(
            cyrillicText
        );

    if (compact.length < 2) {
        return null;
    }

    const candidates = [];

    for (
        let boundary = 1;
        boundary < compact.length;
        boundary++
    ) {
        const candidate =
            evaluateCyrillicBoundary(
                hebrew,
                compact,
                boundary
            );

        if (!candidate) {
            continue;
        }

        candidate.baseScore =
            candidate.scores.phonetic * 0.55 +
            candidate.scores.russian * 0.30 +
            candidate.scores.length * 0.15;

        candidates.push(candidate);
    }

    if (!candidates.length) {
        return null;
    }

    candidates.sort(function (a, b) {
        return b.baseScore -
            a.baseScore;
    });

    const best =
        candidates[0];

    const second =
        candidates[1] || null;

    let confidence =
        best.baseScore;

    if (second) {
        const difference =
            best.baseScore -
            second.baseScore;

        if (difference < 0.015) {
            confidence *= 0.72;
        } else if (difference < 0.04) {
            confidence *= 0.86;
        }
    }

    return {
        hebrew:
            best.hebrew,

        transcription:
            best.transcription,

        russian:
            best.russian,

        confidence:
            Math.max(
                0,
                Math.min(1, confidence)
            ),

        exact:
            false,

        scores:
            best.scores,

        candidates:
            candidates.slice(0, 3)
    };
}