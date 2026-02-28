'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface KoreanTextProps {
    text: string;
    enableHover?: boolean;
    className?: string;
    onWordClick?: (word: string) => void;
}

export function KoreanText({ text, enableHover = false, className, onWordClick }: KoreanTextProps) {
    const tokens = text.split(/(\s+)/);

    return (
        <span
            className={cn("korean inline-block", className)}
            lang="ko"
            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
        >
            {tokens.map((token, i) => {
                const isWhitespace = /^\s+$/.test(token);
                if (isWhitespace) return <span key={i}>{token}</span>;

                return (
                    <KoreanWordToken
                        key={i}
                        word={token}
                        enableHover={enableHover}
                        onClick={() => onWordClick?.(token)}
                    />
                );
            })}
        </span>
    );
}

function KoreanWordToken({ word, enableHover, onClick }: { word: string, enableHover: boolean, onClick: () => void }) {
    const [gloss, setGloss] = useState<{ dictForm: string; defEn: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasAttempted, setHasAttempted] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (!enableHover || hasAttempted || gloss) return;

        timeoutRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                // Strip punctuation
                const cleanWord = word.replace(/[.,!?()[\]{}"']/g, '');
                if (!cleanWord) return;

                const res = await fetch(`/api/words/lookup/local?q=${encodeURIComponent(cleanWord)}`);
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    const first = data.results[0];
                    setGloss({
                        dictForm: first.hangul,
                        defEn: first.definitions?.[0]?.definition_en || first.notes || ''
                    });
                }
            } catch (e) {
                // ignore
            } finally {
                setLoading(false);
                setHasAttempted(true);
            }
        }, 300); // debounce 300ms
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    return (
        <span
            className="group relative cursor-text outline-none focus:bg-primary/20 selection:bg-primary/30"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                if (window.getSelection()?.toString().length === 0) {
                    onClick();
                }
            }}
        >
            {word}
            {enableHover && gloss && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    <span className="font-bold">{gloss.dictForm}</span>
                    {gloss.defEn && <span>: {gloss.defEn}</span>}
                </div>
            )}
        </span>
    );
}
