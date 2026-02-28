'use client';

import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { HangulKeyboard } from './HangulKeyboard';
import { useHangulComposer } from './useHangulComposer';
import { cn } from '@/lib/utils';

interface HangulInputProps {
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    onSubmit?: (value: string) => void;
    value?: string;
    onChange?: (value: string) => void;
    showKeyboard?: boolean;
    autoShowKeyboard?: boolean;
    large?: boolean;
}

export interface HangulInputRef {
    reset: () => void;
    focus: () => void;
    getValue: () => string;
}

export const HangulInput = forwardRef<HangulInputRef, HangulInputProps>(
    ({ placeholder, className, inputClassName, onSubmit, value: externalValue, onChange, showKeyboard, autoShowKeyboard = true, large }, ref) => {
        const [internalValue, setInternalValue] = useState('');
        const [showKb, setShowKb] = useState(showKeyboard ?? false);
        const [isComposing, setIsComposing] = useState(false);
        const inputRef = useRef<HTMLInputElement>(null);

        const value = externalValue !== undefined ? externalValue : internalValue;

        const handleChange = useCallback((newValue: string) => {
            if (externalValue === undefined) setInternalValue(newValue);
            onChange?.(newValue);
        }, [externalValue, onChange]);

        const { insertJamo, backspace, reset, setValue } = useHangulComposer(handleChange);

        useImperativeHandle(ref, () => ({
            reset: () => {
                reset();
                if (externalValue === undefined) setInternalValue('');
            },
            focus: () => inputRef.current?.focus(),
            getValue: () => value,
        }));

        const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!isComposing) {
                handleChange(e.target.value);
                // Sync jamo state
                setValue(e.target.value);
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !isComposing) {
                onSubmit?.(value);
            }
        };

        const handleSpace = () => {
            const newValue = value + ' ';
            handleChange(newValue);
            setValue(newValue);
        };

        const handleEnter = () => {
            onSubmit?.(value);
        };

        const handleJamo = async (jamo: string) => {
            await insertJamo(jamo);
        };

        const handleBackspaceKb = async () => {
            // If there's composed text, delete one jamo
            if (value.length > 0) {
                await backspace();
            }
        };

        return (
            <div className={cn('flex flex-col gap-2', className)}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        lang="ko"
                        inputMode="text"
                        value={value}
                        onChange={handleNativeChange}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => {
                            setIsComposing(false);
                            handleChange((e.target as HTMLInputElement).value);
                        }}
                        onFocus={() => {
                            if (autoShowKeyboard) setShowKb(true);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || '한국어로 입력하세요...'}
                        className={cn(
                            'w-full border border-input bg-background rounded-lg px-4 py-3',
                            'text-foreground placeholder:text-muted-foreground',
                            'focus:outline-none focus:ring-2 focus:ring-ring',
                            'transition-all duration-200',
                            large ? 'text-3xl korean text-center h-20' : 'text-lg',
                            inputClassName
                        )}
                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                    />
                </div>

                {(showKb || showKeyboard) && (
                    <HangulKeyboard
                        onJamo={handleJamo}
                        onBackspace={handleBackspaceKb}
                        onSpace={handleSpace}
                        onEnter={handleEnter}
                    />
                )}
            </div>
        );
    }
);

HangulInput.displayName = 'HangulInput';
