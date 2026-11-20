(function (global) {
    'use strict';

    global.createVoiceTrainer = function (records, random = Math.random) {
        const base = records.map((_, i) => i);
        const keyOf = order => order.join(',');
        const baseKey = keyOf(base);
        const combinations = base.reduce((count, index) => count * BigInt(index + 1), 1n);
        const used = new Set([baseKey]);
        let order = base, position = -1, side = null, active = false, finished = false;
        let last = null, fallback = base.slice();

        function nextPermutation(values) {
            let pivot = values.length - 2;
            while (pivot >= 0 && values[pivot] >= values[pivot + 1]) pivot--;
            let successor = values.length - 1;
            while (values[successor] <= values[pivot]) successor--;
            [values[pivot], values[successor]] = [values[successor], values[pivot]];
            for (let left = pivot + 1, right = values.length - 1; left < right; left++, right--) {
                [values[left], values[right]] = [values[right], values[left]];
            }
        }

        function mix() {
            const previous = keyOf(order);
            if (BigInt(used.size) === combinations) {
                used.clear();
                fallback = base.slice();
            }
            for (let attempt = 0; attempt < 32; attempt++) {
                const candidate = base.slice();
                for (let i = candidate.length - 1; i > 0; i--) {
                    const j = Math.floor(random() * (i + 1));
                    [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
                }
                const key = keyOf(candidate);
                if (!used.has(key) && (combinations === 1n || key !== previous)) {
                    used.add(key);
                    return candidate;
                }
            }
            for (let candidate = fallback.slice();;) {
                const key = keyOf(candidate);
                if (!used.has(key) && (key !== previous || BigInt(used.size) + 1n === combinations)) {
                    used.add(key);
                    return candidate;
                }
                // Keep the first unused order available for a later draw.
                nextPermutation(candidate);
                if (used.has(keyOf(fallback))) fallback = candidate.slice();
            }
        }

        function snapshot(playback = null) {
            return { active, finished, count: order.length, playback };
        }

        function advance() {
            if (side === 'hebrew') {
                side = 'russian';
            } else if (position + 1 < order.length) {
                position++;
                side = 'hebrew';
            } else {
                active = false;
                finished = true;
                return snapshot();
            }
            const index = order[position];
            last = { position, side, index, record: records[index], count: order.length };
            return snapshot(last);
        }

        function command(name) {
            if (name === 'END') {
                active = false;
                finished = false;
                last = null;
                return snapshot();
            }
            if (!records.length) return snapshot();
            if (name === 'RESET') return snapshot(last);
            if (name === 'NEXT') return active ? advance() : snapshot();
            if (name !== 'START' && !active && !finished) return snapshot();
            if (name === 'MIX') order = mix();
            else if (name === 'BASE') order = base;
            else if (name !== 'START' && name !== 'NEW') return snapshot();
            position = -1;
            side = null;
            last = null;
            finished = false;
            active = true;
            return name === 'START' ? snapshot() : advance();
        }

        return Object.freeze({ command, snapshot });
    };
})(window);
