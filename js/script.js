// ==================================================
// ЗАГРУЗКА СЛОВАРЯ
// ==================================================

let words =
    JSON.parse(localStorage.getItem("hebrewWords")) || [];


words = words.map(function (word) {

    return {
        hebrew: word.hebrew || "",
        transcription: word.transcription || "",
        russian: word.russian || "",
        bookmarked: Boolean(word.bookmarked)
    };

});


saveWords();



// ==================================================
// РЕЖИМЫ РАБОТЫ
// ==================================================

let bookmarkMode = null;

let editMode = false;

let editingIndex = null;



// ==================================================
// ЭЛЕМЕНТЫ СТРАНИЦЫ
// ==================================================

const hebrewInput =
    document.getElementById("hebrew");

const transcriptionInput =
    document.getElementById("transcription");

const russianInput =
    document.getElementById("russian");

const quickInput =
    document.getElementById("quickInput");

const addButton =
    document.getElementById("addButton");

const importMessage =
    document.getElementById("importMessage");

const wordList =
    document.getElementById("wordList");

const addBookmarkButton =
    document.getElementById("addBookmarkButton");

const removeBookmarkButton =
    document.getElementById("removeBookmarkButton");

const editButton =
    document.getElementById("editButton");

const clearDictionaryButton =
    document.getElementById("clearDictionaryButton");

const bookmarkMessage =
    document.getElementById("bookmarkMessage");



// ==================================================
// ПРОВЕРКА АЛФАВИТОВ
// ==================================================

function containsHebrew(text) {

    return /[\u0590-\u05FF]/.test(text);

}


function containsCyrillic(text) {

    return /[а-яё]/i.test(text);

}


function containsLatin(text) {

    return /[a-z]/i.test(text);

}



// ==================================================
// НОРМАЛИЗАЦИЯ РУССКОГО ТЕКСТА
// ==================================================

function normalizeRussian(text) {

    return text
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^а-я]/g, "");

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



// ==================================================
// УБИРАЕМ ГЛАСНЫЕ ИЗ РУССКОЙ ТРАНСКРИПЦИИ
// ==================================================

function russianToConsonants(text) {

    return normalizeRussian(text)
        .replace(/[аеёиоуыэюяйьъ]/g, "");

}



// ==================================================
// УПРОЩАЕМ ПОХОЖИЕ ЗВУКИ
// ==================================================

function simplifySounds(text) {

    return text
        .replace(/б/g, "в")
        .replace(/ф/g, "п")
        .replace(/к/g, "х")
        .replace(/ц/g, "с")
        .replace(/щ/g, "ш");

}



// ==================================================
// РАССТОЯНИЕ ЛЕВЕНШТЕЙНА
// ==================================================

function levenshtein(a, b) {

    const matrix = [];


    for (
        let i = 0;
        i <= b.length;
        i++
    ) {

        matrix[i] = [i];

    }


    for (
        let j = 0;
        j <= a.length;
        j++
    ) {

        matrix[0][j] = j;

    }


    for (
        let i = 1;
        i <= b.length;
        i++
    ) {

        for (
            let j = 1;
            j <= a.length;
            j++
        ) {

            if (
                b.charAt(i - 1) ===
                a.charAt(j - 1)
            ) {

                matrix[i][j] =
                    matrix[i - 1][j - 1];

            } else {

                matrix[i][j] =
                    Math.min(

                        matrix[i - 1][j - 1] + 1,

                        matrix[i][j - 1] + 1,

                        matrix[i - 1][j] + 1

                    );

            }

        }

    }


    return matrix[b.length][a.length];

}



// ==================================================
// СХОДСТВО ДВУХ СТРОК
// ==================================================

function similarity(a, b) {

    if (!a || !b) {

        return 0;

    }


    const distance =
        levenshtein(a, b);


    const maxLength =
        Math.max(
            a.length,
            b.length
        );


    if (maxLength === 0) {

        return 0;

    }


    return 1 - distance / maxLength;

}



// ==================================================
// ОЦЕНКА РУССКОЙ ТРАНСКРИПЦИИ
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


    const hebrewWordCount =
        hebrewText
            .trim()
            .split(/\s+/)
            .length;


    const candidateWordCount =
        candidateText
            .trim()
            .split(/\s+/)
            .length;


    const difference =
        Math.abs(
            hebrewWordCount -
            candidateWordCount
        );


    const wordCountScore =
        1 / (1 + difference);


    return (
        soundScore * 0.8 +
        wordCountScore * 0.2
    );

}



