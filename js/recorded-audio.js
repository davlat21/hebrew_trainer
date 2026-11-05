(function () {
    'use strict';
    const audio = document.getElementById('recordedAudio');
    const mode = document.getElementById('audioMode');
    const info = document.getElementById('audioFilesStatus');
    const manifest = window.TRAINER_AUDIO_MANIFEST;
    const records = window.GeneralHebrewRussianDatabase.getAll();
    const valid = manifest && manifest.ready === true && Array.isArray(manifest.records) &&
        manifest.records.length === records.length && manifest.records.every((r, i) =>
            r.russian === records[i].russian && r.hebrew === records[i].hebrew &&
            /^audio\/[a-f0-9]{64}\.mp3$/.test(r.ru) && /^audio\/[a-f0-9]{64}\.mp3$/.test(r.he));
    let current = null;
    if (valid) mode.value = 'files';
    else mode.querySelector('option[value="files"]').disabled = true;
    if (!valid) info.textContent = 'Аудиобаза ещё не подготовлена. На компьютере запустите PREPARE_AUDIO_WINDOWS.cmd из архива.';
    else info.textContent = 'Аудиобаза готова: ' + records.length + ' записей. Фоновую работу проверьте на iPhone.';
    function abort(reset = true) {
        current = null; audio.onended = audio.onerror = audio.onpause = null;
        audio.pause();
        if (reset) { audio.removeAttribute('src'); audio.load(); }
    }
    mode.addEventListener('change', function () {
        document.querySelector('[data-voice-command="END"]').click();
        if (mode.value === 'files' && !valid) {
            mode.value = 'speech';
            info.textContent = 'Сначала подготовьте MP3 на компьютере. Сейчас оставлено обычное озвучивание.';
        }
    });
    window.RecordedTrainerAudio = Object.freeze({
        get selected() { return mode.value === 'files'; },
        get ready() { return !!valid; },
        stop: abort,
        prime: function () {
            if (!valid || mode.value !== 'files' || current || audio.getAttribute('src')) return;
            // Unlock this same media element during the user's microphone-button tap.
            audio.src = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==';
            try { const result = audio.play(); if (result && result.catch) result.catch(() => {}); } catch (_) {}
        },
        play: function (state, done, failed) {
            abort(false);
            if (!valid) { failed('Аудиобаза не подготовлена.'); return; }
            const record = manifest.records[state.order[state.position]];
            const entry = {record, side: state.side, done, failed};
            current = entry;
            audio.src = state.side === 'russian' ? record.ru : record.he;
            audio.preload = 'auto';
            audio.onended = function () {
                if (current !== entry) return;
                current = null; done();
            };
            audio.onerror = function () {
                if (current !== entry) return;
                current = null;
                failed('Не удалось загрузить MP3. Проверьте, загружена ли папка audio на GitHub. Нажмите «Повторить слово».');
            };
            audio.onpause = function () {
                if (current !== entry || audio.ended || audio.error) return;
                // A call, audio focus change, or the visible player's Pause must not leave NEXT blocked.
                current = null;
                failed('Воспроизведение приостановлено. Нажмите «Повторить слово».');
            };
            try {
                const result = audio.play();
                if (result && result.catch) result.catch(function (error) {
                    if (current !== entry) return;
                    current = null;
                    failed(error.name === 'NotAllowedError' ? 'Браузер требует нажатия на странице. Нажмите «Повторить слово».' : 'Ошибка воспроизведения MP3. Нажмите «Повторить слово».');
                });
            } catch (_) { if (current === entry) { current = null; failed('Плеер недоступен.'); } }
        }
    });
})();
