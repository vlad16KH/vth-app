import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const styles: Record<Variant, string> = {
  primary: 'bg-[#1A3C6E] text-white hover:bg-[#0F2A4A]',
  secondary: 'bg-[#E8ECF0] text-[#1A3C6E] hover:bg-[#D5DCE4]',
  danger: 'bg-[#C62828] text-white hover:bg-[#9E2020]',
}

export default function Button({ variant = 'secondary', className = '', ...rest }: Props) {
  return (
    <button
      className={`inline-flex h-[36px] cursor-pointer select-none items-center justify-center gap-1.5 rounded-[2px] border-0 px-4 text-[13px] leading-none disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    />
  )
}
