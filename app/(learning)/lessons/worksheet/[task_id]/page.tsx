/**
 * Student view page for worksheets
 * Displays published worksheets for students to view, download, or print
 */

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { FileText, Download, Printer, ArrowLeft, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface WorksheetData {
  task_id: string
  title: string
  worksheet_type: string
  topic: string
  grade_level: string
  published_image_url: string
  generated_content: any
  created_at: string
  student_views: number
  student_downloads?: number
}

export default function WorksheetViewPage() {
  const params = useParams()
  const taskId = params.task_id as string
  
  const [worksheet, setWorksheet] = useState<WorksheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorksheet()
  }, [taskId])

  const fetchWorksheet = async () => {
    try {
      // Fetch worksheet data
      const { data, error: fetchError } = await supabase
        .from("worksheet_tasks")
        .select("*")
        .eq("task_id", taskId)
        .eq("status", "published")
        .single()

      if (fetchError || !data) {
        throw new Error("Worksheet not found or not yet published")
      }

      setWorksheet({
        task_id: data.task_id,
        title: data.title,
        worksheet_type: data.worksheet_type,
        topic: data.topic,
        grade_level: data.grade_level,
        published_image_url: data.published_image_url,
        generated_content: data.content || data.generated_content,
        created_at: data.created_at,
        student_views: data.student_views || 0,
        student_downloads: data.student_downloads || 0
      })

      // Increment view count
      await supabase
        .from("worksheet_tasks")
        .update({ 
          student_views: (data.student_views || 0) + 1 
        })
        .eq("task_id", taskId)

    } catch (err) {
      console.error("Error fetching worksheet:", err)
      setError(err instanceof Error ? err.message : "Failed to load worksheet")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!worksheet?.published_image_url) return

    try {
      // Increment download count
      await supabase
        .from("worksheet_tasks")
        .update({ 
          student_downloads: (worksheet?.student_downloads || 0) + 1 
        })
        .eq("task_id", taskId)

      // Open image in new tab for download
      window.open(worksheet.published_image_url, "_blank")
    } catch (err) {
      console.error("Error downloading worksheet:", err)
    }
  }

  const handlePrint = () => {
    if (!worksheet?.published_image_url) return
    
    // Create a new window with just the image for printing
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${worksheet.title || "Worksheet"}</title>
            <style>
              body { margin: 0; padding: 0; }
              img { 
                max-width: 100%; 
                height: auto; 
                display: block; 
                margin: 0 auto;
              }
              @media print {
                body { margin: 0; }
                img { max-width: 100%; }
              }
            </style>
          </head>
          <body>
            <img src="${worksheet.published_image_url}" alt="Worksheet" onload="window.print();" />
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const getWorksheetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      math: "Math Problems",
      vocabulary: "Vocabulary Practice",
      grammar: "Grammar Exercises",
      reading: "Reading Comprehension",
      writing: "Writing Practice",
      custom: "Custom Worksheet"
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading worksheet...</p>
        </div>
      </div>
    )
  }

  if (error || !worksheet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <FileText className="h-12 w-12 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-800">Worksheet Not Available</h2>
          <p className="text-gray-600">{error || "This worksheet could not be found."}</p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {worksheet.title || `${getWorksheetTypeLabel(worksheet.worksheet_type)} Worksheet`}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {getWorksheetTypeLabel(worksheet.worksheet_type)}
                  </span>
                  <span>•</span>
                  <span>Topic: {worksheet.topic}</span>
                  <span>•</span>
                  <span>Level: {worksheet.grade_level}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-gray-50"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Instructions if available */}
          {worksheet.generated_content?.instructions && (
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-medium text-gray-900 mb-2">Instructions</h2>
              <p className="text-gray-700">{worksheet.generated_content.instructions}</p>
            </div>
          )}

          {/* Worksheet Image */}
          <div className="p-8 bg-white">
            <img
              src={worksheet.published_image_url}
              alt={worksheet.title || "Worksheet"}
              className="w-full h-auto max-w-4xl mx-auto shadow-lg rounded-lg"
            />
          </div>

          {/* Footer Info */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>Created: {new Date(worksheet.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Views: {worksheet.student_views || 0}</span>
              </div>
              <div className="text-xs text-gray-500">
                Worksheet ID: {worksheet.task_id.slice(0, 8)}
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Tips for Students</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Read the instructions carefully before starting</li>
            <li>• Take your time to complete each question</li>
            <li>• You can download or print this worksheet to work offline</li>
            <li>• Ask your teacher if you need help with any questions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}