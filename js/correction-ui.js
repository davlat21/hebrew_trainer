// ======================================================
// correction-ui.js
//
// ИНТЕРФЕЙС ПРОВЕРКИ ПЕРЕД СОХРАНЕНИЕМ
// ======================================================


let pendingCorrection = null;


// ======================================================
// ЭЛЕМЕНТЫ
// ======================================================

const correctionPanel =
    document.getElementById(
        "correctionPanel"
    );


const correctionTitle =
    document.getElementById(
        "correctionTitle"
    );


const correctionOriginal =
    document.getElementById(
        "correctionOriginal"
    );


const correctionSuggested =
    document.getElementById(
        "correctionSuggested"
    );


const correctionChanges =
    document.getElementById(
        "correctionChanges"
    );


const acceptCorrectionButton =
    document.getElementById(
        "acceptCorrectionButton"
    );


const keepOriginalButton =
    document.getElementById(
        "keepOriginalButton"
    );


const cancelCorrectionButton =
    document.getElementById(
        "cancelCorrectionButton"
    );


// ======================================================
// ЭКРАНИРОВАНИЕ
// ======================================================

function escapeCorrectionHtml(text) {

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// СПРЯТАТЬ
// ======================================================

function hideCorrectionPanel() {

    pendingCorrection =
        null;


    correctionPanel.hidden =
        true;


    correctionOriginal.innerHTML =
        "";


    correctionSuggested.innerHTML =
        "";


    correctionChanges.innerHTML =
        "";

}


// ======================================================
// ПОКАЗАТЬ
// ======================================================

function showCorrectionPanel(
    check,
    onAccept,
    onOriginal
) {

    pendingCorrection = {

        check:
            check,

        onAccept:
            onAccept,

        onOriginal:
            onOriginal

    };


    correctionPanel.hidden =
        false;


    if (check.changed) {

        correctionTitle.textContent =
            "Найдены возможные исправления";

    } else {

        correctionTitle.textContent =
            "Проверка завершена";

    }


    correctionOriginal.innerHTML =

        "<strong>Вы ввели:</strong>" +

        "<div class=\"correctionEntry\">" +

            "<div dir=\"rtl\">" +
                escapeCorrectionHtml(
                    check.original.hebrew
                ) +
            "</div>" +

            "<div>" +
                escapeCorrectionHtml(
                    check.original.transcription
                ) +
            "</div>" +

            "<div>" +
                escapeCorrectionHtml(
                    check.original.russian
                ) +
            "</div>" +

        "</div>";


    correctionSuggested.innerHTML =

        "<strong>" +
            (
                check.changed
                    ? "Предлагаемый вариант:"
                    : "Вариант для сохранения:"
            ) +
        "</strong>" +

        "<div class=\"correctionEntry correctionEntrySuggested\">" +

            "<div dir=\"rtl\">" +
                escapeCorrectionHtml(
                    check.corrected.hebrew
                ) +
            "</div>" +

            "<div>" +
                escapeCorrectionHtml(
                    check.corrected.transcription
                ) +
            "</div>" +

            "<div>" +
                escapeCorrectionHtml(
                    check.corrected.russian
                ) +
            "</div>" +

        "</div>";


    if (
        check.changes &&
        check.changes.length > 0
    ) {

        const items =
            check.changes.map(
                function (change) {

                    return (
                        "<li>" +
                            "<strong>" +
                                escapeCorrectionHtml(
                                    change.from
                                ) +
                            "</strong>" +
                            " → " +
                            "<strong>" +
                                escapeCorrectionHtml(
                                    change.to
                                ) +
                            "</strong>" +
                            "<br>" +
                            "<span>" +
                                escapeCorrectionHtml(
                                    change.reason
                                ) +
                            "</span>" +
                        "</li>"
                    );

                }
            );


        correctionChanges.innerHTML =

            "<div class=\"correctionChangesTitle\">" +
                "Что предлагается изменить:" +
            "</div>" +

            "<ul>" +
                items.join("") +
            "</ul>";

    } else {

        correctionChanges.innerHTML =

            "<div class=\"correctionVerified\">" +

                (
                    check.verified
                        ?
                        "✓ Запись найдена в языковой базе."
                        :
                        "Явных ошибок по подключённым базам не найдено."
                ) +

            "</div>";

    }


    acceptCorrectionButton.textContent =
        check.changed
            ? "Добавить исправленный вариант"
            : "Добавить в словарь";


    keepOriginalButton.hidden =
        !check.changed;


    correctionPanel.scrollIntoView({

        behavior:
            "smooth",

        block:
            "nearest"

    });

}


// ======================================================
// КНОПКИ
// ======================================================

acceptCorrectionButton
    .addEventListener(
        "click",
        function () {

            if (
                !pendingCorrection ||
                typeof pendingCorrection.onAccept !==
                "function"
            ) {

                return;

            }


            const callback =
                pendingCorrection.onAccept;


            const check =
                pendingCorrection.check;


            hideCorrectionPanel();


            callback(
                check.corrected
            );

        }
    );


keepOriginalButton
    .addEventListener(
        "click",
        function () {

            if (
                !pendingCorrection ||
                typeof pendingCorrection.onOriginal !==
                "function"
            ) {

                return;

            }


            const callback =
                pendingCorrection.onOriginal;


            const check =
                pendingCorrection.check;


            hideCorrectionPanel();


            callback(
                check.original
            );

        }
    );


cancelCorrectionButton
    .addEventListener(
        "click",
        function () {

            hideCorrectionPanel();


            showImportMessage(
                "Добавление отменено.",
                "warning"
            );

        }
    );