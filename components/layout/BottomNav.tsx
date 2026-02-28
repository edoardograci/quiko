'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Brain,
    BookOpen,
    Search,
    Library,
    Headphones,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
    { icon: LayoutDashboard, labelKo: '홈', href: '/dashboard' },
    { icon: Brain, labelKo: '복습', href: '/review', showBadge: true },
    { icon: BookOpen, labelKo: '단어장', href: '/vocabulary' },
    { icon: Library, labelKo: '라이브러리', href: '/library' },
    { icon: Headphones, labelKo: '듣기', href: '/listening' },
    { icon: Search, labelKo: '사전', href: '/dictionary' },
];

export function BottomNav() {
    const pathname = usePathname();
    const [dueCount, setDueCount] = useState<number | null>(null);

    useEffect(() => {
        fetch('/api/review/due?count_only=true')
            .then(r => r.json())
            .then(data => setDueCount(data.total ?? 0))
            .catch(() => { });
    }, []);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
            <div className="flex items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center h-full gap-1 relative transition-colors duration-150',
                                isActive ? 'text-primary' : 'text-muted-foreground'
                            )}
                        >
                            <div className="relative">
                                <Icon className="w-5 h-5" />
                                {item.showBadge && dueCount !== null && dueCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {dueCount > 9 ? '9+' : dueCount}
                                    </span>
                                )}
                            </div>
                            <span
                                className="text-[10px] font-medium"
                                lang="ko"
                                style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                            >
                                {item.labelKo}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