// ==================================================
// СОЗДАЁМ ВОЗМОЖНЫЕ ГРУППЫ
// РУССКОЙ ТРАНСКРИПЦИИ
// ==================================================

function createCandidates(wordsArray) {

    const candidates = [];


    for (
        let start = 0;
        start < wordsArray.length;
        start++
    ) {

        for (
            let end = start;
            end < wordsArray.length;
            end++
        ) {

            const indexes = [];


            for (
                let i = start;
                i <= end;
                i++
            ) {

                indexes.push(i);

            }


            candidates.push({

                text:
                    wordsArray
                        .slice(
                            start,
                            end + 1
                        )
                        .join(" "),

                indexes: indexes

            });

        }

    }


    return candidates;

}



// ==================================================
// ТОЧНЫЙ РАЗБОР ЧЕРЕЗ |
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


    // Должно быть строго три части

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


    // В первой части должен быть иврит

    if (!containsHebrew(hebrew)) {

        return null;

    }


    return {

        hebrew: hebrew,

        transcription:
            transcription,

        russian:
            russian,

        confidence: 1,

        exact: true

    };

}



// ==================================================
// АВТОМАТИЧЕСКИЙ РАЗБОР
// ==================================================

function parseAutomaticInput(text) {

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


    // ----------------------------------------------
    // РАЗДЕЛЯЕМ ПО АЛФАВИТАМ
    // ----------------------------------------------

    parts.forEach(function (part) {

        if (containsHebrew(part)) {

            hebrewParts.push(part);

        } else if (containsLatin(part)) {

            latinParts.push(part);

        } else if (containsCyrillic(part)) {

            cyrillicParts.push(part);

        }

    });


    if (hebrewParts.length === 0) {

        return null;

    }


    const hebrew =
        hebrewParts.join(" ");



    // ==================================================
    // ТРАНСКРИПЦИЯ ЛАТИНИЦЕЙ
    // ==================================================

    if (
        latinParts.length > 0 &&
        cyrillicParts.length > 0
    ) {

        return {

            hebrew: hebrew,

            transcription:
                latinParts.join(" "),

            russian:
                cyrillicParts.join(" "),

            confidence: 1,

            exact: false

        };

    }



    // ==================================================
    // ТРАНСКРИПЦИЯ КИРИЛЛИЦЕЙ
    // ==================================================

    const otherParts =
        cyrillicParts;


    if (otherParts.length < 2) {

        return null;

    }


    const candidates =
        createCandidates(
            otherParts
        );


    let bestCandidate = null;

    let bestScore = -Infinity;


    candidates.forEach(
        function (candidate) {

            // После транскрипции
            // должен остаться перевод

            if (
                candidate.indexes.length >=
                otherParts.length
            ) {

                return;

            }


            const score =
                transcriptionScore(
                    hebrew,
                    candidate.text
                );


            if (score > bestScore) {

                bestScore = score;

                bestCandidate =
                    candidate;

            }

        }
    );


    if (!bestCandidate) {

        return null;

    }


    const transcription =
        bestCandidate.text;


    const transcriptionIndexes =
        new Set(
            bestCandidate.indexes
        );


    const translationParts =
        otherParts.filter(
            function (
                part,
                index
            ) {

                return !transcriptionIndexes
                    .has(index);

            }
        );


    const russian =
        translationParts.join(" ");


    if (
        transcription === "" ||
        russian === ""
    ) {

        return null;

    }


    return {

        hebrew: hebrew,

        transcription:
            transcription,

        russian: russian,

        confidence:
            bestScore,

        exact: false

    };

}



// ==================================================
// ОБЩИЙ РАЗБОР ОДНОЙ СТРОКИ
// ==================================================

