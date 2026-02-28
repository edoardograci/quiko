import { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioButtonProps {
    type: 'word' | 'sentence' | 'grammar';
    id: number;
    className?: string;
    iconSize?: number;
}

export function AudioButton({ type, id, className, iconSize = 16 }: AudioButtonProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayAudio = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            const url = `/api/audio/${type}/${id}`;
            const audio = new Audio(url);
            audio.onended = () => setIsPlaying(false);
            audio.onerror = () => setIsPlaying(false);
            await audio.play();
        } catch {
            setIsPlaying(false);
        }
    };

    return (
        <button
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className={cn("rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50", className)}
        >
            {isPlaying ? (
                <Loader2 className="text-muted-foreground animate-spin" style={{ width: iconSize, height: iconSize }} />
            ) : (
                <Volume2 className="text-muted-foreground" style={{ width: iconSize, height: iconSize }} />
            )}
        </button>
    );
}
