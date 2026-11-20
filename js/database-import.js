// Добавление русского слова из общей базы без догадок и исправления источника.
let pendingDatabaseChoice = false;

function isRussianDatabaseQuery(text) {
    return /^[А-Яа-яЁё]+(?:[-‐‑][А-Яа-яЁё]+)*$/.test(String(text || '').trim());
}

function hideDatabaseChoices() {
    pendingDatabaseChoice = false;
    const panel = document.getElementById('databaseChoices');
    if (panel) { panel.hidden = true; panel.replaceChildren(); }
}

function addRussianFromDatabase(query, afterSave) {
    hideDatabaseChoices();
    const matches = window.HebrewRussianDatabase.findRussian(query);
    if (!matches.length) {
        showImportMessage('Слово «' + query + '» пока не найдено в базе. Добавь его вместе с ивритом и транскрипцией.', 'warning');
        return false;
    }
    function save(entry) {
        if (saveCheckedWord(entry)) {
            hideDatabaseChoices();
            afterSave();
        }
    }
    if (matches.length === 1) { save(matches[0]); return true; }
    const panel = document.getElementById('databaseChoices');
    panel.hidden = false;
    pendingDatabaseChoice = true;
    const title = document.createElement('p');
    title.textContent = 'Найдено несколько вариантов. Выбери нужный:';
    panel.appendChild(title);
    matches.forEach(function (entry) {
        const button = document.createElement('button');
        button.type = 'button';
        const hebrew = document.createElement('bdi');
        hebrew.dir = 'rtl'; hebrew.textContent = entry.hebrew;
        button.append(hebrew, document.createTextNode(' — ' + entry.transcription + ' — ' + entry.russian));
        button.addEventListener('click', function () { if (pendingDatabaseChoice) save(entry); });
        panel.appendChild(button);
    });
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.textContent = 'Отмена';
    cancel.addEventListener('click', hideDatabaseChoices);
    panel.appendChild(cancel);
    showImportMessage('Выбери перевод из базы.', 'warning');
    return true;
}

// При изменении ввода старые варианты больше не применяются.
[hebrewInput, transcriptionInput, russianInput, quickInput].forEach(function (input) {
    input.addEventListener('input', hideDatabaseChoices);
});