function parseQuickInput(text) {

    const cleanText =
        text.trim();


    if (cleanText === "") {

        return null;

    }


    // ----------------------------------------------
    // СНАЧАЛА ПРОБУЕМ ТОЧНЫЙ ФОРМАТ |
    // ----------------------------------------------

    if (cleanText.includes("|")) {

        return parseSeparatedInput(
            cleanText
        );

    }


    // ----------------------------------------------
    // ЕСЛИ | НЕТ —
    // АВТОМАТИЧЕСКОЕ РАСПОЗНАВАНИЕ
    // ----------------------------------------------

    return parseAutomaticInput(
        cleanText
    );

}



// ==================================================
// СОЗДАНИЕ НОВОЙ ЗАПИСИ
// ==================================================

function createWord(
    hebrew,
    transcription,
    russian
) {

    return {

        hebrew:
            hebrew.trim(),

        transcription:
            transcription.trim(),

        russian:
            russian.trim(),

        bookmarked:
            false

    };

}



// ==================================================
// ПОКАЗАТЬ СООБЩЕНИЕ ИМПОРТА
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
// ОБЫЧНОЕ ДОБАВЛЕНИЕ ИЗ ТРЁХ ПОЛЕЙ
// ==================================================

function addFromNormalFields() {

    const hebrew =
        hebrewInput.value.trim();

    const transcription =
        transcriptionInput.value.trim();

    const russian =
        russianInput.value.trim();


    if (
        hebrew === "" ||
        transcription === "" ||
        russian === ""
    ) {

        alert(
            "Заполни все три поля:\n\n" +
            "• иврит\n" +
            "• транскрипция\n" +
            "• перевод"
        );

        return false;

    }


    words.push(
        createWord(
            hebrew,
            transcription,
            russian
        )
    );


    saveWords();


    hebrewInput.value = "";

    transcriptionInput.value = "";

    russianInput.value = "";


    showWords();


    showImportMessage(
        "Добавлена 1 запись.",
        "success"
    );


    return true;

}



// ==================================================
// МАССОВОЕ ДОБАВЛЕНИЕ
// ==================================================

function addFromQuickInput() {

    const text =
        quickInput.value;


    // ----------------------------------------------
    // РАЗБИВАЕМ ПО ПЕРЕНОСАМ СТРОК
    // ----------------------------------------------

    const lines =
        text
            .split(/\r?\n/)
            .map(function (line) {

                return line.trim();

            })
            .filter(function (line) {

                return line !== "";

            });


    if (lines.length === 0) {

        return false;

    }


    const successfulWords = [];

    const failedLines = [];

    const uncertainLines = [];


    // ----------------------------------------------
    // ОБРАБАТЫВАЕМ КАЖДУЮ СТРОКУ ОТДЕЛЬНО
    // ----------------------------------------------

    lines.forEach(
        function (line) {

            const parsed =
                parseQuickInput(
                    line
                );


            if (!parsed) {

                failedLines.push(
                    line
                );

                return;

            }


            // --------------------------------------
            // СЛИШКОМ НЕУВЕРЕННОЕ
            // АВТОМАТИЧЕСКОЕ РАСПОЗНАВАНИЕ
            // --------------------------------------

            if (
                !parsed.exact &&
                parsed.confidence < 0.35
            ) {

                uncertainLines.push(
                    line
                );

                return;

            }


            successfulWords.push(
                createWord(
                    parsed.hebrew,
                    parsed.transcription,
                    parsed.russian
                )
            );

        }
    );


    // ----------------------------------------------
    // ДОБАВЛЯЕМ УСПЕШНЫЕ
    // ----------------------------------------------

    if (successfulWords.length > 0) {

        words.push(
            ...successfulWords
        );


        saveWords();

        showWords();

    }


    // ----------------------------------------------
    // ПРОБЛЕМНЫЕ СТРОКИ ОСТАЮТСЯ В TEXTAREA
    // ----------------------------------------------

    const remainingLines = [

        ...failedLines,

        ...uncertainLines

    ];


    quickInput.value =
        remainingLines.join("\n");


    // ----------------------------------------------
    // РЕЗУЛЬТАТ
    // ----------------------------------------------

    if (
        successfulWords.length > 0 &&
        remainingLines.length === 0
    ) {

        showImportMessage(
            "Готово. Добавлено записей: " +
            successfulWords.length +
            ".",
            "success"
        );


        quickInput.focus();


        return true;

    }


    if (
        successfulWords.length > 0 &&
        remainingLines.length > 0
    ) {

        showImportMessage(
            "Добавлено: " +
            successfulWords.length +
            ". Не удалось уверенно распознать: " +
            remainingLines.length +
            ". Проблемные строки оставлены в поле.",
            "warning"
        );


        quickInput.focus();


        return true;

    }


    showImportMessage(
        "Не удалось распознать строки. " +
        "Для точного ввода используй формат: " +
        "иврит | транскрипция | перевод",
        "error"
    );


    quickInput.focus();


    return false;

}



