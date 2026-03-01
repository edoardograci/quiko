import { Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ReviewHeatmap } from './ReviewHeatmap';
import { cn } from '@/lib/utils';

interface StreakAndHeatmapProps {
    streakDays: number;
    reviewedToday: number;
    dailyGoal: number;
    heatmapData: Array<{ day: number; count: number }>;
}

export function StreakAndHeatmap({
    streakDays,
    reviewedToday,
    dailyGoal,
    heatmapData,
}: StreakAndHeatmapProps) {
    const goalPercentage = Math.min((reviewedToday / dailyGoal) * 100, 100);

    return (
        <div className="space-y-6">
            {/* Streak + Daily Goal - Horizontal strip */}
            <div className="grid grid-cols-2 gap-4">
                {/* Streak */}
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <div>
                            <div className="text-xs text-muted-foreground">현재 스트릭</div>
                            <div className="text-2xl font-bold">{streakDays}</div>
                        </div>
                    </div>
                </div>

                {/* Daily Goal Progress */}
                <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="text-xs text-muted-foreground mb-2">
                        오늘의 복습: {reviewedToday}/{dailyGoal}
                    </div>
                    <Progress value={goalPercentage} className="h-2" />
                </div>
            </div>

            {/* Heatmap */}
            <ReviewHeatmap data={heatmapData} />
        </div>
    );
}
