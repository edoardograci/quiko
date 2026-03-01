'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Database, Eye, Keyboard, Brain, CheckCircle2, Loader2, RefreshCw, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useLang } from '@/lib/i18n';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SettingsData {
    krdict_api_key: string;
    daily_review_limit: string;
    new_cards_per_day: string;
    target_retention: string;
    theme: string;
    show_pronunciation: string;
    use_onscreen_keyboard: string;
    daily_goal: string;
}

export default function SettingsPage() {
    const { lang, setLang, t } = useLang();
    const [settings, setSettings] = useState<Partial<SettingsData>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const { setTheme } = useTheme();

    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    const save = async (updates: Partial<SettingsData>) => {
        setSaving(true);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            setSettings(prev => ({ ...prev, ...updates }));
            toast.success(t({ ko: '설정이 저장되었습니다', en: 'Settings saved' }));
        } catch {
            toast.error(t({ ko: '저장 실패', en: 'Failed to save' }));
        } finally {
            setSaving(false);
        }
    };


    const seedDatabase = async () => {
        setSeeding(true);
        try {
            const res = await fetch('/api/seed', { method: 'POST' });
            const data = await res.json();
            toast.success(data.message || t({ ko: '데이터베이스 시드 완료!', en: 'Database Seed Complete!' }));
        } catch {
            toast.error(t({ ko: '시드 실패', en: 'Seed Failed' }));
        } finally {
            setSeeding(false);
        }
    };

    const exportData = async () => {
        try {
            const [words, sentences, grammar] = await Promise.all([
                fetch('/api/words?limit=10000').then(r => r.json()),
                fetch('/api/sentences?limit=10000').then(r => r.json()),
                fetch('/api/grammar?limit=10000').then(r => r.json()),
            ]);
            const exportData = {
                exported_at: new Date().toISOString(),
                words: words.words,
                sentences: sentences.sentences,
                grammar_patterns: grammar.patterns,
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiko-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(t({ ko: '데이터 내보내기 완료!', en: 'Data Exported!' }));
        } catch {
            toast.error(t({ ko: '내보내기 실패', en: 'Export Failed' }));
        }
    };

    const retention = parseFloat(settings.target_retention ?? '0.90');
    const reviewLimit = parseInt(settings.daily_review_limit ?? '50');
    const newCards = parseInt(settings.new_cards_per_day ?? '10');

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1
                        className="text-xl font-semibold"
                        lang={lang}
                        style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                    >
                        {t({ ko: '설정', en: 'Settings' })}
                    </h1>
                </div>
                
                {/* Mobile Language Toggle - Only show on mobile */}
                <div className="md:hidden flex bg-muted rounded-md p-0.5 text-[10px] shadow-sm">
                    <button
                        onClick={() => setLang('en')}
                        className={cn('px-2.5 py-1 rounded-sm transition-colors', lang === 'en' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLang('ko')}
                        className={cn('px-2.5 py-1 rounded-sm transition-colors', lang === 'ko' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}
                    >
                        KO
                    </button>
                </div>
            </div>

            {/* Review Settings */}
            <Card className="p-5 space-y-5">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-medium text-sm">{t({ ko: '복습 설정', en: 'Review Settings' })}</h2>
                </div>
                <Separator />

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label className="text-xs text-muted-foreground">{t({ ko: '하루 복습 한도', en: 'Daily Review Limit' })}</Label>
                        <span className="text-sm font-mono font-medium">{reviewLimit}{t({ ko: '개', en: '' })}</span>
                    </div>
                    <Slider
                        value={[reviewLimit]}
                        onValueChange={([v]) => setSettings(s => ({ ...s, daily_review_limit: String(v) }))}
                        onValueCommit={([v]) => save({ daily_review_limit: String(v) })}
                        min={10}
                        max={200}
                        step={5}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label className="text-xs text-muted-foreground">{t({ ko: '하루 목표 카드 수', en: 'Daily Goal (Cards)' })}</Label>
                        <span className="text-sm font-mono font-medium">{settings.daily_goal ?? '20'}{t({ ko: '개', en: '' })}</span>
                    </div>
                    <Slider
                        value={[parseInt(settings.daily_goal ?? '20')]}
                        onValueChange={([v]) => setSettings(s => ({ ...s, daily_goal: String(v) }))}
                        onValueCommit={([v]) => save({ daily_goal: String(v) })}
                        min={5}
                        max={200}
                        step={5}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label className="text-xs text-muted-foreground">{t({ ko: '하루 신규 카드', en: 'New Cards Per Day' })}</Label>
                        <span className="text-sm font-mono font-medium">{newCards}{t({ ko: '개', en: '' })}</span>
                    </div>
                    <Slider
                        value={[newCards]}
                        onValueChange={([v]) => setSettings(s => ({ ...s, new_cards_per_day: String(v) }))}
                        onValueCommit={([v]) => save({ new_cards_per_day: String(v) })}
                        min={1}
                        max={50}
                        step={1}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label className="text-xs text-muted-foreground">{t({ ko: '목표 기억률 (FSRS)', en: 'Target Retention (FSRS)' })}</Label>
                        <span className="text-sm font-mono font-medium">{Math.round(retention * 100)}%</span>
                    </div>
                    <Slider
                        value={[Math.round(retention * 100)]}
                        onValueChange={([v]) => setSettings(s => ({ ...s, target_retention: String(v / 100) }))}
                        onValueCommit={([v]) => save({ target_retention: String(v / 100) })}
                        min={70}
                        max={99}
                        step={1}
                        className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">{t({ ko: '높을수록 더 자주 복습합니다. 권장값: 90%', en: 'Higher = more frequent reviews. Recommended: 90%' })}</p>
                </div>
            </Card>

            {/* Display Settings */}
            <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-medium text-sm">{t({ ko: '표시 설정', en: 'Display Settings' })}</h2>
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm">{t({ ko: '테마', en: 'Theme' })}</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Light / Dark / System</p>
                    </div>
                    <Select
                        value={settings.theme ?? 'system'}
                        onValueChange={v => { setTheme(v); save({ theme: v }); }}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm">{t({ ko: '발음 표시', en: 'Show Pronunciation' })}</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t({ ko: '단어 발음 가이드', en: 'Pronunciation guide on cards' })}</p>
                    </div>
                    <Switch
                        checked={settings.show_pronunciation === 'true'}
                        onCheckedChange={v => save({ show_pronunciation: String(v) })}
                    />
                </div>
            </Card>

            {/* Keyboard Settings */}
            <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-medium text-sm">{t({ ko: '입력 설정', en: 'Input Settings' })}</h2>
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm">{t({ ko: '화면 키보드', en: 'On-Screen Keyboard' })}</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t({ ko: '두벌식 한글 키보드', en: 'Dubeolsik Korean keyboard' })}</p>
                    </div>
                    <Select
                        value={settings.use_onscreen_keyboard ?? 'auto'}
                        onValueChange={v => save({ use_onscreen_keyboard: v })}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="always">{t({ ko: '항상', en: 'Always' })}</SelectItem>
                            <SelectItem value="auto">{t({ ko: '자동', en: 'Auto' })}</SelectItem>
                            <SelectItem value="never">{t({ ko: '항상 숨김', en: 'Never' })}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Data Management */}
            <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-medium text-sm">{t({ ko: '데이터 관리', en: 'Data Management' })}</h2>
                </div>
                <Separator />

                <div className="pb-2">
                    <Label className="text-sm">KRDICT API Key</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {t({ ko: 'KRDICT API 키는 .env 파일에서 관리됩니다.', en: 'KRDICT API key is managed via .env file' })}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="outline"
                        className="w-full gap-2 justify-start"
                        onClick={seedDatabase}
                        disabled={seeding}
                    >
                        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {t({ ko: '데이터베이스 시드 (문법 패턴 로드)', en: 'Seed Database (Load Grammar Patterns)' })}
                    </Button>
                    <Link href="/import" className="block w-full">
                        <Button variant="outline" className="w-full gap-2 justify-start">
                            <Upload className="w-4 h-4" />
                            {t({ ko: 'Anki 덱 가져오기', en: 'Import Anki Deck (.apkg)' })}
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        className="w-full gap-2 justify-start"
                        onClick={exportData}
                    >
                        <Download className="w-4 h-4" />
                        {t({ ko: '데이터 내보내기 (JSON)', en: 'Export Data (JSON)' })}
                    </Button>
                </div>
            </Card>

            <p className="text-xs text-center text-muted-foreground pb-6">
                Quiko v1.0 · {t({ ko: '한국어를 진짜로 배우는 법.', en: 'The way Korean really works.' })}
            </p>
        </div>
    );
}
