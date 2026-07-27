import { initials } from '../../lib/format'

interface AvatarProps {
  name: string
  color?: string
  size?: number
}

export function Avatar({ name, color = '#D98B3F', size = 32 }: AvatarProps) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: color }}
    >
      {initials(name)}
    </div>
  )
}
