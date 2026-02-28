'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/lib/i18n';

interface AddSentenceFormProps {
    onSuccess: (id: number) => void;
    onCancel: () => void;
}

export function AddSentenceForm({ onSuccess, onCancel }: AddSentenceFormProps) {
    const { lang, t } = useLang();
    const [korean, setKorean] = useState('');
    const [literalTranslation, setLiteralTranslation] = useState('');
    const [naturalTranslation, setNaturalTranslation] = useState('');
    const [source, setSource] = useState('');
    const [level, setLevel] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!korean.trim() || !naturalTranslation.trim()) {
            toast.error(t({ ko: '한국어 문장과 영어 번역은 필수입니다', en: 'Korean sentence and English translation are required' }));
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/sentences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    korean: korean.trim(),
                    literal_translation: literalTranslation.trim() || null,
                    natural_translation: naturalTranslation.trim(),
                    source: source.trim() || 'custom',
                    level: level || 'custom',
                    notes: notes.trim() || null,
                }),
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            toast.success(t({ ko: '문장이 추가되었습니다!', en: 'Sentence added!' }));
            onSuccess(data.id);
        } catch {
            toast.error(t({ ko: '추가 실패', en: 'Failed to add sentence' }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <Label>{t({ ko: '한국어 문장 *', en: 'Korean Sentence *' })}</Label>
                <Textarea
                    value={korean}
                    onChange={e => setKorean(e.target.value)}
                    placeholder={t({ ko: '한국어 문장을 입력하세요...', en: 'Enter Korean sentence...' })}
                    rows={2}
                    lang="ko"
                    style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif', fontSize: '1.1rem' }}
                />
            </div>
            <div className="space-y-1">
                <Label>{t({ ko: '자연스러운 영어 번역 *', en: 'Natural English Translation *' })}</Label>
                <Input
                    value={naturalTranslation}
                    onChange={e => setNaturalTranslation(e.target.value)}
                    placeholder="Natural English translation"
                />
            </div>
            <div className="space-y-1">
                <Label>{t({ ko: '직역 (선택)', en: 'Literal Translation (Optional)' })}</Label>
                <Input
                    value={literalTranslation}
                    onChange={e => setLiteralTranslation(e.target.value)}
                    placeholder="Word-by-word gloss (optional)"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>{t({ ko: '출처', en: 'Source' })}</Label>
                    <Input value={source} onChange={e => setSource(e.target.value)} placeholder="TOPIK-2023, custom..." />
                </div>
                <div className="space-y-1">
                    <Label>{t({ ko: '레벨', en: 'Level' })}</Label>
                    <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger><SelectValue placeholder={t({ ko: '선택', en: 'Select' })} /></SelectTrigger>
                        <SelectContent>
                            {['TOPIK-I', 'TOPIK-II', 'custom-A1', 'custom-A2', 'custom-B1', 'custom-B2', 'custom'].map(l => (
                                <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1">
                <Label>{t({ ko: '메모', en: 'Notes' })}</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t({ ko: '노트...', en: 'Notes...' })} rows={2} />
            </div>
            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">{t({ ko: '취소', en: 'Cancel' })}</Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-primary hover:bg-primary/90">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t({ ko: '추가', en: 'Add' })}
                </Button>
            </div>
        </form>
    );
}
