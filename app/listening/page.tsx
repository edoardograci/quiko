'use client';

import { useLang } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Headphones, ExternalLink, PlaySquare, Youtube } from 'lucide-react';

const CHANNELS = [
    {
        name: 'Korean with Miss Vicky',
        handle: '@KoreanwithMissVicky',
        url: 'https://www.youtube.com/@KoreanwithMissVicky/',
        descriptionKo: '명확하고 체계적인 한국어 수업. 자연스러운 발음과 문법에 집중.',
        descriptionEn: 'Clear, structured Korean lessons with focus on natural speech and grammar.',
        level: 'Beginner → Intermediate',
        initial: 'V',
        color: 'bg-rose-500',
    },
    {
        name: 'Delicious Korean',
        handle: '@delicious_korean',
        url: 'https://www.youtube.com/@delicious_korean',
        descriptionKo: '일상 주제로 배우는 재미있는 한국어. 회화 중심.',
        descriptionEn: 'Fun Korean learning through everyday topics and conversational Korean.',
        level: 'Beginner → Intermediate',
        initial: 'D',
        color: 'bg-orange-500',
    },
    {
        name: 'Talk To Me In Korean',
        handle: '@talktomeinkorean',
        url: 'https://www.youtube.com/@talktomeinkorean',
        descriptionKo: '가장 포괄적인 한국어 채널. 문법, 어휘, 듣기, 문화까지.',
        descriptionEn: 'The most comprehensive Korean learning channel — grammar, vocab, listening, and culture.',
        level: 'All levels',
        initial: 'T',
        color: 'bg-blue-500',
    },
];

const PLAYLISTS = [
    {
        name: 'Miss Vicky — Beginner Series',
        url: 'https://youtube.com/playlist?list=PLbId6d40sjCHwYuXDXqSc0N4dK8W8O7C3',
        channel: 'Korean with Miss Vicky',
        descriptionKo: '필수 문법과 어휘를 다루는 단계별 초급 한국어 수업.',
        descriptionEn: 'Step-by-step beginner Korean covering essential grammar and vocabulary.',
        level: 'Beginner',
        thumbnailVideoId: 'Q4OVBRQx7gE',
    },
    {
        name: 'Delicious Korean — Core Playlist',
        url: 'https://youtube.com/playlist?list=PLECz2rpRD3Z2HlzJ3YqVmQcA5AFV7anxz',
        channel: 'Delicious Korean',
        descriptionKo: '일상 상황을 위한 자연스러운 한국어 대화와 설명.',
        descriptionEn: 'Natural Korean conversations and explanations for everyday situations.',
        level: 'Beginner',
        thumbnailVideoId: null,
    },
    {
        name: 'Miss Vicky — Intermediate Series',
        url: 'https://youtube.com/playlist?list=PLbId6d40sjCFv1TP8T0EYDDAZG5s2s2NP',
        channel: 'Korean with Miss Vicky',
        descriptionKo: '더 복잡한 문법 패턴과 자연스러운 표현으로 레벨업.',
        descriptionEn: 'Level up with more complex grammar patterns and natural speech.',
        level: 'Intermediate',
        thumbnailVideoId: null,
    },
];

const LEVEL_COLORS: Record<string, string> = {
    'Beginner': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'All levels': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    'Beginner → Intermediate': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
};

export default function ListeningPage() {
    const { lang, t } = useLang();

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1
                    className="text-xl font-semibold flex items-center gap-2"
                    lang={lang}
                    style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                >
                    <Headphones className="w-5 h-5 text-primary" />
                    {t({ ko: '듣기 연습', en: 'Listening Practice' })}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {t({ ko: '추천 유튜브 채널과 재생목록', en: 'Recommended YouTube channels and playlists' })}
                </p>
            </div>

            {/* Channels */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t({ ko: '추천 채널', en: 'Recommended Channels' })}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {CHANNELS.map((ch) => (
                        <a
                            key={ch.handle}
                            href={ch.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block group"
                        >
                            <Card className="p-5 gap-3 h-full hover:border-primary/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full ${ch.color} flex items-center justify-center text-white font-bold text-base shrink-0`}>
                                        {ch.initial}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                                            {ch.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{ch.handle}</p>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                </div>
                                <p
                                    className="text-xs text-muted-foreground leading-relaxed"
                                    lang={lang}
                                    style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                                >
                                    {t({ ko: ch.descriptionKo, en: ch.descriptionEn })}
                                </p>
                                <div>
                                    <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[ch.level] ?? ''}`}>
                                        {ch.level}
                                    </span>
                                </div>
                            </Card>
                        </a>
                    ))}
                </div>
            </section>

            {/* Playlists */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <PlaySquare className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t({ ko: '추천 재생목록', en: 'Recommended Playlists' })}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLAYLISTS.map((pl) => (
                        <a
                            key={pl.url}
                            href={pl.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block group"
                        >
                            <Card className="overflow-hidden p-0 gap-0 h-full hover:border-primary/40 transition-colors">
                                {/* Thumbnail */}
                                <div className="relative aspect-video w-full bg-muted overflow-hidden rounded-t-xl">
                                    {pl.thumbnailVideoId ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${pl.thumbnailVideoId}/mqdefault.jpg`}
                                            alt={pl.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <PlaySquare className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>

                                {/* Info */}
                                <div className="p-4 flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                                            {pl.name}
                                        </p>
                                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{pl.channel}</p>
                                    <p
                                        className="text-xs text-muted-foreground leading-relaxed"
                                        lang={lang}
                                        style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                                    >
                                        {t({ ko: pl.descriptionKo, en: pl.descriptionEn })}
                                    </p>
                                    <div>
                                        <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[pl.level] ?? ''}`}>
                                            {pl.level}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
}