'use client';

import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TODAY_DAY = Math.floor(Date.now() / 1000 / 86400);

interface ReviewHeatmapProps {
    data: Array<{ day: number; count: number }>;
}

export function ReviewHeatmap({ data }: ReviewHeatmapProps) {
    const { weeks } = useMemo(() => {
        const todayDay = TODAY_DAY;

        const countMap = new Map<number, number>();
        for (const d of data) {
            countMap.set(d.day, d.count);
        }

        const days = [];
        for (let i = 364; i >= 0; i--) {
            const day = todayDay - i;
            const date = new Date(day * 86400 * 1000);
            days.push({
                day,
                count: countMap.get(day) ?? 0,
                date,
                label: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            });
        }

        const weeksArr: typeof days[] = [];
        let week: typeof days = [];
        const firstDay = days[0].date.getDay();
        for (let i = 0; i < firstDay; i++) week.push({ day: -1, count: -1, date: new Date(0), label: '' });
        for (const d of days) {
            week.push(d);
            if (week.length === 7) {
                weeksArr.push(week);
                week = [];
            }
        }
        if (week.length > 0) weeksArr.push(week);

        return { weeks: weeksArr };
    }, [data]);

    const maxCount = Math.max(...data.map(d => d.count), 1);

    const getColor = (count: number) => {
        if (count <= 0) return 'bg-muted';
        const intensity = Math.min(count / maxCount, 1);
        if (intensity < 0.25) return 'bg-primary/20';
        if (intensity < 0.5) return 'bg-primary/40';
        if (intensity < 0.75) return 'bg-primary/65';
        return 'bg-primary';
    };

    return (
        <TooltipProvider>
            <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                            {week.map((day, di) => {
                                if (day.day === -1) return <div key={di} className="heatmap-cell bg-transparent" />;
                                return (
                                    <Tooltip key={di}>
                                        <TooltipTrigger asChild>
                                            <div className={`heatmap-cell ${getColor(day.count)}`} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">{day.label}: {day.count}회 복습</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">적음</p>
                    <div className="flex gap-1">
                        {['bg-muted', 'bg-primary/20', 'bg-primary/40', 'bg-primary/65', 'bg-primary'].map(c => (
                            <div key={c} className={`heatmap-cell ${c}`} />
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">많음</p>
                </div>
            </div>
        </TooltipProvider>
    );
}
