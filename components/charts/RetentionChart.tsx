'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface RetentionChartProps {
    data: Array<{ date: string; accuracy: number }>;
}

export function RetentionChart({ data }: RetentionChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                아직 데이터가 없어요
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip
                    formatter={(value: number | undefined) => [`${value ?? 0}%`, '정확도']}
                    contentStyle={{
                        background: 'rgb(var(--card))',
                        border: '1px solid rgb(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="rgb(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
