(function () {
    'use strict';
    const byId = id => document.getElementById(id);
    const status = byId('voiceStatus'), card = byId('voiceWord'), detail = byId('voiceProgress');
    const mic = byId('voiceMic');
    if (!window.createVoiceTrainer || !window.GeneralHebrewRussianDatabase) {
        status.textContent = 'Не удалось загрузить новую базу. Обновите страницу.';
        mic.disabled = true;
        return;
    }
    const trainer = window.createVoiceTrainer(window.GeneralHebrewRussianDatabase.getAll());
    const synth = window.speechSynthesis;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null, listening = false, starting = false, enabled = false, speaking = false;
    let pendingSpeech = null, timer = null, generation = 0, failures = 0;
    let speechTimer = null, currentUtterance = null, releaseTimer = null;
    let input = null, micRequest = 0, recognitionTimer = null;
    function setAudioMode(type) {
        try { if (navigator.audioSession) navigator.audioSession.type = type; } catch (_) {}
    }
    function recognitionWatchdog(ms, message) {
        clearTimeout(recognitionTimer);
        recognitionTimer = setTimeout(() => {
            if (!enabled || speaking) return;
            stopMic();
            sayStatus(message);
        }, ms);
    }
    const commands = new Set(['START', 'NEXT', 'NEW', 'MIX', 'BASE', 'END']);
    function decode(text) {
        const word = text.trim().toUpperCase().replace(/[.!?,;:]+$/g, '').trim();
        return commands.has(word) ? word : null;
    }
    function flushPendingSpeech() {
        clearTimeout(releaseTimer);
        const run = pendingSpeech;
        pendingSpeech = null;
        if (run) run();
    }
    function abortRecognition() {
        try { recognition.abort(); } catch (_) {}
    }
    function setSpeaking(value) {
        speaking = value;
        if (!value) window.dispatchEvent(new CustomEvent('trainer-speaking', {detail: {playing: false}}));
        document.querySelectorAll('[data-voice-command]').forEach(button => {
            button.disabled = value && button.dataset.voiceCommand !== 'END';
        });
        byId('voiceRepeat').disabled = value;
    }
    const sayStatus = text => { status.textContent = text; };
    function scheduleListen() {
        clearTimeout(timer);
        if (enabled && !speaking) timer = setTimeout(listen, 350);
    }
    function listen() {
        if (!enabled || speaking || listening || starting || !recognition) return;
        setAudioMode('play-and-record');
        recognitionWatchdog(8000, 'Safari не запустил распознавание. Проверьте, включена ли Siri и разрешён ли микрофон для сайта.');
        try { starting = true; recognition.start(); }
        catch (error) { stopMic(); sayStatus('Не удалось запустить распознавание: ' + error.name + '. Включите микрофон снова.'); }
    }
    function stopMic() {
        enabled = false; micRequest++;
        clearTimeout(timer); clearTimeout(recognitionTimer);
        mic.textContent = 'Включить микрофон';
        if (recognition && (listening || starting)) abortRecognition();
        starting = listening = false;
        if (input) { input.getTracks().forEach(track => track.stop()); input = null; }
        setAudioMode('auto');
    }
    function speakCurrent(state) {
        generation++; clearTimeout(releaseTimer);
        const token = generation;
        pendingSpeech = null; clearTimeout(recognitionTimer); clearTimeout(speechTimer); setSpeaking(true);
        if (synth) synth.cancel();
        const run = function () {
            if (token !== generation) return;
            if (window.RecordedTrainerAudio && window.RecordedTrainerAudio.selected) {
                // Do not impose the browser-speech watchdog on a real media element in the background.
                clearTimeout(speechTimer);
                sayStatus('Воспроизвожу MP3…');
                window.dispatchEvent(new CustomEvent('trainer-speaking', {detail: {text: state.record[state.side], playing: true}}));
                setAudioMode(enabled ? 'play-and-record' : 'playback');
                window.RecordedTrainerAudio.play(state, function () {
                    if (token !== generation) return;
                    setSpeaking(false); sayStatus('Ожидаю NEXT.'); scheduleListen();
                }, function (message) {
                    if (token !== generation) return;
                    setSpeaking(false); sayStatus(message); scheduleListen();
                });
                return;
            }
            if (!synth || !window.SpeechSynthesisUtterance) {
                clearTimeout(speechTimer); setSpeaking(false); sayStatus('Озвучивание недоступно в этом браузере.'); scheduleListen(); return;
            }
            const utterance = new window.SpeechSynthesisUtterance(state.record[state.side]);
            currentUtterance = utterance;
            utterance.lang = state.side === 'russian' ? 'ru-RU' : 'he-IL';
            const prefix = state.side === 'russian' ? 'ru' : 'he';
            const voice = synth.getVoices().find(v => v.lang.toLowerCase().startsWith(prefix) || (prefix === 'he' && v.lang.toLowerCase().startsWith('iw')));
            if (voice) utterance.voice = voice;
            utterance.rate = 0.85;
            sayStatus('Произношу слово…');
            window.dispatchEvent(new CustomEvent('trainer-speaking', {detail: {text: utterance.text, playing: true}}));
            utterance.onend = function () {
                if (token !== generation) return;
                clearTimeout(speechTimer); currentUtterance = null;
                window.dispatchEvent(new CustomEvent('trainer-speaking', {detail: {playing: false}}));
                setSpeaking(false);
                sayStatus(enabled ? 'Ожидаю команду…' : 'Микрофон выключен. Можно использовать кнопки.');
                scheduleListen();
            };
            utterance.onerror = function () {
                if (token !== generation) return;
                clearTimeout(speechTimer); currentUtterance = null;
                window.dispatchEvent(new CustomEvent('trainer-speaking', {detail: {playing: false}}));
                setSpeaking(false);
                sayStatus('Не удалось озвучить слово. Проверьте наличие русского голоса и голоса иврита на устройстве.');
                scheduleListen();
            };
            try { synth.speak(utterance); }
            catch (error) { utterance.onerror(); }
        };
        // Recover if a browser never emits recognition.onend or utterance.onend.
        speechTimer = setTimeout(function () {
            if (token !== generation) return;
            generation++; pendingSpeech = null; currentUtterance = null;
            setSpeaking(false); stopMic(); if (synth) synth.cancel();
            sayStatus('Озвучивание не завершилось. Нажмите «Повторить слово»; микрофон можно включить снова.');
        }, 30000);
        // Wait for microphone shutdown so synthesized speech cannot become a command.
        if (recognition && (listening || starting)) {
            pendingSpeech = run;
            releaseTimer = setTimeout(function () {
                starting = listening = false;
                flushPendingSpeech();
            }, 850);
            abortRecognition();
        }
        else run();
    }
    function command(name) {
        window.dispatchEvent(new CustomEvent('trainer-command', {detail: {name}}));
        if (speaking && name !== 'END') return;
        let state;
        try { state = trainer.command(name); } catch (error) { sayStatus(error.message); return; }
        if (name === 'END') {
            generation++; clearTimeout(releaseTimer); clearTimeout(speechTimer); currentUtterance = null; setSpeaking(false); pendingSpeech = null;
            stopMic(); if (synth) synth.cancel(); if (window.RecordedTrainerAudio) window.RecordedTrainerAudio.stop(); sayStatus('Занятие завершено.'); return;
        }
        if (!state.active) {
            sayStatus(state.position === state.count - 1 ? 'Все слова пройдены. NEW — начать заново.' : 'Скажите START или нажмите START.');
            return;
        }
        card.textContent = state.record[state.side]; card.lang = state.side === 'russian' ? 'ru' : 'he'; card.dir = state.side === 'russian' ? 'ltr' : 'rtl';
        detail.textContent = (state.position + 1) + ' / ' + state.count + ' · ' + (state.side === 'russian' ? 'Русский' : 'Иврит');
        speakCurrent(state);
    }
    window.addEventListener('headset-next', function () {
        let result;
        if (speaking) result = 'busy';
        else if (!trainer.snapshot().active) result = 'idle';
        else {
            command('NEXT');
            result = trainer.snapshot().active ? 'accepted' : 'finished';
        }
        window.dispatchEvent(new CustomEvent('headset-result', {detail: {result}}));
    });
    byId('voiceRepeat').addEventListener('click', function () {
        const state = trainer.snapshot();
        if (state.active && !speaking) speakCurrent(state);
        else if (!state.active) sayStatus('Сначала нажмите START.');
    });
    try { if (Recognition) recognition = new Recognition(); } catch (_) {}
    if (recognition) {
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;
        recognition.onstart = function () {
            starting = false; listening = true;
            if (speaking || !enabled) abortRecognition();
            else {
                sayStatus('Слушаю: START, NEXT, NEW, MIX, BASE, END');
                recognitionWatchdog(25000, 'Safari не вернул результат. Включите микрофон снова; если повторится, проверьте Siri и попробуйте без гарнитуры.');
            }
        };
        recognition.onend = function () { clearTimeout(recognitionTimer); starting = false; listening = false; if (pendingSpeech) flushPendingSpeech(); else scheduleListen(); };
        recognition.onresult = function (event) {
            if (!enabled || speaking) return;
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (!event.results[i].isFinal) continue;
                const result = event.results[i];
                let name = null;
                for (let j = 0; j < result.length && !name; j++) name = decode(result[j].transcript);
                if (name) { failures = 0; command(name); break; }
                sayStatus('Услышал: «' + result[0].transcript.trim() + '». Повторите английскую команду.');
            }
        };
        recognition.onerror = function (event) {
            if (event.error === 'aborted') return;
            if (event.error === 'no-speech') return;
            if (['not-allowed','service-not-allowed','audio-capture'].includes(event.error) || ++failures >= 3) {
                stopMic(); sayStatus('Распознавание недоступно (' + event.error + '). Проверьте разрешение Safari на микрофон и подключение. Кнопки доступны.');
            } else sayStatus('Ошибка распознавания. Пробую подключиться снова…');
        };
    } else { mic.disabled = true; sayStatus('Голосовые команды недоступны в этом браузере. Используйте кнопки.'); }
    mic.addEventListener('click', async function () {
        if (enabled) { stopMic(); sayStatus('Микрофон выключен.'); return; }
        if (!recognition) return;
        const request = ++micRequest;
        enabled = true; failures = 0;
        mic.textContent = 'Выключить микрофон';
        sayStatus('Запрашиваю доступ к микрофону…');
        if (window.RecordedTrainerAudio) window.RecordedTrainerAudio.prime();
        setAudioMode('play-and-record');
        try {
            // Hold capture across short audio replies to keep WebKit's input session alive.
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({audio: true});
                if (request !== micRequest) { stream.getTracks().forEach(track => track.stop()); return; }
                input = stream;
            }
            listen();
        } catch (error) {
            if (request !== micRequest) return;
            stopMic(); sayStatus('Микрофон недоступен (' + error.name + '). Проверьте разрешение для сайта.');
        }
    });
    document.querySelectorAll('[data-voice-command]').forEach(button => button.addEventListener('click', () => command(button.dataset.voiceCommand)));
    window.addEventListener('pagehide', function () { if (window.RecordedTrainerAudio) window.RecordedTrainerAudio.stop(); generation++; clearTimeout(releaseTimer); clearTimeout(speechTimer); currentUtterance = null; pendingSpeech = null; setSpeaking(false); stopMic(); if (synth) synth.cancel(); });
})();
