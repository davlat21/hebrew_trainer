// ==================================================
// IMPORT.JS
// ДОБАВЛЕНИЕ И МАССОВЫЙ ИМПОРТ
// + ПРОВЕРКА ПЕРЕД СОХРАНЕНИЕМ
// ==================================================


// ==================================================
// СООБЩЕНИЕ
// ==================================================

function showImportMessage(
    message,
    type
) {

    importMessage.textContent =
        message;


    importMessage.classList.remove(
        "success",
        "warning",
        "error"
    );


    if (type) {

        importMessage
            .classList
            .add(type);

    }

}


// ==================================================
// ФАКТИЧЕСКОЕ ДОБАВЛЕНИЕ
// ==================================================

function saveCheckedWord(entry) {

    if (
        !entry ||
        !entry.hebrew
    ) {

        return false;

    }


    words.push(

        createWord(

            entry.hebrew || "",

            entry.transcription || "",

            entry.russian || ""

        )

    );


    saveWords();

    showWords();


    showImportMessage(
        "Добавлена 1 запись.",
        "success"
    );


    return true;

}


// ==================================================
// ОЧИСТИТЬ ОБЫЧНЫЕ ПОЛЯ
// ==================================================

function clearNormalFields() {

    hebrewInput.value = "";

    transcriptionInput.value = "";

    russianInput.value = "";

}


// ==================================================
// ОБЫЧНЫЕ ТРИ ПОЛЯ
// ==================================================

function addFromNormalFields() {

    const filled = [hebrewInput.value, transcriptionInput.value, russianInput.value]
        .map(function (value) { return value.trim(); }).filter(Boolean);
    if (filled.length === 1 && isRussianDatabaseQuery(filled[0])) {
        return addRussianFromDatabase(filled[0], clearNormalFields);
    }

    const hebrew =
        hebrewInput.value.trim();


    const transcription =
        transcriptionInput.value.trim();


    const russian =
        russianInput.value.trim();


    // ==================================================
    // Теперь обязательным является только иврит.
    //
    // Транскрипцию и перевод в будущем сможет
    // предложить языковая база.
    // ==================================================

    if (!hebrew) {

        alert(
            "Введи слово, фразу или предложение на иврите."
        );

        return false;

    }


    const check =
        checkLanguageEntry(

            hebrew,

            transcription,

            russian

        );


    showCorrectionPanel(

        check,


        // ==============================================
        // ПРИНЯТЬ ИСПРАВЛЕННЫЙ ВАРИАНТ
        // ==============================================

        function (corrected) {

            saveCheckedWord(
                corrected
            );


            clearNormalFields();

        },


        // ==============================================
        // СОХРАНИТЬ ОРИГИНАЛ
        // ==============================================

        function (original) {

            saveCheckedWord(
                original
            );


            clearNormalFields();

        }

    );


    return true;

}


// ==================================================
// ДОБАВИТЬ РАСПОЗНАННУЮ БЫСТРУЮ ЗАПИСЬ
// ==================================================

function saveParsedQuickWord(entry) {

    return saveCheckedWord(
        entry
    );

}


// ==================================================
// УДАЛИТЬ ПЕРВУЮ ОБРАБОТАННУЮ СТРОКУ
// ==================================================

function removeFirstQuickInputLine(
    lines
) {

    const remaining =
        lines.slice(1);


    quickInput.value =
        remaining.join("\n");

}


// ==================================================
// СООБЩЕНИЕ ПОСЛЕ ОБРАБОТКИ
// ==================================================

function showQuickInputResultMessage(
    remainingCount,
    originalWasUsed
) {

    if (
        remainingCount > 0
    ) {

        showImportMessage(

            (
                originalWasUsed
                    ?
                    "Оригинальный вариант добавлен. "
                    :
                    "Запись добавлена. "
            ) +

            "Осталось проверить: " +

            remainingCount +

            ". Нажми «Добавить в словарь» ещё раз.",

            originalWasUsed
                ? "warning"
                : "success"

        );


        return;

    }


    showImportMessage(

        originalWasUsed
            ?
            "Оригинальный вариант добавлен."
            :
            "Запись добавлена.",

        originalWasUsed
            ? "warning"
            : "success"

    );

}


