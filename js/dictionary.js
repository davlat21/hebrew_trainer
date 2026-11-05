// ==================================================
// DICTIONARY.JS
// ОПЕРАЦИИ СО СЛОВАРЁМ
// ==================================================


// ==================================================
// СОЗДАТЬ ЗАПИСЬ
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
// ОБНОВИТЬ СЧЁТЧИК ВЫБРАННЫХ
// ==================================================

function updateDeleteCounter() {

    if (!selectedCount) {

        return;

    }


    selectedCount.textContent =
        "Выбрано: " +
        selectedForDelete.size;

}


// ==================================================
// СБРОС РЕЖИМОВ
// ==================================================

function resetModes() {

    bookmarkMode = null;

    editMode = false;

    editingIndex = null;

    deleteMode = false;


    selectedForDelete.clear();


    addBookmarkButton
        .classList
        .remove("active");


    removeBookmarkButton
        .classList
        .remove("active");


    editButton
        .classList
        .remove("active");


    deleteModeButton
        .classList
        .remove("active");


    bookmarkMessage.textContent =
        "";


    if (deleteControls) {

        deleteControls.hidden =
            true;

    }


    updateDeleteCounter();

}


// ==================================================
// ВКЛЮЧИТЬ РЕЖИМ УДАЛЕНИЯ
// ==================================================

function activateDeleteMode() {

    resetModes();


    deleteMode =
        true;


    deleteModeButton
        .classList
        .add("active");


    deleteControls.hidden =
        false;


    bookmarkMessage.textContent =
        "Выберите одну или несколько записей для удаления";


    updateDeleteCounter();

    showWords();

}


// ==================================================
// ВЫБРАТЬ / СНЯТЬ ОДНУ ЗАПИСЬ
// ==================================================

function toggleDeleteSelection(index) {

    if (!deleteMode) {

        return;

    }


    if (
        index < 0 ||
        index >= words.length
    ) {

        return;

    }


    if (
        selectedForDelete.has(index)
    ) {

        selectedForDelete.delete(
            index
        );

    } else {

        selectedForDelete.add(
            index
        );

    }


    updateDeleteCounter();

    showWords();

}


// ==================================================
// ВЫБРАТЬ ВСЁ
// ==================================================

function selectAllForDelete() {

    if (!deleteMode) {

        return;

    }


    selectedForDelete.clear();


    words.forEach(
        function (
            word,
            index
        ) {

            selectedForDelete.add(
                index
            );

        }
    );


    updateDeleteCounter();

    showWords();

}


// ==================================================
// СНЯТЬ ВЕСЬ ВЫБОР
// ==================================================

function deselectAllForDelete() {

    selectedForDelete.clear();


    updateDeleteCounter();

    showWords();

}


// ==================================================
// УДАЛИТЬ ВЫБРАННЫЕ
// ==================================================

function deleteSelectedWords() {

    if (
        selectedForDelete.size === 0
    ) {

        alert(
            "Сначала выбери хотя бы одну запись."
        );

        return;

    }


    const amount =
        selectedForDelete.size;


    let message;


    if (amount === 1) {

        message =
            "Удалить выбранную запись?";

    } else {

        message =
            "Удалить выбранные записи?\n\n" +
            "Количество: " +
            amount;

    }


    const answer =
        confirm(message);


    if (!answer) {

        return;

    }


    words =
        words.filter(
            function (
                word,
                index
            ) {

                return !selectedForDelete
                    .has(index);

            }
        );


    saveWords();


    resetModes();

    showWords();


    showImportMessage(
        "Удалено записей: " +
        amount +
        ".",
        "success"
    );

}


// ==================================================
// НАЧАТЬ РЕДАКТИРОВАНИЕ
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
// СОХРАНИТЬ РЕДАКТИРОВАНИЕ
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
// ЗАКЛАДКА
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
// УДАЛЕНИЕ ОДНОЙ ЗАПИСИ
// СТАРАЯ КНОПКА В САМОЙ КАРТОЧКЕ
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
// ОЧИСТИТЬ ВЕСЬ СЛОВАРЬ
// ==================================================

function clearDictionary() {

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