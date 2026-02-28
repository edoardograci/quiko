'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { KoreanText } from '@/components/ui/korean-text';
import { ArrowLeft, Loader2, Play, Pause, Headphones, Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ListeningEpisode {
    id: number;
    title: string;
    series: string;
    level: string | null;
    episode_number: number | null;
    youtube_id: string;
    duration_seconds: number | null;
}

interface ListeningProgress {
    last_position_seconds: number;
    completed: number;
}

interface TranscriptSegment {
    id: number;
    episode_id: number;
    start_ms: number;
    end_ms: number;
    text: string;
}

declare global {
    interface Window {
        YT: typeof YT;
        onYouTubeIframeAPIReady: () => void;
    }
}

export default function ListeningEpisodePage({ params }: { params: Promise<{ id: string }> }) {
    const { lang, t } = useLang();
    const { id } = use(params);
    const episodeId = Number(id);

    const [episode, setEpisode] = useState<ListeningEpisode | null>(null);
    const [progress, setProgress] = useState<ListeningProgress | null>(null);
    const [segments, setSegments] = useState<TranscriptSegment[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingTranscript, setLoadingTranscript] = useState(true);
    const [transcriptError, setTranscriptError] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [ytInput, setYtInput] = useState('');
    const [isUpdatingYt, setIsUpdatingYt] = useState(false);

    const playerRef = useRef<YT.Player | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function fetchEpisode() {
            try {
                const res = await fetch(`/api/listening/${episodeId}`);
                if (!res.ok) {
                    setEpisode(null);
                    setProgress(null);
                    return;
                }
                const data = await res.json();
                setEpisode(data.episode);
                setProgress(data.progress);
            } finally {
                setLoading(false);
            }
        }
        fetchEpisode();
    }, [episodeId]);

    useEffect(() => {
        async function fetchTranscript() {
            try {
                setLoadingTranscript(true);
                setTranscriptError(null);
                const res = await fetch(`/api/listening/${episodeId}/transcript`);
                const data = await res.json();
                if (!res.ok || data.error) {
                    setTranscriptError(
                        data.error ?? t({ ko: '자막을 불러올 수 없어요', en: 'Transcript unavailable' }),
                    );
                    setSegments([]);
                    return;
                }
                setSegments(data.segments ?? []);
            } catch {
                setTranscriptError(
                    t({ ko: '자막을 불러올 수 없어요', en: 'Transcript unavailable' }),
                );
                setSegments([]);
            } finally {
                setLoadingTranscript(false);
            }
        }
        fetchTranscript();
    }, [episodeId, t]);

    const loadYouTubeAPI = () => {
        if (typeof window === 'undefined') return;
        if (window.YT && window.YT.Player) {
            createPlayer();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.body.appendChild(script);
        window.onYouTubeIframeAPIReady = () => {
            createPlayer();
        };
    };

    const createPlayer = () => {
        if (!episode || !episode.youtube_id) return;
        if (playerRef.current) return;

        playerRef.current = new window.YT.Player('yt-player', {
            videoId: episode.youtube_id,
            playerVars: {
                cc_load_policy: 1,
                cc_lang_pref: 'ko',
            },
            events: {
                onReady: (event: YT.PlayerEvent) => {
                    setPlayerReady(true);
                    if (progress && progress.last_position_seconds > 0) {
                        event.target.seekTo(progress.last_position_seconds, true);
                    }
                },
                onStateChange: (event: YT.OnStateChangeEvent) => {
                    const YTState = window.YT.PlayerState;
                    if (event.data === YTState.PLAYING) {
                        setIsPlaying(true);
                        startPolling();
                    } else if (event.data === YTState.PAUSED) {
                        setIsPlaying(false);
                        stopPolling();
                        void saveProgress(false);
                    } else if (event.data === YTState.ENDED) {
                        setIsPlaying(false);
                        stopPolling();
                        void saveProgress(true);
                    }
                },
            },
        });
    };

    const startPolling = () => {
        if (intervalRef.current || !playerRef.current) return;
        intervalRef.current = setInterval(() => {
            if (!playerRef.current || !segments || segments.length === 0) return;
            const currentTime = playerRef.current.getCurrentTime();
            const currentMs = currentTime * 1000;
            const idx = segments.findIndex(
                (s) => currentMs >= s.start_ms && currentMs < s.end_ms,
            );
            if (idx !== -1 && idx !== activeIndex) {
                setActiveIndex(idx);
                const el = document.getElementById(`seg-${segments[idx].id}`);
                if (el && transcriptContainerRef.current) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 500);
    };

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const saveProgress = async (completed: boolean) => {
        if (!playerRef.current) return;
        const position = playerRef.current.getCurrentTime();
        try {
            await fetch(`/api/listening/${episodeId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    position_seconds: position,
                    completed,
                }),
            });
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (episode && episode.youtube_id) {
            loadYouTubeAPI();
        }
    }, [episode]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            void saveProgress(false);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            stopPolling();
        };
    });

    if (loading) {
        return (
            <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!episode) {
        return (
            <div className="p-6 md:p-8 max-w-3xl mx-auto">
                <Link href="/listening">
                    <Button variant="ghost" className="mb-4 gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        {t({ ko: '뒤로', en: 'Back' })}
                    </Button>
                </Link>
                <Card className="p-6">
                    <p className="text-sm text-muted-foreground">
                        {t({ ko: '에피소드를 찾을 수 없어요.', en: 'Episode not found.' })}
                    </p>
                </Card>
            </div>
        );
    }

    if (!episode.youtube_id) {
        return (
            <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4">
                <Link href="/listening">
                    <Button variant="ghost" className="mb-2 gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        {t({ ko: '뒤로', en: 'Back' })}
                    </Button>
                </Link>
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                            <Headphones className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">
                                {t({ ko: 'YouTube ID 설정', en: 'Set YouTube ID' })}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {t({
                                    ko: '이 에피소드를 시청하려면 YouTube 비디오 ID 또는 URL이 필요합니다.',
                                    en: 'You need a YouTube Video ID or URL to watch this episode.',
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. https://www.youtube.com/watch?v=..."
                            value={ytInput}
                            onChange={(e) => setYtInput(e.target.value)}
                            className="bg-muted/50"
                            disabled={isUpdatingYt}
                        />
                        <Button
                            disabled={isUpdatingYt || !ytInput.trim()}
                            onClick={async () => {
                                setIsUpdatingYt(true);
                                try {
                                    const res = await fetch(`/api/listening/${episodeId}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ youtube_id: ytInput }),
                                    });
                                    if (res.ok) {
                                        const data = await res.json();
                                        setEpisode(data.episode);
                                        toast.success(t({ ko: 'YouTube ID가 설정되었습니다', en: 'YouTube ID set successfully' }));
                                    } else {
                                        const data = await res.json();
                                        toast.error(data.error || 'Failed to update');
                                    }
                                } catch {
                                    toast.error('Network error');
                                } finally {
                                    setIsUpdatingYt(false);
                                }
                            }}
                        >
                            {isUpdatingYt ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {t({ ko: '저장', en: 'Save' })}
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                        {t({
                            ko: 'Iyagi 시리즈인 경우 해당 에피소드의 YouTube 링크를 붙여넣으세요.',
                            en: 'For Iyagi series, paste the YouTube link for the corresponding episode.',
                        })}
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <Link href="/listening">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-base md:text-lg font-semibold">
                            {episode.title}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {episode.series} · {episode.level ?? 'TTMIK'}{' '}
                            {episode.episode_number ? `· Ep. ${episode.episode_number}` : ''}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 md:gap-6">
                <Card className="p-4 md:p-5 flex flex-col gap-3">
                    <div className="aspect-video w-full rounded-md overflow-hidden bg-black">
                        <div id="yt-player" className="w-full h-full" />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!playerReady}
                                onClick={() => {
                                    if (!playerRef.current) return;
                                    const YTState = window.YT.PlayerState;
                                    const state = playerRef.current.getPlayerState();
                                    if (state === YTState.PLAYING) {
                                        playerRef.current.pauseVideo();
                                    } else {
                                        playerRef.current.playVideo();
                                    }
                                }}
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="w-4 h-4 mr-1" />
                                        {t({ ko: '일시정지', en: 'Pause' })}
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-1" />
                                        {t({ ko: '재생', en: 'Play' })}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 md:p-5 flex flex-col h-[360px] md:h-[420px]">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                            {t({ ko: '자막', en: 'Transcript' })}
                        </p>
                    </div>
                    <div
                        ref={transcriptContainerRef}
                        className="flex-1 overflow-y-auto space-y-2 pr-1 text-sm"
                    >
                        {loadingTranscript && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{t({ ko: '자막 불러오는 중...', en: 'Loading transcript...' })}</span>
                            </div>
                        )}
                        {!loadingTranscript && transcriptError && (
                            <p className="text-xs text-muted-foreground">
                                {transcriptError}
                            </p>
                        )}
                        {!loadingTranscript &&
                            !transcriptError &&
                            segments &&
                            segments.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {t({
                                        ko: '이 에피소드에는 자막이 없어요. 영상만 시청할 수 있어요.',
                                        en: 'No transcript available for this episode. You can still watch the video.',
                                    })}
                                </p>
                            )}
                        {segments?.map((seg, index) => {
                            const isActive = activeIndex === index;
                            const startSeconds = Math.floor(seg.start_ms / 1000);
                            const mm = String(Math.floor(startSeconds / 60)).padStart(2, '0');
                            const ss = String(startSeconds % 60).padStart(2, '0');
                            return (
                                <div
                                    key={seg.id}
                                    id={`seg-${seg.id}`}
                                    className={`rounded-md px-2 py-1 cursor-pointer border ${isActive
                                        ? 'bg-primary/10 border-primary'
                                        : 'border-transparent hover:bg-muted/60'
                                        }`}
                                    onClick={() => {
                                        if (!playerRef.current) return;
                                        playerRef.current.seekTo(seg.start_ms / 1000, true);
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-0.5 text-[11px] text-muted-foreground">
                                        <span className="font-mono">{mm}:{ss}</span>
                                    </div>
                                    <KoreanText text={seg.text} enableHover className="text-sm" />
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}

