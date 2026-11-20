(function () {
    'use strict';
    const byId = id => document.getElementById(id);
    const status = byId('voiceStatus'), card = byId('voiceWord'), detail = byId('voiceProgress');
    const mic = byId('voiceMic');
    const mode = byId('audioMode');
    const commands = ['START', 'NEXT', 'NEW', 'MIX', 'BASE', 'RESET', 'END'];
    if (!window.createVoiceTrainer || !window.GeneralHebrewRussianDatabase) {
        status.textContent = 'Не удалось загрузить новую базу. Обновите страницу.';
        mic.disabled = true;
        return;
    }
    const trainer = window.createVoiceTrainer(window.GeneralHebrewRussianDatabase.getAll());
    const synth = window.speechSynthesis;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null, enabled = false, speaking = false, recognitionTimer;
    let pendingSpeech = null, timer = null, generation = 0, failures = 0;
    let speechTimer = null, currentUtterance = null;
    function setSpeaking(value) {
        speaking = value;
        if (!value) window.dispatchEvent(new CustomEvent('trainer-speaking', {detail: {playing: false}}));
        document.querySelectorAll('[data-voice-command]').forEach(button => {
            button.disabled = value && button.dataset.voiceCommand !== 'END';
        });
        byId('voiceRepeat').disabled = value;
        mode.disabled = value;
    }
    const sayStatus = text => { status.textContent = text; };
    function scheduleListen() {
        clearTimeout(timer);
        if (enabled && !speaking) timer = setTimeout(listen, 350);
    }
    function listen() {
        if (!enabled || speaking || recognition || !Recognition) return;
        const session = new Recognition();
        recognition = session;
        session.lang = 'en-US';
        session.continuous = false;
        session.interimResults = false;
        session.onstart = function () {
            if (recognition !== session) return;
            clearTimeout(recognitionTimer);
            if (speaking || !enabled) stopRecognition();
            else sayStatus('Слушаю: ' + commands.join(', '));
        };
        session.onend = () => finishRecognition(session);
        session.onresult = function (event) {
            if (recognition !== session || !enabled || speaking) return;
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (!event.results[i].isFinal) continue;
                const text = event.results[i][0].transcript.trim().toUpperCase().replace(/[.!?,]/g, '');
                if (commands.includes(text)) {
                    failures = 0;
                    // The single-utterance session is ending. Arm recovery before the command
                    // queues playback so it can proceed even if Safari omits the end event.
                    waitForRecognitionEnd(session);
                    command(text);
                } else {
                    waitForRecognitionEnd(session);
                    sayStatus('Не распознана команда: ' + text + '. Повторите команду.');
                }
                break;
            }
        };
        session.onerror = function (event) {
            if (recognition !== session) return;
            waitForRecognitionEnd(session);
            if (event.error !== 'aborted' && event.error !== 'no-speech') recognitionFailed(event.error);
        };
        recognitionTimer = setTimeout(() => {
            if (recognition !== session) return;
            recognitionFailed('start-timeout');
            if (recognition === session) stopRecognition();
        }, 8000);
        try { session.start(); }
        catch (error) {
            finishRecognition(session);
            recognitionFailed(error.name);
        }
    }
    function finishRecognition(session) {
        if (recognition !== session) return;
        clearTimeout(recognitionTimer);
        recognition = null;
        const run = pendingSpeech;
        pendingSpeech = null;
        if (run) run();
        else scheduleListen();
    }
    function waitForRecognitionEnd(session) {
        clearTimeout(recognitionTimer);
        recognitionTimer = setTimeout(() => {
            try { session.abort(); } catch (_) {}
            finishRecognition(session);
        }, 1500);
    }
    function stopRecognition() {
        const session = recognition;
        if (!session) return;
        waitForRecognitionEnd(session);
        try { session.abort(); } catch (_) { finishRecognition(session); }
    }
    function recognitionFailed(error) {
        if (['not-allowed', 'service-not-allowed', 'audio-capture', 'NotAllowedError'].includes(error) || ++failures >= 3) {
            stopMic();
            sayStatus('Микрофон недоступен. Проверьте разрешение и подключение, затем включите микрофон снова.');
        } else {
            sayStatus('Ошибка распознавания. Перезапускаю микрофон…');
        }
    }
    function stopMic() {
        enabled = false; clearTimeout(timer); mic.textContent = 'Включить микрофон';
        stopRecognition();
    }
    function speakCurrent(state) {
        generation++;
        const token = generation;
        pendingSpeech = null; clearTimeout(speechTimer); setSpeaking(true);
        if (synth) synth.cancel();
        if (window.RecordedTrainerAudio) window.RecordedTrainerAudio.stop();
        const run = function () {
            if (token !== generation) return;
            if (window.RecordedTrainerAudio && window.RecordedTrainerAudio.selected) {
                // Do not impose the browser-speech watchdog on a real media element in the background.
                clearTimeout(speechTimer);
                sayStatus('Воспроизвожу MP3…');
                window.dispatchEvent(new CustomEvent('trainer-speaking', {detail: {text: state.record[state.side], playing: true}}));
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
            setSpeaking(false); if (synth) synth.cancel();
            sayStatus('Озвучивание не завершилось. Используйте RESET, чтобы повторить слово.');
            scheduleListen();
        }, 30000);
        // Wait for microphone shutdown so synthesized speech cannot become a command.
        if (recognition) {
            pendingSpeech = run;
            stopRecognition();
        }
        else run();
    }
    function command(name) {
        if (speaking && name !== 'END') return;
        let state;
        try { state = trainer.command(name); } catch (error) { sayStatus(error.message); return; }
        if (name === 'END') {
            generation++; clearTimeout(speechTimer); currentUtterance = null; setSpeaking(false); pendingSpeech = null;
            if (synth) synth.cancel();
            if (window.RecordedTrainerAudio) window.RecordedTrainerAudio.stop();
            window.dispatchEvent(new CustomEvent('trainer-command', {detail: {name}}));
            card.textContent = 'Нажмите или скажите START';
            card.lang = 'ru'; card.dir = 'ltr';
            detail.textContent = 'База: ' + state.count + ' записей';
            sayStatus('Занятие завершено. Скажите или нажмите START.');
            scheduleListen();
            return;
        }
        if (!state.playback) {
            if (name === 'START' && state.active) {
                card.textContent = 'Скажите или нажмите NEXT';
                card.lang = 'ru'; card.dir = 'ltr';
                detail.textContent = '0 / ' + state.count;
                sayStatus('Занятие началось. NEXT — первое слово на иврите.');
            } else if (name === 'RESET' && state.active) {
                sayStatus('Сначала произнесите или нажмите NEXT.');
            } else {
                sayStatus(state.finished ? 'Все слова пройдены. NEW — начать заново.' : 'Скажите START или нажмите START.');
            }
            return;
        }
        const word = state.playback;
        card.textContent = word.record[word.side]; card.lang = word.side === 'russian' ? 'ru' : 'he'; card.dir = word.side === 'russian' ? 'ltr' : 'rtl';
        detail.textContent = (word.position + 1) + ' / ' + word.count + ' · ' + (word.side === 'russian' ? 'Русский' : 'Иврит');
        speakCurrent(word);
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
    byId('voiceRepeat').addEventListener('click', () => command('RESET'));
    if (!Recognition) { mic.disabled = true; sayStatus('Голосовые команды недоступны в этом браузере. Используйте кнопки.'); }
    mic.addEventListener('click', function () {
        if (enabled) { stopMic(); sayStatus('Микрофон выключен.'); }
        else { enabled = true; failures = 0; mic.textContent = 'Выключить микрофон'; listen(); }
    });
    document.querySelectorAll('[data-voice-command]').forEach(button => button.addEventListener('click', () => command(button.dataset.voiceCommand)));
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState !== 'visible' || !enabled || speaking) return;
        if (recognition) stopRecognition();
        else scheduleListen();
    });
    window.addEventListener('pagehide', function () { generation++; trainer.command('END'); clearTimeout(speechTimer); currentUtterance = null; pendingSpeech = null; setSpeaking(false); stopMic(); if (window.RecordedTrainerAudio) window.RecordedTrainerAudio.stop(); if (synth) synth.cancel(); });
})();