// ==================================================
// КНОПКА "ДОБАВИТЬ"
// ==================================================

addButton.addEventListener(
    "click",
    function () {

        showImportMessage(
            "",
            null
        );


        const quickText =
            quickInput.value.trim();


        // ----------------------------------------------
        // ЕСЛИ ЕСТЬ ТЕКСТ В БОЛЬШОМ ПОЛЕ
        // ----------------------------------------------

        if (quickText !== "") {

            addFromQuickInput();

            return;

        }


        // ----------------------------------------------
        // ИНАЧЕ ИСПОЛЬЗУЕМ ТРИ ОБЫЧНЫХ ПОЛЯ
        // ----------------------------------------------

        addFromNormalFields();

    }
);



// ==================================================
// CTRL + ENTER В БОЛЬШОМ ПОЛЕ
//
// Enter = новая строка
// Ctrl + Enter = добавить
// ==================================================

quickInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            addButton.click();

        }

    }
);



// ==================================================
// ВЫКЛЮЧАЕМ ВСЕ РЕЖИМЫ
// ==================================================

function resetModes() {

    bookmarkMode = null;

    editMode = false;

    editingIndex = null;


    addBookmarkButton
        .classList
        .remove("active");


    removeBookmarkButton
        .classList
        .remove("active");


    editButton
        .classList
        .remove("active");


    bookmarkMessage.textContent =
        "";

}



// ==================================================
// СДЕЛАТЬ ЗАКЛАДКУ
// ==================================================

addBookmarkButton.addEventListener(
    "click",
    function () {

        const alreadyActive =
            bookmarkMode === "add";


        resetModes();


        if (alreadyActive) {

            showWords();

            return;

        }


        bookmarkMode =
            "add";


        addBookmarkButton
            .classList
            .add("active");


        bookmarkMessage.textContent =
            "Нажмите на строку, которую хотите отметить";


        showWords();

    }
);



// ==================================================
// УБРАТЬ ЗАКЛАДКУ
// ==================================================

removeBookmarkButton.addEventListener(
    "click",
    function () {

        const alreadyActive =
            bookmarkMode === "remove";


        resetModes();


        if (alreadyActive) {

            showWords();

            return;

        }


        bookmarkMode =
            "remove";


        removeBookmarkButton
            .classList
            .add("active");


        bookmarkMessage.textContent =
            "Нажмите на строку, с которой хотите убрать закладку";


        showWords();

    }
);



// ==================================================
// РЕДАКТИРОВАТЬ
// ==================================================

editButton.addEventListener(
    "click",
    function () {

        const alreadyActive =
            editMode;


        resetModes();


        if (alreadyActive) {

            showWords();

            return;

        }


        editMode = true;


        editButton
            .classList
            .add("active");


        bookmarkMessage.textContent =
            "Нажмите на строку, которую хотите редактировать";


        showWords();

    }
);



// ==================================================
// ОЧИСТИТЬ ВЕСЬ СЛОВАРЬ
// ==================================================

clearDictionaryButton.addEventListener(
    "click",
    function () {

        if (words.length === 0) {

            alert(
                "Словарь уже пуст."
            );

            return;

        }


        const answer =
            confirm(
                "Вы действительно хотите удалить ВЕСЬ словарь?\n\n" +
                "Будут удалены все слова, фразы и предложения."
            );


        if (!answer) {

            return;

        }


        const finalAnswer =
            confirm(
                "Это действие нельзя отменить.\n\n" +
                "Точно очистить весь словарь?"
            );


        if (!finalAnswer) {

            return;

        }


        words = [];


        saveWords();

        resetModes();

        showWords();


        showImportMessage(
            "",
            null
        );


        alert(
            "Словарь полностью очищен."
        );

    }
);



// ==================================================
// НАЧАЛО РЕДАКТИРОВАНИЯ
// ==================================================

