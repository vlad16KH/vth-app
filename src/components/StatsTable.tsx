interface Row {
  label: string
  value: string | number
}

export default function StatsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="border border-[#D0D5DD] bg-white">
      {rows.map((r, i) => (
        <div key={i} className={`flex ${i > 0 ? 'border-t border-[#D0D5DD]' : ''}`}>
          <div className="w-[240px] shrink-0 border-r border-[#D0D5DD] bg-[#F8F9FA] px-3 py-2 text-[13px] text-[#6B7A8F]">
            {r.label}
          </div>
          <div className="flex-1 px-3 py-2 text-[13px] text-[#1A2A3A]">{r.value}</div>
        </div>
      ))}
    </div>
  )
}
