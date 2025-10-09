'use client'
import { SignIn, useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function SignInContent() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url')
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.publicMetadata as { role?: string, is_teacher?: boolean, is_institute_admin?: boolean }

      // If user has a role, redirect to dashboard (which will route them correctly)
      // If no role, redirect to role selection
      const destination = redirectUrl || (metadata?.role || metadata?.is_teacher || metadata?.is_institute_admin ? '/dashboard' : '/role-selection')
      router.push(destination)
    }
  }, [isLoaded, user, redirectUrl, router])

  // Show loading while checking auth status
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirect message if user is signed in
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-lg border border-gray-200 bg-white w-full",
                formButtonPrimary:
                  "bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm normal-case shadow-sm transition-colors w-full py-2.5 px-4 rounded-md",
                footerActionLink:
                  "text-blue-600 hover:text-blue-700 font-medium",
                formFieldInput:
                  "border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full text-gray-900 rounded-md",
              },
            }}
            routing="path"
            path="/sign-in"
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="py-6 px-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center text-xs text-gray-600">
          <p>
            By signing in, you agree to our collection of learning data (test scores, progress, and completed lessons)
            to improve your educational experience. We use secure IDs and do not share personal information.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}