function startEditing(index) {

    if (
        index < 0 ||
        index >= words.length
    ) {

        return;

    }


    editingIndex =
        index;


    showWords();

}



// ==================================================
// СОХРАНЕНИЕ РЕДАКТИРОВАНИЯ
// ==================================================

function saveEditedWord(
    index,
    hebrewEdit,
    transcriptionEdit,
    russianEdit
) {

    if (
        !hebrewEdit ||
        !transcriptionEdit ||
        !russianEdit
    ) {

        return;

    }


    const hebrew =
        hebrewEdit.value.trim();


    const transcription =
        transcriptionEdit.value.trim();


    const russian =
        russianEdit.value.trim();


    if (
        hebrew === "" ||
        transcription === "" ||
        russian === ""
    ) {

        alert(
            "Все три поля должны быть заполнены."
        );

        return;

    }


    words[index].hebrew =
        hebrew;


    words[index].transcription =
        transcription;


    words[index].russian =
        russian;


    saveWords();

    resetModes();

    showWords();

}



// ==================================================
// ОТМЕНА РЕДАКТИРОВАНИЯ
// ==================================================

function cancelEditing() {

    resetModes();

    showWords();

}



// ==================================================
// ЗАКЛАДКИ
// ==================================================

function handleBookmark(index) {

    if (
        bookmarkMode === null
    ) {

        return;

    }


    if (
        index < 0 ||
        index >= words.length
    ) {

        return;

    }


    if (
        bookmarkMode === "add"
    ) {

        words[index].bookmarked =
            true;

    }


    if (
        bookmarkMode === "remove"
    ) {

        words[index].bookmarked =
            false;

    }


    saveWords();

    resetModes();

    showWords();

}



// ==================================================
// УДАЛЕНИЕ
// ==================================================

function deleteWord(
    event,
    index
) {

    event.stopPropagation();


    const answer =
        confirm(
            "Удалить это слово, фразу или предложение из списка?"
        );


    if (!answer) {

        return;

    }


    words.splice(
        index,
        1
    );


    saveWords();

    resetModes();

    showWords();

}



// ==================================================
// ОТОБРАЖЕНИЕ СЛОВАРЯ
// ==================================================

