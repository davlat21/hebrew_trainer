(function (global) {
    "use strict";
    global.createVoiceTrainer = function (records, random = Math.random) {
        const base = records.map((_, i) => i);
        let order = base.slice(), position = 0, side = 'russian', active = false;
        const used = new Set([order.join(',')]);
        function snapshot() { return { active, position, side, count: order.length, order: order.slice(), record: records[order[position]] }; }
        function command(name) {
            if (name === 'END') { active = false; return snapshot(); }
            if (!records.length) return snapshot();
            if (name === 'MIX') {
                let candidate, key, attempts = 0;
                do {
                    candidate = base.slice();
                    for (let i = candidate.length - 1; i > 0; i--) {
                        const j = Math.floor(random() * (i + 1));
                        [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
                    }
                    key = candidate.join(',');
                } while (used.has(key) && ++attempts < 100);
                if (used.has(key)) throw new Error('Не удалось получить новый порядок. Повторите MIX.');
                used.add(key); order = candidate;
            } else if (name === 'BASE') order = base.slice();
            else if (name === 'NEXT') {
                if (!active) return snapshot();
                if (side === 'russian') side = 'hebrew';
                else if (position + 1 < order.length) { position++; side = 'russian'; }
                else { active = false; return snapshot(); }
                return snapshot();
            } else if (!['START', 'NEW'].includes(name)) return snapshot();
            position = 0; side = 'russian'; active = true;
            return snapshot();
        }
        return Object.freeze({ command, snapshot });
    };
})(window);
