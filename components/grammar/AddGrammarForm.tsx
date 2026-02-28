'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/lib/i18n';

interface AddGrammarFormProps {
    onSuccess: (id: number) => void;
    onCancel: () => void;
}

export function AddGrammarForm({ onSuccess, onCancel }: AddGrammarFormProps) {
    const { lang, t } = useLang();
    const [pattern, setPattern] = useState('');
    const [nameKo, setNameKo] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('');
    const [category, setCategory] = useState('');
    const [formality, setFormality] = useState('');
    const [example, setExample] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pattern.trim() || !nameEn.trim() || !description.trim()) {
            toast.error(t({ ko: '패턴, 영어 이름, 설명은 필수입니다', en: 'Pattern, English name, and Description are required' }));
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/grammar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pattern: pattern.trim(),
                    name_ko: nameKo.trim() || null,
                    name_en: nameEn.trim(),
                    description: description.trim(),
                    level: level || 'custom',
                    category: category || null,
                    formality: formality || null,
                    example_pattern_use: example.trim() || null,
                }),
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            toast.success(t({ ko: '문법 패턴이 추가되었습니다!', en: 'Grammar pattern added!' }));
            onSuccess(data.id);
        } catch {
            toast.error(t({ ko: '추가 실패', en: 'Failed to add pattern' }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                    <Label>{t({ ko: '패턴 표기 *', en: 'Pattern Formula *' })}</Label>
                    <Input
                        value={pattern}
                        onChange={e => setPattern(e.target.value)}
                        placeholder="예: V-고 싶다"
                        lang="ko"
                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                    />
                </div>
                <div className="space-y-1">
                    <Label>{t({ ko: '한국어 이름', en: 'Korean Name' })}</Label>
                    <Input value={nameKo} onChange={e => setNameKo(e.target.value)} placeholder="희망 표현" lang="ko" style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }} />
                </div>
                <div className="space-y-1">
                    <Label>{t({ ko: 'English Name *', en: 'English Name *' })}</Label>
                    <Input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Want to V" />
                </div>
                <div className="space-y-1">
                    <Label>{t({ ko: '레벨', en: 'Level' })}</Label>
                    <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger><SelectValue placeholder={t({ ko: '선택', en: 'Select' })} /></SelectTrigger>
                        <SelectContent>
                            {['TOPIK-I-1', 'TOPIK-I-2', 'TOPIK-II-3', 'TOPIK-II-4', 'custom'].map(l => (
                                <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>{t({ ko: '카테고리', en: 'Category' })}</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue placeholder={t({ ko: '선택', en: 'Select' })} /></SelectTrigger>
                        <SelectContent>
                            {['particle', 'verb_ending', 'tense', 'honorific', 'connector', 'aspect', 'modal', 'negation'].map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>{t({ ko: '격식성', en: 'Formality' })}</Label>
                    <Select value={formality} onValueChange={setFormality}>
                        <SelectTrigger><SelectValue placeholder={t({ ko: '선택', en: 'Select' })} /></SelectTrigger>
                        <SelectContent>
                            {['formal', 'informal', 'neutral', 'written'].map(f => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2 space-y-1">
                    <Label>{t({ ko: '설명 / Description *', en: 'Description *' })}</Label>
                    <Textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Usage explanation..."
                    />
                </div>
                <div className="col-span-2 space-y-1">
                    <Label>{t({ ko: '패턴 예문', en: 'Example Sentence' })}</Label>
                    <Input
                        value={example}
                        onChange={e => setExample(e.target.value)}
                        placeholder="한국어를 공부하고 싶어요."
                        lang="ko"
                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                    />
                </div>
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
