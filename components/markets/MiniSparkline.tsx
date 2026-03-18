"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

type Point = {
  label: string;
  value: number;
};

export function MiniSparkline({
  data,
  positive,
}: {
  data: Point[];
  positive: boolean;
}) {
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={positive ? "#22C55E" : "#3B82F6"}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
