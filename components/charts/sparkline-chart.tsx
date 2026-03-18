"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export function SparklineChart({ data }: { data: Array<{ value: number }> }) {
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke="#35D8FF" strokeWidth={2.4} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
