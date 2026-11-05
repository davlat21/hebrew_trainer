// ==================================================
// APP.JS
// СОБЫТИЯ И ЗАПУСК ПРИЛОЖЕНИЯ
// ==================================================


// ==================================================
// ДОБАВИТЬ
// ==================================================

addButton.addEventListener(
    "click",
    function () {

        handleAddButton();

    }
);


// ==================================================
// CTRL + ENTER
// ==================================================

quickInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            handleAddButton();

        }

    }
);


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


        editMode =
            true;


        editButton
            .classList
            .add("active");


        bookmarkMessage.textContent =
            "Нажмите на строку, которую хотите редактировать";


        showWords();

    }
);


// ==================================================
// НОВЫЙ РЕЖИМ УДАЛЕНИЯ
// ==================================================

deleteModeButton.addEventListener(
    "click",
    function () {

        const alreadyActive =
            deleteMode;


        if (alreadyActive) {

            resetModes();

            showWords();

            return;

        }


        activateDeleteMode();

    }
);


// ==================================================
// ВЫБРАТЬ ВСЁ
// ==================================================

selectAllButton.addEventListener(
    "click",
    function () {

        selectAllForDelete();

    }
);


// ==================================================
// СНЯТЬ ВЫБОР
// ==================================================

deselectAllButton.addEventListener(
    "click",
    function () {

        deselectAllForDelete();

    }
);


// ==================================================
// УДАЛИТЬ ВЫБРАННЫЕ
// ==================================================

deleteSelectedButton.addEventListener(
    "click",
    function () {

        deleteSelectedWords();

    }
);


// ==================================================
// ОЧИСТИТЬ ВЕСЬ СЛОВАРЬ
// ==================================================

clearDictionaryButton.addEventListener(
    "click",
    function () {

        clearDictionary();

    }
);


// ==================================================
// ЗАПУСК
// ==================================================

deleteControls.hidden =
    true;


updateDeleteCounter();

showWords();