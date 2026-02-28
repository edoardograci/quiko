'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Brain,
    BookOpen,
    AlignLeft,
    Layers,
    Search,
    Settings2,
    Library,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useLang } from '@/lib/i18n';

const navItems = [
    { icon: LayoutDashboard, labelKo: '홈', labelEn: 'Home', href: '/dashboard' },
    { icon: Brain, labelKo: '복습', labelEn: 'Review', href: '/review', showBadge: true },
    { icon: BookOpen, labelKo: '단어장', labelEn: 'Vocabulary', href: '/vocabulary' },
    { icon: AlignLeft, labelKo: '문장', labelEn: 'Sentences', href: '/sentences' },
    { icon: Layers, labelKo: '문법', labelEn: 'Grammar', href: '/grammar' },
    { icon: Library, labelKo: '라이브러리', labelEn: 'Library', href: '/library' },
    { icon: Search, labelKo: '사전', labelEn: 'Dictionary', href: '/dictionary' },
    { icon: Settings2, labelKo: '설정', labelEn: 'Settings', href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const [dueCount, setDueCount] = useState<number | null>(null);
    const { lang, setLang } = useLang();

    useEffect(() => {
        fetch('/api/review/due?count_only=true')
            .then(r => r.json())
            .then(data => setDueCount(data.total ?? 0))
            .catch(() => { });
    }, []);

    return (
        <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-border bg-card h-screen sticky top-0">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-base">
                    <span className="korean" lang="ko" style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}>퀴</span>
                </div>
                <div>
                    <p className="font-semibold text-sm tracking-tight">Quiko</p>
                    <p className="text-[10px] text-muted-foreground">퀴코</p>
                </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                                isActive
                                    ? 'nav-item-active'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span lang={lang === 'ko' ? 'ko' : 'en'} className="flex-1" style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}>
                                {lang === 'ko' ? item.labelKo : item.labelEn}
                            </span>
                            {item.showBadge && dueCount !== null && dueCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="h-5 min-w-5 px-1.5 text-[10px] font-bold"
                                >
                                    {dueCount > 99 ? '99+' : dueCount}
                                </Badge>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom tagline & lang toggle */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground mr-2">
                    {lang === 'ko' ? '한국어를 진짜로 배우는 법.' : 'The way Korean really works.'}
                </p>
                <div className="flex bg-muted rounded-md p-0.5 text-[10px] shadow-sm shrink-0">
                    <button
                        onClick={() => setLang('en')}
                        className={cn('px-2 py-1 rounded-sm transition-colors', lang === 'en' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLang('ko')}
                        className={cn('px-2 py-1 rounded-sm transition-colors', lang === 'ko' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}
                    >
                        KO
                    </button>
                </div>
            </div>
        </aside>
    );
}
