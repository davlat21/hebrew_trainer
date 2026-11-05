// ==================================================
// STATE.JS
// ОБЩЕЕ СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ==================================================


// ==================================================
// ЗАГРУЗКА СЛОВАРЯ
// ==================================================

let words =
    JSON.parse(
        localStorage.getItem("hebrewWords")
    ) || [];


words = words.map(function (word) {

    return {
        hebrew: word.hebrew || "",
        transcription: word.transcription || "",
        russian: word.russian || "",
        bookmarked: Boolean(word.bookmarked)
    };

});


// ==================================================
// РЕЖИМЫ
// ==================================================

let bookmarkMode = null;

let editMode = false;

let editingIndex = null;


// ==================================================
// РЕЖИМ МАССОВОГО УДАЛЕНИЯ
// ==================================================

let deleteMode = false;


// Здесь хранятся номера выбранных записей

let selectedForDelete =
    new Set();


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


// ==================================================
// НОВАЯ КНОПКА УДАЛЕНИЯ
// ==================================================

const deleteModeButton =
    document.getElementById(
        "deleteModeButton"
    );


// ==================================================
// ПАНЕЛЬ МАССОВОГО УДАЛЕНИЯ
// ==================================================

const deleteControls =
    document.getElementById(
        "deleteControls"
    );


const selectAllButton =
    document.getElementById(
        "selectAllButton"
    );


const deselectAllButton =
    document.getElementById(
        "deselectAllButton"
    );


const deleteSelectedButton =
    document.getElementById(
        "deleteSelectedButton"
    );


const selectedCount =
    document.getElementById(
        "selectedCount"
    );


const clearDictionaryButton =
    document.getElementById(
        "clearDictionaryButton"
    );


const bookmarkMessage =
    document.getElementById(
        "bookmarkMessage"
    );


// ==================================================
// СОХРАНЕНИЕ
// ==================================================

function saveWords() {

    localStorage.setItem(
        "hebrewWords",
        JSON.stringify(words)
    );

}


// ==================================================
// СОХРАНЯЕМ НОРМАЛИЗОВАННЫЙ ФОРМАТ
// ==================================================

saveWords();