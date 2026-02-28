'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { POS_LABELS } from '@/lib/hangul';
import { HangulInput } from '@/components/keyboard/HangulInput';
import { useLang } from '@/lib/i18n';

interface Definition {
    definition_ko: string;
    definition_en: string;
    order_num: number;
    krdict_target_code?: string;
}

interface AddWordFormProps {
    initialHangul?: string;
    initialDefinitions?: Definition[];
    onSuccess: (wordId: number) => void;
    onCancel: () => void;
}

export function AddWordForm({ initialHangul = '', initialDefinitions = [], onSuccess, onCancel }: AddWordFormProps) {
    const { lang, t } = useLang();
    const [hangul, setHangul] = useState(initialHangul);
    const [hanja, setHanja] = useState('');
    const [pos, setPos] = useState('');
    const [level, setLevel] = useState('');
    const [stem, setStem] = useState('');
    const [notes, setNotes] = useState('');
    const [definitions, setDefinitions] = useState<Definition[]>(
        initialDefinitions.length > 0 ? initialDefinitions : [{ definition_ko: '', definition_en: '', order_num: 1 }]
    );
    const [exampleKo, setExampleKo] = useState('');
    const [exampleEn, setExampleEn] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);

    const posOptions = ['noun', 'verb', 'adjective', 'adverb', 'particle', 'determiner', 'interjection', 'pronoun', 'bound_noun', 'suffix'];

    const handleKrdictLookup = async () => {
        if (!hangul.trim()) {
            toast.error(t({ ko: '검색할 단어를 입력하세요', en: 'Enter a word to search' }));
            return;
        }
        setLookingUp(true);
        try {
            const res = await fetch(`/api/dictionary/search?q=${encodeURIComponent(hangul)}`);
            const data = await res.json();
            if (data.results?.length > 0) {
                const result = data.results[0];
                const defs = result.definitions.map((d: { order: number; definition_ko: string; definition_en?: string; krdict_target_code?: string }, i: number) => ({
                    definition_ko: d.definition_ko,
                    definition_en: d.definition_en || '',
                    order_num: d.order || i + 1,
                    krdict_target_code: result.target_code,
                }));
                setDefinitions(defs.slice(0, 5));
                if (result.pos && !pos) setPos(result.pos.toLowerCase().replace(/\s+/g, '_'));
                if (result.definitions[0]?.examples?.[0]) {
                    setExampleKo(result.definitions[0].examples[0]);
                }
                toast.success(t({ ko: 'KRDICT에서 정보를 가져왔습니다', en: 'Retrieved info from KRDICT' }));
            } else {
                toast.info(t({ ko: '검색 결과가 없습니다', en: 'No results found' }));
            }
        } catch (e) {
            toast.error(t({ ko: 'KRDICT 검색 실패', en: 'KRDICT search failed' }));
        } finally {
            setLookingUp(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hangul.trim()) {
            toast.error(t({ ko: '한국어 단어를 입력하세요', en: 'Please enter a Korean word' }));
            return;
        }
        setSubmitting(true);
        try {
            const body = {
                hangul: hangul.trim(),
                hanja: hanja.trim() || null,
                pos: pos || null,
                level: level || 'custom',
                stem: stem.trim() || null,
                notes: notes.trim() || null,
                definitions: definitions.filter(d => d.definition_en || d.definition_ko),
                examples: exampleKo ? [{ example_ko: exampleKo, example_en: exampleEn, source: 'custom' }] : [],
            };

            const res = await fetch('/api/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed');
            }

            const data = await res.json();
            toast.success(t({ ko: `"${hangul}" 단어가 추가되었습니다!`, en: `Word "${hangul}" added!` }));
            onSuccess(data.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : t({ ko: '단어 추가 실패', en: 'Failed to add word' });
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Hangul input with KRDICT lookup */}
            <div className="space-y-2">
                <Label htmlFor="hangul" lang="ko" style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}>
                    {t({ ko: '한국어 단어 *', en: 'Korean Word *' })}
                </Label>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <HangulInput
                            value={hangul}
                            onChange={setHangul}
                            placeholder={t({ ko: '한국어 입력...', en: 'Enter Korean...' })}
                            autoShowKeyboard={false}
                            large={false}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleKrdictLookup}
                        disabled={lookingUp || !hangul}
                        className="shrink-0 h-10 mt-0"
                    >
                        {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span className="ml-1.5 text-xs">KRDICT</span>
                    </Button>
                </div>
            </div>

            {/* Basic info row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="hanja">{t({ ko: '한자', en: 'Hanja' })}</Label>
                    <Input id="hanja" value={hanja} onChange={e => setHanja(e.target.value)} placeholder="漢字" />
                </div>
                <div className="space-y-1">
                    <Label>{t({ ko: '품사', en: 'POS' })}</Label>
                    <Select value={pos} onValueChange={setPos}>
                        <SelectTrigger>
                            <SelectValue placeholder={t({ ko: '품사 선택', en: 'Select POS' })} />
                        </SelectTrigger>
                        <SelectContent>
                            {posOptions.map(p => (
                                <SelectItem key={p} value={p}>{POS_LABELS[p] || p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>{t({ ko: '레벨', en: 'Level' })}</Label>
                    <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger>
                            <SelectValue placeholder={t({ ko: '레벨', en: 'Level' })} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TOPIK-I">TOPIK-I</SelectItem>
                            <SelectItem value="TOPIK-II">TOPIK-II</SelectItem>
                            <SelectItem value="custom">{t({ ko: '사용자 정의', en: 'Custom' })}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="stem">{t({ ko: '어간', en: 'Stem' })}</Label>
                    <Input
                        id="stem"
                        value={stem}
                        onChange={e => setStem(e.target.value)}
                        placeholder="먹 (from 먹다)"
                        lang="ko"
                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                    />
                </div>
            </div>

            <Separator />

            {/* Definitions */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>{t({ ko: '뜻 / Definitions', en: 'Meaning / Definitions' })}</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefinitions([...definitions, { definition_ko: '', definition_en: '', order_num: definitions.length + 1 }])}
                        className="gap-1 text-xs h-7"
                    >
                        <Plus className="w-3 h-3" /> {t({ ko: '뜻 추가', en: 'Add Meaning' })}
                    </Button>
                </div>
                {definitions.map((def, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <span className="text-xs text-muted-foreground pt-2.5 w-4 shrink-0">{i + 1}.</span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input
                                placeholder="English definition"
                                value={def.definition_en}
                                onChange={e => {
                                    const newDefs = [...definitions];
                                    newDefs[i] = { ...newDefs[i], definition_en: e.target.value };
                                    setDefinitions(newDefs);
                                }}
                            />
                            <Input
                                placeholder={t({ ko: '한국어 정의', en: 'Korean definition' })}
                                value={def.definition_ko}
                                onChange={e => {
                                    const newDefs = [...definitions];
                                    newDefs[i] = { ...newDefs[i], definition_ko: e.target.value };
                                    setDefinitions(newDefs);
                                }}
                                lang="ko"
                                style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                            />
                        </div>
                        {definitions.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => setDefinitions(definitions.filter((_, j) => j !== i))}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <Separator />

            {/* Example sentence */}
            <div className="space-y-2">
                <Label>{t({ ko: '예문 / Example Sentence', en: 'Example Sentence' })}</Label>
                <Input
                    placeholder={t({ ko: '한국어 예문...', en: 'Korean example...' })}
                    value={exampleKo}
                    onChange={e => setExampleKo(e.target.value)}
                    lang="ko"
                    style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                />
                <Input
                    placeholder="English translation..."
                    value={exampleEn}
                    onChange={e => setExampleEn(e.target.value)}
                />
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">{t({ ko: '메모 / Notes', en: 'Notes' })}</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={t({ ko: '추가 메모...', en: 'Additional notes...' })}
                    rows={2}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    {t({ ko: '취소', en: 'Cancel' })}
                </Button>
                <Button
                    type="submit"
                    disabled={submitting || !hangul.trim()}
                    className="flex-1 bg-primary hover:bg-primary/90"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {t({ ko: '단어 추가', en: 'Add Word' })}
                </Button>
            </div>
        </form>
    );
}
