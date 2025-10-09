'use client'

export function FeaturesOverviewSection() {
  return (
    <div className="relative overflow-hidden py-16 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 backdrop-blur-sm"></div>
      <div className="relative max-w-4xl mx-auto">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-sm font-medium text-blue-300 tracking-wide uppercase">Teaching Platform</span>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              Teach Smarter, Not Harder
            </h2>
            <p className="text-xl sm:text-2xl font-medium text-blue-200/90">
              AI-powered tools for modern educators
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-gray-300 leading-relaxed">
              Luna provides comprehensive teaching tools that help you create engaging lessons, automate grading, track student progress, and personalize learning experiences for each student.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
