'use client';

import { MORPHEME_COLORS, type MorphemeToken } from '@/lib/hangul';
import { cn } from '@/lib/utils';

interface MorphemeBreakdownProps {
    morphemes: MorphemeToken[];
    className?: string;
}

const TYPE_LABELS: Record<string, string> = {
    verb_stem: 'stem',
    noun_stem: 'noun',
    tense_marker: 'tense',
    aspect_ending: 'aspect',
    particle: 'particle',
    honorific_marker: 'honor',
    connector: 'connect',
    ending: 'ending',
    other: '',
};

export function MorphemeBreakdown({ morphemes, className }: MorphemeBreakdownProps) {
    if (!morphemes || morphemes.length === 0) return null;

    return (
        <div className={cn('flex flex-wrap gap-2 items-end', className)}>
            {morphemes.map((m, i) => {
                const colorClass = MORPHEME_COLORS[m.type] || MORPHEME_COLORS.other;
                const label = m.label || TYPE_LABELS[m.type] || m.type;
                return (
                    <div key={i} className={cn('morpheme-badge', colorClass)}>
                        <span
                            className="morpheme-text korean"
                            lang="ko"
                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                        >
                            {m.morpheme}
                        </span>
                        {label && (
                            <span className="morpheme-label">{label}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
