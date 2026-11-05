(function () {
    'use strict';
    const toggle = document.getElementById('headsetEnable');
    const status = document.getElementById('headsetStatus');
    const session = navigator.mediaSession;
    let enabled = false, received = 0, last = -Infinity;
    const registered = [];
    function state(value) { try { session.playbackState = value; } catch (_) {} }
    function clear() {
        registered.splice(0).forEach(action => { try { session.setActionHandler(action, null); } catch (_) {} });
        if (session) { state('none'); try { session.metadata = null; } catch (_) {} }
        enabled = false;
    }
    function next() {
        if (!enabled || performance.now() - last < 400) return;
        last = performance.now(); received++;
        status.textContent = 'Получено нажатий: ' + received + '. Команда: NEXT.';
        window.dispatchEvent(new CustomEvent('headset-next'));
    }
    toggle.addEventListener('change', function () {
        clear();
        if (!toggle.checked) { status.textContent = 'Управление наушником выключено.'; return; }
        if (!session || typeof session.setActionHandler !== 'function') {
            toggle.checked = false; status.textContent = 'Браузер не поддерживает управление медиакнопками.'; return;
        }
        ['play','pause','nexttrack'].forEach(action => {
            try { session.setActionHandler(action, next); registered.push(action); } catch (_) {}
        });
        try { session.setActionHandler('stop', () => document.querySelector('[data-voice-command="END"]').click()); registered.push('stop'); } catch (_) {}
        if (!registered.includes('play') && !registered.includes('pause')) {
            clear(); toggle.checked = false; status.textContent = 'Этот браузер не принимает Play/Pause.'; return;
        }
        enabled = true; received = 0; last = -Infinity;
        status.textContent = 'Режим включён. Нажмите START на странице, затем Play/Pause на наушнике. Получено нажатий: 0.';
        // No silent audio or artificial background keepalive: delivery depends on the browser.
    });
    window.addEventListener('trainer-speaking', function (event) {
        if (!enabled) return;
        try {
            if (event.detail.text && window.MediaMetadata) session.metadata = new window.MediaMetadata({title: event.detail.text, artist: 'Hebrew Trainer'});
        } catch (_) {}
        state(event.detail.playing ? 'playing' : 'paused');
    });
    window.addEventListener('headset-result', function (event) {
        if (!enabled) return;
        const messages = {
            busy: 'Дождитесь окончания произношения и нажмите снова.',
            idle: 'Сначала нажмите START на странице.',
            accepted: 'NEXT выполнен.',
            finished: 'Все слова пройдены. Нажмите NEW или START на странице.'
        };
        status.textContent = 'Получено нажатий: ' + received + '. ' + (messages[event.detail.result] || '');
    });
    window.addEventListener('trainer-command', function (event) {
        if (event.detail.name === 'END' && enabled) {
            clear(); toggle.checked = false; status.textContent = 'Управление наушником выключено после END.';
        }
    });
    window.addEventListener('pagehide', function () { clear(); toggle.checked = false; status.textContent = 'Управление наушником выключено.'; });
})();
