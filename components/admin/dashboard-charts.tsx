'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const NAVY = 'var(--primary)'
const GOLD = 'var(--gold)'

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-sm shadow-md">
      {label && <p className="mb-1 font-semibold text-popover-foreground">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 text-popover-foreground">
          <span className="size-2.5 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="capitalize text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function ApplicationsTrendChart({
  data,
}: {
  data: { month: string; applications: number; approved: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="fillApps" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={NAVY} stopOpacity={0.28} />
            <stop offset="95%" stopColor={NAVY} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillApproved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={GOLD} stopOpacity={0.28} />
            <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="applications"
          stroke={NAVY}
          strokeWidth={2.5}
          fill="url(#fillApps)"
        />
        <Area
          type="monotone"
          dataKey="approved"
          stroke={GOLD}
          strokeWidth={2.5}
          fill="url(#fillApproved)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function GenderPieChart({ data }: { data: { name: string; value: number }[] }) {
  const colors = [GOLD, NAVY]
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function GenericBarChart({
  data,
  dataKey,
  categoryKey,
}: {
  data: { value: number; [k: string]: string | number }[]
  dataKey: string
  categoryKey: string
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey={categoryKey}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)' }} />
        <Bar dataKey={dataKey} fill={NAVY} radius={[8, 8, 0, 0]} maxBarSize={54} />
      </BarChart>
    </ResponsiveContainer>
  )
}