function showWords() {

    wordList.innerHTML =
        "";


    words.forEach(
        function (
            word,
            index
        ) {

            const wordElement =
                document.createElement(
                    "div"
                );


            wordElement
                .classList
                .add("word");



            // ==========================================
            // ЗАКЛАДКА
            // ==========================================

            if (
                word.bookmarked
            ) {

                wordElement
                    .classList
                    .add(
                        "bookmarked"
                    );

            }



            // ==========================================
            // РЕДАКТИРОВАНИЕ
            // ==========================================

            if (
                editingIndex === index
            ) {

                wordElement
                    .classList
                    .add(
                        "editing"
                    );


                const numberElement =
                    document.createElement(
                        "span"
                    );


                numberElement.className =
                    "number";


                numberElement.textContent =
                    (index + 1) + ".";



                // --------------------------------------
                // ИВРИТ
                // --------------------------------------

                const hebrewEdit =
                    document.createElement(
                        "textarea"
                    );


                hebrewEdit.className =
                    "editField editHebrew";


                hebrewEdit.value =
                    word.hebrew;


                hebrewEdit.dir =
                    "rtl";


                hebrewEdit.rows =
                    2;


                hebrewEdit.setAttribute(
                    "aria-label",
                    "Иврит"
                );



                // --------------------------------------
                // ТРАНСКРИПЦИЯ
                // --------------------------------------

                const transcriptionEdit =
                    document.createElement(
                        "textarea"
                    );


                transcriptionEdit.className =
                    "editField editTranscription";


                transcriptionEdit.value =
                    word.transcription;


                transcriptionEdit.rows =
                    2;


                transcriptionEdit.setAttribute(
                    "aria-label",
                    "Транскрипция"
                );



                // --------------------------------------
                // ПЕРЕВОД
                // --------------------------------------

                const russianEdit =
                    document.createElement(
                        "textarea"
                    );


                russianEdit.className =
                    "editField editRussian";


                russianEdit.value =
                    word.russian;


                russianEdit.rows =
                    2;


                russianEdit.setAttribute(
                    "aria-label",
                    "Перевод"
                );



                // --------------------------------------
                // КНОПКИ
                // --------------------------------------

                const editActions =
                    document.createElement(
                        "div"
                    );


                editActions.className =
                    "editActions";


                const saveButton =
                    document.createElement(
                        "button"
                    );


                saveButton.type =
                    "button";


                saveButton.className =
                    "saveEditButton";


                saveButton.textContent =
                    "Сохранить";


                const cancelButton =
                    document.createElement(
                        "button"
                    );


                cancelButton.type =
                    "button";


                cancelButton.className =
                    "cancelEditButton";


                cancelButton.textContent =
                    "Отмена";



                // --------------------------------------
                // СОХРАНИТЬ
                // --------------------------------------

                saveButton.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        saveEditedWord(
                            index,
                            hebrewEdit,
                            transcriptionEdit,
                            russianEdit
                        );

                    }
                );



                // --------------------------------------
                // ОТМЕНА
                // --------------------------------------

                cancelButton.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        cancelEditing();

                    }
                );



                // --------------------------------------
                // КЛИКИ ВНУТРИ ПОЛЕЙ
                // --------------------------------------

                [
                    hebrewEdit,
                    transcriptionEdit,
                    russianEdit
                ].forEach(
                    function (field) {

                        field.addEventListener(
                            "click",
                            function (event) {

                                event.stopPropagation();

                            }
                        );

                    }
                );



                // --------------------------------------
                // СОБИРАЕМ РЕДАКТОР
                // --------------------------------------

                editActions.appendChild(
                    saveButton
                );


                editActions.appendChild(
                    cancelButton
                );


                wordElement.appendChild(
                    numberElement
                );


                wordElement.appendChild(
                    hebrewEdit
                );


                wordElement.appendChild(
                    transcriptionEdit
                );


                wordElement.appendChild(
                    russianEdit
                );


                wordElement.appendChild(
                    editActions
                );

            }



            // ==========================================
            // ОБЫЧНАЯ СТРОКА
            // ==========================================

            else {

                const numberElement =
                    document.createElement(
                        "span"
                    );


                numberElement.className =
                    "number";


                numberElement.textContent =
                    (index + 1) + ".";



                const hebrewElement =
                    document.createElement(
                        "span"
                    );


                hebrewElement.className =
                    "hebrew-word";


                hebrewElement.textContent =
                    word.hebrew;



                const transcriptionElement =
                    document.createElement(
                        "span"
                    );


                transcriptionElement.className =
                    "transcription";


                transcriptionElement.textContent =
                    word.transcription;



                const translationElement =
                    document.createElement(
                        "span"
                    );


                translationElement.className =
                    "translation";


                translationElement.textContent =
                    word.russian;



                const deleteButton =
                    document.createElement(
                        "button"
                    );


                deleteButton.type =
                    "button";


                deleteButton.className =
                    "deleteButton";


                deleteButton.textContent =
                    "Удалить";


                deleteButton.addEventListener(
                    "click",
                    function (event) {

                        deleteWord(
                            event,
                            index
                        );

                    }
                );



                wordElement.appendChild(
                    numberElement
                );


                wordElement.appendChild(
                    hebrewElement
                );


                wordElement.appendChild(
                    transcriptionElement
                );


                wordElement.appendChild(
                    translationElement
                );


                wordElement.appendChild(
                    deleteButton
                );



                // --------------------------------------
                // НАЖАТИЕ НА СТРОКУ
                // --------------------------------------

                wordElement.addEventListener(
                    "click",
                    function () {

                        if (
                            editMode
                        ) {

                            startEditing(
                                index
                            );

                            return;

                        }


                        if (
                            bookmarkMode !== null
                        ) {

                            handleBookmark(
                                index
                            );

                        }

                    }
                );

            }



            // ==========================================
            // ДОБАВЛЯЕМ СТРОКУ
            // ==========================================

            wordList.appendChild(
                wordElement
            );

        }
    );

}



// ==================================================
// СОХРАНЕНИЕ В LOCALSTORAGE
// ==================================================

function saveWords() {

    localStorage.setItem(
        "hebrewWords",
        JSON.stringify(words)
    );

}



// ==================================================
// ЗАПУСК
// ==================================================

showWords();