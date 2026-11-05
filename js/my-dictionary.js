(function () {
    "use strict";
    const button = document.getElementById("myDictionaryButton");
    const panel = document.getElementById("myDictionaryPanel");
    const rows = document.getElementById("myDictionaryRows");
    const count = document.getElementById("myDictionaryCount");
    let rendered = false;
    button.addEventListener("click", function () {
        const opening = panel.hidden;
        if (opening && !rendered) {
            const database = window.GeneralHebrewRussianDatabase;
            if (!database) {
                count.textContent = "Не удалось загрузить словарь. Обновите страницу.";
            } else {
                const records = database.getAll();
                const fragment = document.createDocumentFragment();
                records.forEach(function (record, index) {
                    const row = document.createElement("tr");
                    [String(index + 1), record.hebrew, record.transcription, record.russian].forEach(function (value, column) {
                        const cell = document.createElement("td");
                        cell.textContent = value;
                        if (column === 1) { cell.lang = "he"; cell.dir = "rtl"; }
                        row.appendChild(cell);
                    });
                    fragment.appendChild(row);
                });
                rows.appendChild(fragment);
                count.textContent = "Всего записей: " + records.length;
                rendered = true;
            }
        }
        panel.hidden = !opening;
        button.setAttribute("aria-expanded", String(opening));
        if (opening) panel.scrollIntoView({behavior: "smooth", block: "start"});
    });
})();
