'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const activityData = [
  { name: 'Mon', value: 2 },
  { name: 'Tue', value: 3.5 },
  { name: 'Wed', value: 2.5 },
  { name: 'Thu', value: 5 },
  { name: 'Fri', value: 4 },
  { name: 'Sat', value: 6 },
  { name: 'Sun', value: 3 },
]

const topicsData = [
  { name: 'DSA', value: 45, color: '#34D399' },
  { name: 'Web Dev', value: 25, color: '#A78BFA' },
  { name: 'ML', value: 15, color: '#F472B6' },
  { name: 'System Design', value: 10, color: '#60A5FA' },
  { name: 'Others', value: 5, color: '#9CA3AF' },
]

export function ActivityChart() {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(val) => `${val}h`} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [`${value} hrs`, 'Study Time']}
          />
          <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TopicsChart({ data = topicsData }: { data?: any[] }) {
  // Calculate total to find percentages
  const total = data.reduce((acc, curr) => acc + curr.value, 0)
  
  let cumulativePercent = 0

  return (
    <div className="h-[140px] w-[140px] relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {data.map((slice, i) => {
          if (slice.value === 0) return null
          
          const percent = slice.value / total
          const dashArray = `${percent * 251.2} 251.2` // 2 * PI * R (where R=40)
          const dashOffset = cumulativePercent * 251.2
          
          cumulativePercent += percent

          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={slice.color}
              strokeWidth="20"
              strokeDasharray={dashArray}
              strokeDashoffset={-dashOffset}
              className="transition-all duration-1000 ease-out hover:opacity-80"
              style={{ outline: '1px solid #fff', outlineOffset: '-10px' }}
            />
          )
        })}
      </svg>
      {/* Center hole for donut effect */}
      <div className="absolute w-[60px] h-[60px] bg-white rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top</span>
        <span className="text-sm font-bold text-violet-600 leading-none">{data[0]?.name?.substring(0,4)}</span>
      </div>
    </div>
  )
}
