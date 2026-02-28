'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, ArrowLeft } from 'lucide-react';

interface PreviewCard {
    hangul: string;
    definition: string;
}

interface PreviewResponse {
    total: number;
    korean_cards: number;
    preview: PreviewCard[];
}

interface ImportResult {
    imported: number;
    skipped: number;
    total: number;
}

export default function ImportAnkiPage() {
    const { lang, t } = useLang();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewResponse | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (f: File | null) => {
        if (!f) return;
        if (!f.name.toLowerCase().endsWith('.apkg')) {
            setError('Please select a .apkg file');
            return;
        }
        setError(null);
        setFile(f);
        setImportResult(null);
        await fetchPreview(f);
    };

    const fetchPreview = async (f: File) => {
        setLoadingPreview(true);
        setPreview(null);
        try {
            const formData = new FormData();
            formData.append('file', f);
            const res = await fetch('/api/import/anki', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to parse Anki deck');
            }
            const data = (await res.json()) as PreviewResponse;
            setPreview(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to parse Anki deck');
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!file || !preview) return;
        setImporting(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/import/anki?confirm=true', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to import Anki deck');
            }
            const data = (await res.json()) as ImportResult;
            setImportResult(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to import Anki deck');
        } finally {
            setImporting(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setPreview(null);
        setImportResult(null);
        setError(null);
    };

    const hasPreview = !!preview;
    const inPreviewState = hasPreview && !importResult;

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <Link href="/settings" className="inline-flex">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1
                        className="text-xl font-semibold"
                        lang={lang}
                        style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                    >
                        {t({ ko: 'Anki 덱 가져오기', en: 'Import Anki Deck' })}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t({
                            ko: '.apkg 파일을 업로드하여 단어를 가져오세요',
                            en: 'Upload an .apkg file exported from Anki to import vocabulary.',
                        })}
                    </p>
                </div>
            </div>

            <Card className="p-6 space-y-4">
                {!inPreviewState && !importResult && (
                    <>
                        <div
                            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/60 transition-colors"
                            onDragOver={(e) => {
                                e.preventDefault();
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const droppedFile = e.dataTransfer.files?.[0];
                                if (droppedFile) {
                                    void handleFileChange(droppedFile);
                                }
                            }}
                            onClick={() => {
                                const input = document.getElementById('anki-file-input') as HTMLInputElement | null;
                                input?.click();
                            }}
                        >
                            <Upload className="w-10 h-10 text-primary mb-1" />
                            <p className="text-sm font-medium">
                                {t({
                                    ko: '.apkg 파일을 여기로 끌어다 놓거나 클릭해서 선택하세요',
                                    en: 'Drag and drop an .apkg file here, or click to browse.',
                                })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t({
                                    ko: '최대 50MB, 단일 덱 파일만 지원됩니다.',
                                    en: 'Single deck files up to 50MB are supported.',
                                })}
                            </p>
                            <Input
                                id="anki-file-input"
                                type="file"
                                accept=".apkg"
                                className="hidden"
                                onChange={(e) => {
                                    const selected = e.target.files?.[0] ?? null;
                                    if (selected) {
                                        void handleFileChange(selected);
                                    }
                                }}
                            />
                        </div>

                        {loadingPreview && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>
                                    {t({ ko: '덱을 분석하는 중...', en: 'Analyzing deck...' })}
                                </span>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                        )}

                        {!loadingPreview && !error && !preview && (
                            <p className="text-xs text-muted-foreground">
                                {t({
                                    ko: 'Anki에서 .apkg로 덱을 내보낸 후 이곳에서 가져올 수 있습니다.',
                                    en: 'Export a deck from Anki as .apkg, then import it here.',
                                })}
                            </p>
                        )}
                    </>
                )}

                {inPreviewState && preview && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">
                                    {t({ ko: '미리보기', en: 'Preview' })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t({
                                        ko: '총',
                                        en: 'Total notes:',
                                    })}{' '}
                                    <span className="font-mono">{preview.total}</span>{' '}
                                    ·{' '}
                                    <span className="font-mono">{preview.korean_cards}</span>{' '}
                                    {t({
                                        ko: '개의 한국어 카드를 찾았어요',
                                        en: 'Korean cards found',
                                    })}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetState}
                            >
                                {t({ ko: '취소', en: 'Cancel' })}
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 bg-muted text-xs font-medium px-3 py-2">
                                <span>{t({ ko: '한국어', en: 'Korean' })}</span>
                                <span>{t({ ko: '뜻', en: 'Definition' })}</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto divide-y">
                                {preview.preview.map((card, idx) => (
                                    <div key={`${card.hangul}-${idx}`} className="grid grid-cols-2 text-xs px-3 py-2 gap-2">
                                        <span
                                            className="korean"
                                            lang="ko"
                                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                        >
                                            {card.hangul}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {card.definition}
                                        </span>
                                    </div>
                                ))}
                                {preview.preview.length === 0 && (
                                    <div className="px-3 py-4 text-xs text-muted-foreground">
                                        {t({
                                            ko: '한국어 카드를 찾지 못했습니다. 다른 덱을 시도해 보세요.',
                                            en: 'No Korean cards detected. Try a different deck.',
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1">
                                <Progress
                                    value={preview.korean_cards > 0 ? 100 : 0}
                                    className="h-2"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={resetState}
                                >
                                    {t({ ko: '취소', en: 'Cancel' })}
                                </Button>
                                <Button
                                    onClick={handleConfirmImport}
                                    disabled={importing || preview.korean_cards === 0}
                                >
                                    {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {t({
                                        ko: `총 ${preview.korean_cards}개 가져오기`,
                                        en: `Import ${preview.korean_cards} Cards`,
                                    })}
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>
                )}

                {importResult && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium">
                                {t({ ko: '가져오기 완료', en: 'Import Complete' })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                <span className="font-mono">{importResult.imported}</span>{' '}
                                {t({ ko: '개의 새 단어를 추가했어요', en: 'new words added' })}{' '}
                                ·{' '}
                                <span className="font-mono">{importResult.skipped}</span>{' '}
                                {t({ ko: '개는 이미 있어요', en: 'already in library' })}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={resetState}>
                                {t({ ko: '다른 덱 가져오기', en: 'Import Another Deck' })}
                            </Button>
                            <Link href="/vocabulary">
                                <Button>
                                    {t({ ko: '단어장으로 이동', en: 'Go to Vocabulary' })}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </Card>

            <Card className="p-5 space-y-3">
                <h2 className="text-sm font-medium">
                    {t({ ko: '추천 Anki 덱', en: 'Recommended Anki Decks' })}
                </h2>
                <p className="text-xs text-muted-foreground">
                    {t({
                        ko: '아래 덱을 AnkiWeb에서 다운로드한 후 위에서 가져오세요',
                        en: 'Download these decks from AnkiWeb, then import them above.',
                    })}
                </p>
                <ul className="space-y-2 text-sm">
                    <li>
                        <a
                            href="https://ankiweb.net/shared/info/1862058740"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                        >
                            TTMIK Level 1-6 Vocabulary
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://ankiweb.net/shared/info/1140779292"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                        >
                            Korean Core 2000
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://ankiweb.net/shared/info/2141233552"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                        >
                            Evita&apos;s Korean Vocabulary List
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://ankiweb.net/shared/info/1546722021"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                        >
                            TOPIK Essential Vocabulary 6000
                        </a>
                    </li>
                </ul>
            </Card>
        </div>
    );
}