// ==================================================
// МАССОВЫЙ / БЫСТРЫЙ ВВОД
// ==================================================

function addFromQuickInput() {

    const text =
        quickInput.value;


    const lines =
        text
            .split(/\r?\n/)
            .map(
                function (line) {

                    return line.trim();

                }
            )
            .filter(
                function (line) {

                    return line !== "";

                }
            );


    if (
        lines.length === 0
    ) {

        return false;

    }


    // Пока проверяем записи по одной,
    // чтобы пользователь видел исправления.

    const firstLine =
        lines[0];


    if (isRussianDatabaseQuery(firstLine)) {
        return addRussianFromDatabase(firstLine, function () {
            removeFirstQuickInputLine(lines);
            showQuickInputResultMessage(lines.length - 1, false);
            quickInput.focus();
        });
    }

    const parsed =
        parseQuickInput(
            firstLine
        );


    if (!parsed) {

        showImportMessage(

            "Не удалось распознать первую строку. " +
            "Проверь, что в ней есть текст на иврите.",

            "error"

        );


        return false;

    }


    // ==================================================
    // НИЗКАЯ УВЕРЕННОСТЬ
    //
    // Но есть важное исключение:
    // если парсер уже уверенно определил
    // ИВРИТ + РУССКИЙ ПЕРЕВОД,
    // отсутствие транскрипции не является ошибкой.
    // ==================================================

    const allowedWithoutTranscription =
        parsed.method ===
            "hebrew-russian" ||

        parsed.method ===
            "traditional-hebrew-russian" ||

        parsed.method ===
            "separator" ||

        parsed.method ===
            "separator-hebrew-only" ||

        parsed.method ===
            "hebrew-only" ||

        parsed.method ===
            "traditional-hebrew-only";


    if (
        !parsed.exact &&
        parsed.confidence <
            PARSER_SETTINGS.minimumConfidence &&
        !allowedWithoutTranscription
    ) {

        showImportMessage(

            "Первая строка распознана недостаточно уверенно. " +
            "Попробуй добавить разделители | или исправить запись.",

            "warning"

        );


        return false;

    }


    // ==================================================
    // ПРОВЕРКА ЯЗЫКОВОЙ БАЗОЙ
    // ==================================================

    const check =
        checkLanguageEntry(

            parsed.hebrew || "",

            parsed.transcription || "",

            parsed.russian || ""

        );


    // ==================================================
    // ПОКАЗЫВАЕМ ПАНЕЛЬ ПРОВЕРКИ
    // ==================================================

    showCorrectionPanel(

        check,


        // ==============================================
        // СОХРАНИТЬ ИСПРАВЛЕННЫЙ
        // ==============================================

        function (corrected) {

            saveParsedQuickWord(
                corrected
            );


            removeFirstQuickInputLine(
                lines
            );


            showQuickInputResultMessage(

                lines.length - 1,

                false

            );


            quickInput.focus();

        },


        // ==============================================
        // СОХРАНИТЬ КАК ВВЁЛ ПОЛЬЗОВАТЕЛЬ
        // ==============================================

        function (original) {

            saveParsedQuickWord(
                original
            );


            removeFirstQuickInputLine(
                lines
            );


            showQuickInputResultMessage(

                lines.length - 1,

                true

            );


            quickInput.focus();

        }

    );


    return true;

}


// ==================================================
// ОБЩАЯ КНОПКА
// ==================================================

function handleAddButton() {

    if (pendingDatabaseChoice) {
        showImportMessage('Сначала выбери перевод из базы или нажми «Отмена».', 'warning');
        return;
    }

    showImportMessage(
        "",
        null
    );


    // Если панель предыдущей проверки
    // ещё открыта — сначала пользователь
    // должен принять решение.

    if (
        typeof pendingCorrection !==
            "undefined" &&
        pendingCorrection
    ) {

        showImportMessage(

            "Сначала выбери, какой вариант сохранить.",

            "warning"

        );


        return;

    }


    const quickText =
        quickInput.value.trim();


    if (quickText !== "") {

        addFromQuickInput();

        return;

    }


    addFromNormalFields();

}