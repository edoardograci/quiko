'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Delete, Space, CornerDownLeft } from 'lucide-react';

// 두벌식 Layout
const ROWS = [
    [
        { normal: 'ㅂ', shift: 'ㅃ' },
        { normal: 'ㅈ', shift: 'ㅉ' },
        { normal: 'ㄷ', shift: 'ㄸ' },
        { normal: 'ㄱ', shift: 'ㄲ' },
        { normal: 'ㅅ', shift: 'ㅆ' },
        { normal: 'ㅛ', shift: 'ㅛ', isVowel: true },
        { normal: 'ㅕ', shift: 'ㅕ', isVowel: true },
        { normal: 'ㅑ', shift: 'ㅑ', isVowel: true },
        { normal: 'ㅐ', shift: 'ㅒ', isVowel: true },
        { normal: 'ㅔ', shift: 'ㅖ', isVowel: true },
    ],
    [
        { normal: 'ㅁ', shift: 'ㅁ' },
        { normal: 'ㄴ', shift: 'ㄴ' },
        { normal: 'ㅇ', shift: 'ㅇ' },
        { normal: 'ㄹ', shift: 'ㄹ' },
        { normal: 'ㅎ', shift: 'ㅎ' },
        { normal: 'ㅗ', shift: 'ㅗ', isVowel: true },
        { normal: 'ㅓ', shift: 'ㅓ', isVowel: true },
        { normal: 'ㅏ', shift: 'ㅏ', isVowel: true },
        { normal: 'ㅣ', shift: 'ㅣ', isVowel: true },
    ],
    [
        { normal: 'ㅋ', shift: 'ㅋ' },
        { normal: 'ㅌ', shift: 'ㅌ' },
        { normal: 'ㅊ', shift: 'ㅊ' },
        { normal: 'ㅍ', shift: 'ㅍ' },
        { normal: 'ㅠ', shift: 'ㅠ', isVowel: true },
        { normal: 'ㅜ', shift: 'ㅜ', isVowel: true },
        { normal: 'ㅡ', shift: 'ㅡ', isVowel: true },
    ],
];

interface HangulKeyboardProps {
    onJamo: (jamo: string) => void;
    onBackspace: () => void;
    onSpace: () => void;
    onEnter: () => void;
    className?: string;
}

export function HangulKeyboard({ onJamo, onBackspace, onSpace, onEnter, className }: HangulKeyboardProps) {
    const [isShift, setIsShift] = useState(false);

    const handleKey = (jamo: string) => {
        onJamo(jamo);
        if (isShift) setIsShift(false);
    };

    return (
        <div className={cn('select-none p-3 bg-muted/50 rounded-xl border border-border', className)}>
            {ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-1.5 mb-1.5">
                    {rowIdx === 2 && (
                        <button
                            onPointerDown={(e) => { e.preventDefault(); setIsShift(s => !s); }}
                            className={cn(
                                'hangul-key px-3 font-mono text-xs',
                                isShift ? 'bg-primary/20 border-primary/50 text-primary' : ''
                            )}
                            aria-label="Shift"
                        >
                            ⇧
                        </button>
                    )}
                    {row.map((key, keyIdx) => (
                        <button
                            key={keyIdx}
                            onPointerDown={(e) => { e.preventDefault(); handleKey(isShift ? key.shift : key.normal); }}
                            className={cn('hangul-key', key.isVowel && 'vowel')}
                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                        >
                            {isShift ? key.shift : key.normal}
                            {isShift && key.shift !== key.normal && (
                                <span className="text-[8px] text-muted-foreground ml-0.5">{key.normal}</span>
                            )}
                        </button>
                    ))}
                    {rowIdx === 2 && (
                        <button
                            onPointerDown={(e) => { e.preventDefault(); onBackspace(); }}
                            className="hangul-key px-3"
                            aria-label="Backspace"
                        >
                            <Delete className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}

            {/* Bottom row: space + enter */}
            <div className="flex gap-1.5 justify-center mt-1.5">
                <button
                    onPointerDown={(e) => { e.preventDefault(); onSpace(); }}
                    className="hangul-key flex-1 max-w-[240px] text-xs text-muted-foreground"
                >
                    <Space className="w-4 h-4 mr-1" />
                    띄어쓰기
                </button>
                <button
                    onPointerDown={(e) => { e.preventDefault(); onEnter(); }}
                    className="hangul-key px-4 text-xs bg-primary/10 border-primary/30 text-primary"
                >
                    <CornerDownLeft className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
