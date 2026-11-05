// ======================================================
// confidence.js
// Единая система оценки уверенности.
// ======================================================

const CONFIDENCE_LEVELS = {
    automatic: 0.80,
    review: 0.55
};


function clampConfidence(value) {
    return Math.max(
        0,
        Math.min(
            1,
            Number(value) || 0
        )
    );
}


function getConfidenceLevel(confidence) {
    const value =
        clampConfidence(confidence);

    if (
        value >=
        CONFIDENCE_LEVELS.automatic
    ) {
        return "automatic";
    }

    if (
        value >=
        CONFIDENCE_LEVELS.review
    ) {
        return "review";
    }

    return "uncertain";
}


function calculateCombinedConfidence({
    phonetic = 0,
    russian = 0,
    dictionary = 0,
    length = 0,
    structure = 0
}) {
    return clampConfidence(
        phonetic * 0.35 +
        russian * 0.30 +
        dictionary * 0.20 +
        length * 0.10 +
        structure * 0.05
    );
}


function addConfidenceMetadata(result) {
    if (!result) {
        return null;
    }

    result.confidence =
        clampConfidence(
            result.confidence
        );

    result.confidenceLevel =
        getConfidenceLevel(
            result.confidence
        );

    return result;
}