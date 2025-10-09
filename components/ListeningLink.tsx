'use client'

import Link from 'next/link'
import { Headphones } from 'lucide-react'

interface ListeningLinkProps {
  id: string
  title?: string
  className?: string
}

export function ListeningLink({ id, title = 'Start Listening Exercise', className = '' }: ListeningLinkProps) {
  return (
    <Link 
      href={`/listening?id=${id}`}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
    >
      <Headphones size={18} />
      <span>{title}</span>
    </Link>
  )
}
