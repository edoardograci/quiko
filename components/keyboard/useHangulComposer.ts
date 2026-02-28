'use client';

import { useState, useCallback } from 'react';

// es-hangul assemble/disassemble
let _esHangul: { assemble: (str: string) => string; disassemble: (str: string, grouped?: boolean) => string[] } | null = null;

async function getEsHangul() {
    if (!_esHangul) {
        const mod = await import('es-hangul');
        _esHangul = { assemble: mod.assemble, disassemble: mod.disassemble };
    }
    return _esHangul;
}

export function useHangulComposer(onChange: (value: string) => void) {
    const [jamo, setJamo] = useState<string[]>([]);

    const insertJamo = useCallback(async (j: string) => {
        const { assemble } = await getEsHangul();
        setJamo(prev => {
            const newJamo = [...prev, j];
            // assemble expects a string
            const assembled = assemble(newJamo.join(''));
            onChange(assembled);
            return newJamo;
        });
    }, [onChange]);

    const backspace = useCallback(async () => {
        const { assemble } = await getEsHangul();
        setJamo(prev => {
            if (prev.length === 0) return prev;
            const newJamo = prev.slice(0, -1);
            const assembled = newJamo.length > 0 ? assemble(newJamo.join('')) : '';
            onChange(assembled);
            return newJamo;
        });
    }, [onChange]);

    const reset = useCallback(() => {
        setJamo([]);
        onChange('');
    }, [onChange]);

    const setValue = useCallback(async (value: string) => {
        const { disassemble } = await getEsHangul();
        const newJamo = disassemble(value);
        setJamo(newJamo);
        onChange(value);
    }, [onChange]);

    return { insertJamo, backspace, reset, setValue, jamo };
}
