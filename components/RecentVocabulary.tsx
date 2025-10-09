'use client'

import { useState, useEffect } from 'react'
import { Book, Clock, ExternalLink, Bookmark, BookOpen, CheckCircle, XCircle, HelpCircle, RefreshCw, BookOpenCheck } from 'lucide-react'
import { VocabularyItem } from '@/lib/interfaces'
import { fetchUserVocabulary, updateVocabularyStatus } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { motion, AnimatePresence } from 'framer-motion'

// Status icon mapping
const StatusIcons = {
  not_started: <HelpCircle className="h-4 w-4 text-gray-400" />,
  not_learned: <XCircle className="h-4 w-4 text-red-500" />,
  partially_learned: <RefreshCw className="h-4 w-4 text-yellow-500" />,
  second_chance: <RefreshCw className="h-4 w-4 text-blue-500" />,
  learned: <CheckCircle className="h-4 w-4 text-green-500" />
}

// Status labels
const StatusLabels = {
  not_started: 'Not started',
  not_learned: 'Not learned',
  partially_learned: 'Partially learned',
  second_chance: 'Review',
  learned: 'Learned'
}

export function RecentVocabulary() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const router = useRouter()

  // Load vocabulary on component mount
  useEffect(() => {
    async function loadVocabulary() {
      setLoading(true)
      try {
        // Fetch the 15 most recent vocabulary items
        const items = await fetchUserVocabulary(15)
        setVocabulary(items)
      } catch (err) {
        console.error('Error loading vocabulary:', err)
        setError(err instanceof Error ? err.message : 'Failed to load vocabulary')
      } finally {
        setLoading(false)
      }
    }

    loadVocabulary()
  }, [])

  const handleViewAllClick = () => {
    router.push('/dashboard/vocabulary')
  }

  // Handle status update for a vocabulary item
  const handleStatusUpdate = async (id: number, newStatus: VocabularyItem['status']) => {
    setUpdatingId(id)
    try {
      const updatedItem = await updateVocabularyStatus(id, newStatus)
      // Update the item in the state
      setVocabulary(prev => 
        prev.map(item => item.id === id ? updatedItem : item)
      )
    } catch (err) {
      console.error('Error updating vocabulary status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Group vocabulary by source (paper_id)
  const groupedVocabulary = vocabulary.reduce((groups, item) => {
    // Create a source key based on paper_id or 'unknown'
    const source = item.paper_id || 'unknown'
    
    if (!groups[source]) {
      groups[source] = []
    }
    
    groups[source].push(item)
    return groups
  }, {} as Record<string, VocabularyItem[]>)

  if (loading) {
    return (
      <Card className="rounded-xl border-none shadow-lg overflow-hidden h-full">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <CardTitle className="flex items-center">
            <BookOpenCheck className="h-5 w-5 mr-2" />
            My Vocabulary Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-xl border-none shadow-lg overflow-hidden h-full">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <CardTitle className="flex items-center">
            <BookOpenCheck className="h-5 w-5 mr-2" />
            My Vocabulary Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <p className="text-sm text-red-700">Error loading vocabulary: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (vocabulary.length === 0) {
    return (
      <Card className="rounded-xl border-none shadow-lg overflow-hidden h-full">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <CardTitle className="flex items-center">
            <BookOpenCheck className="h-5 w-5 mr-2" />
            My Vocabulary Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Book className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You haven't looked up any words yet. Start reading in learn mode and click on words to build your vocabulary!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort groups by most recent item
  const sortedGroups = Object.entries(groupedVocabulary)
    .sort((a, b) => {
      const aDate = new Date(a[1][0].created_at).getTime()
      const bDate = new Date(b[1][0].created_at).getTime()
      return bDate - aDate
    })
    .slice(0, 3) // Limit to 3 most recent groups

  return (
    <Card className="rounded-xl border-none shadow-lg overflow-hidden h-full">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-xl">
            <BookOpenCheck className="h-5 w-5 mr-2" />
            My Vocabulary Collection
          </CardTitle>
          <button 
            onClick={handleViewAllClick}
            className="text-white hover:text-emerald-100 flex items-center text-sm font-medium bg-white/10 px-3 py-1 rounded-full transition-colors duration-200"
          >
            View All <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {sortedGroups.map(([source, items], groupIndex) => (
            <motion.div 
              key={source}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <Card className="overflow-hidden border border-gray-200 rounded-lg shadow-sm bg-white">
                <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="p-1.5 bg-emerald-100 rounded-full mr-2">
                      <Bookmark className="text-emerald-600 h-3.5 w-3.5" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-700">
                      {source === 'unknown' ? 'Miscellaneous' : `Source: ${source}`}
                    </h4>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 font-medium">{items.length} words</span>
                </div>
                
                <div className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {items.slice(0, 4).map((item, itemIndex) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: itemIndex * 0.05 + 0.1 }}
                        className="p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{item.term}</p>
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100" 
                                    title={StatusLabels[item.status || 'not_started']}>
                                {StatusIcons[item.status || 'not_started']}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{item.definition}</p>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap ml-2 flex flex-col items-end gap-2">
                            <span className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>

                            <div className="flex gap-1 bg-white p-1 rounded-full shadow-sm">
                              {updatingId === item.id ? (
                                <span className="px-2 py-0.5 animate-pulse text-xs">Updating...</span>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleStatusUpdate(item.id, 'not_learned')} 
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                    title="Mark as not learned"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleStatusUpdate(item.id, 'partially_learned')} 
                                    className="text-yellow-500 hover:text-yellow-700 p-1 rounded-full hover:bg-yellow-50 transition-colors"
                                    title="Mark as partially learned"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleStatusUpdate(item.id, 'learned')} 
                                    className="text-green-500 hover:text-green-700 p-1 rounded-full hover:bg-green-50 transition-colors"
                                    title="Mark as learned"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {items.length > 4 && (
                    <div className="p-2 bg-emerald-50 text-center">
                      <button 
                        onClick={handleViewAllClick}
                        className="text-emerald-600 text-xs hover:text-emerald-800 font-medium"
                      >
                        {items.length - 4} more words...
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
          
          {Object.keys(groupedVocabulary).length > 3 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-6"
            >
              <button 
                onClick={handleViewAllClick}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-colors duration-200"
              >
                View All Vocabulary
              </button>
            </motion.div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  )
} 