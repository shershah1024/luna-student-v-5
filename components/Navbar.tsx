'use client'

import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'

export function Navbar() {
  const { isSignedIn } = useUser()

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 border-b border-gray-100 z-50 backdrop-blur-md">
      <div className="max-w-[90rem] mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <img
                src="https://images.tslfiles.org/general/image_1759658251803_generated_image.png"
                alt="Luna Logo"
                className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-black group-hover:text-gray-700 transition-colors">Luna</span>
              <span className="text-xs font-bold text-white bg-black px-2 py-0.5 rounded-full">BETA</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            {isSignedIn && (
              <>
                <Link
                  href="/lessons"
                  className="text-gray-600 hover:text-black hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium transition-all"
                >
                  My Lessons
                </Link>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-black hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium transition-all"
                >
                  My Progress
                </Link>
              </>
            )}

            {/* User Menu */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                },
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}
