export default function SourceText({ text }: { text: string }) {
  return (
    <pre className="h-[420px] overflow-auto whitespace-pre border border-[#D0D5DD] bg-white p-4 font-mono text-[13px] leading-[20px] text-[#1A2A3A]">
      {text}
    </pre>
  )
}
