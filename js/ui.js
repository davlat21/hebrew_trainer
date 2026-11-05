// ==================================================
// UI.JS
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
            // ВЫБРАНО ДЛЯ УДАЛЕНИЯ
            // ==========================================

            if (
                deleteMode &&
                selectedForDelete.has(index)
            ) {

                wordElement
                    .classList
                    .add(
                        "selectedForDelete"
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


                cancelButton.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        cancelEditing();

                    }
                );


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
            // ОБЫЧНАЯ КАРТОЧКА
            // ==========================================

            else {

                // ======================================
                // ЧЕКБОКС УДАЛЕНИЯ
                // ======================================

                if (deleteMode) {

                    const deleteCheckbox =
                        document.createElement(
                            "input"
                        );


                    deleteCheckbox.type =
                        "checkbox";


                    deleteCheckbox.className =
                        "deleteSelectCheckbox";


                    deleteCheckbox.checked =
                        selectedForDelete.has(
                            index
                        );


                    deleteCheckbox.setAttribute(
                        "aria-label",
                        "Выбрать для удаления"
                    );


                    deleteCheckbox.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();


                            toggleDeleteSelection(
                                index
                            );

                        }
                    );


                    wordElement.appendChild(
                        deleteCheckbox
                    );

                }


                // ======================================
                // НОМЕР
                // ======================================

                const numberElement =
                    document.createElement(
                        "span"
                    );


                numberElement.className =
                    "number";


                numberElement.textContent =
                    (index + 1) + ".";


                // ======================================
                // ИВРИТ
                // ======================================

                const hebrewElement =
                    document.createElement(
                        "span"
                    );


                hebrewElement.className =
                    "hebrew-word";


                hebrewElement.textContent =
                    word.hebrew;


                // ======================================
                // ТРАНСКРИПЦИЯ
                // ======================================

                const transcriptionElement =
                    document.createElement(
                        "span"
                    );


                transcriptionElement.className =
                    "transcription";


                transcriptionElement.textContent =
                    word.transcription;


                // ======================================
                // ПЕРЕВОД
                // ======================================

                const translationElement =
                    document.createElement(
                        "span"
                    );


                translationElement.className =
                    "translation";


                translationElement.textContent =
                    word.russian;


                // ======================================
                // СТАРАЯ КНОПКА УДАЛЕНИЯ
                // ======================================

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


                // ======================================
                // СОБИРАЕМ КАРТОЧКУ
                // ======================================

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


                // В режиме массового удаления
                // отдельную кнопку "Удалить"
                // скрываем

                if (!deleteMode) {

                    wordElement.appendChild(
                        deleteButton
                    );

                }


                // ======================================
                // КЛИК НА КАРТОЧКУ
                // ======================================

                wordElement.addEventListener(
                    "click",
                    function () {


                        // --------------------------------
                        // МАССОВОЕ УДАЛЕНИЕ
                        // --------------------------------

                        if (deleteMode) {

                            toggleDeleteSelection(
                                index
                            );

                            return;

                        }


                        // --------------------------------
                        // РЕДАКТИРОВАНИЕ
                        // --------------------------------

                        if (
                            editMode
                        ) {

                            startEditing(
                                index
                            );

                            return;

                        }


                        // --------------------------------
                        // ЗАКЛАДКА
                        // --------------------------------

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
            // ДОБАВЛЯЕМ В СПИСОК
            // ==========================================

            wordList.appendChild(
                wordElement
            );

        }
    );


    updateDeleteCounter();

}