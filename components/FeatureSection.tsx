'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import React from 'react'

interface FeatureSectionProps {
  imageUrl: string
  imageAlt: string
  IconComponent: React.ElementType
  iconColorClass: string
  iconBgClass: string
  title: string
  description: string
  features: string[]
  linkHref: string
  linkText: string
  imagePosition?: 'left' | 'right' // 'left' means image is on the left on md screens, 'right' on the right
  imageAspectClass?: string // e.g., 'aspect-video', 'aspect-square'
}

export function FeatureSection({
  imageUrl,
  imageAlt,
  IconComponent,
  iconColorClass,
  iconBgClass,
  title,
  description,
  features,
  linkHref,
  linkText,
  imagePosition = 'right', // Default to image on the right, text on the left
  imageAspectClass = 'aspect-video', // Default aspect ratio
}: FeatureSectionProps) {
  const textOrder = imagePosition === 'right' ? 'md:order-1' : 'md:order-2'
  const imageOrder = imagePosition === 'right' ? 'md:order-2' : 'md:order-1'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 md:gap-y-16 mb-16 md:mb-24 items-center">
      {/* Text Content */}
      <div className={`flex flex-col justify-center order-2 ${textOrder} px-4 sm:px-0`}>
        <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl ${iconBgClass} flex items-center justify-center mb-4 sm:mb-6`}>
          <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${iconColorClass}`} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">{title}</h3>
        <p className="text-lg sm:text-xl text-gray-300 mb-4 sm:mb-6">{description}</p>
        <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {features.map((item, i) => (
            <li key={i} className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-2 sm:ml-3 text-gray-300 text-base sm:text-lg">{item}</p>
            </li>
          ))}
        </ul>
        <Link
          href={linkHref}
          className={`inline-flex items-center ${iconColorClass} font-medium hover:brightness-110 transition-colors text-base sm:text-lg`}
        >
          {linkText}
          <ChevronRight className="ml-1 h-5 w-5" />
        </Link>
      </div>

      {/* Image */}
      <div className={`relative ${imageAspectClass} overflow-hidden rounded-2xl order-1 ${imageOrder} mx-4 sm:mx-0`}>
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover"
        />
      </div>
    </div>
  )
}
