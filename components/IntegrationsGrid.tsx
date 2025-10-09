import React from 'react'
import { Youtube, FileText, Link as LinkIcon, FolderOpen, School, LayoutPanelLeft } from 'lucide-react'

const items = [
  { icon: Youtube, label: 'YouTube' },
  { icon: FileText, label: 'PDF & Docs' },
  { icon: LinkIcon, label: 'Web Links' },
  { icon: FolderOpen, label: 'Content Bank' },
  { icon: School, label: 'Google Classroom' },
  { icon: LayoutPanelLeft, label: 'LMS (Canvas/Moodle)' },
]

export default function IntegrationsGrid() {
  return (
    <section className="py-20 bg-[#FDFBF9]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#2D3748] mb-3">Plays well with your stack</h2>
          <p className="text-[#4A5568] text-lg">Import content in seconds and assign where your students already are</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#E8E4E1] bg-white hover:shadow-sm">
              <div className="p-3 rounded-lg bg-[#2D3748] text-white"><Icon className="w-5 h-5" /></div>
              <span className="text-sm text-[#374151] font-medium">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-[#6B7280] mt-4">Deeper LMS integrations rolling out over the next releases</p>
      </div>
    </section>
  )
}

