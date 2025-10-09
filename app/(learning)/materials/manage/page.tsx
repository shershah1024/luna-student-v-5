'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Share2,
  Archive,
  Calendar,
  FileText,
  Users,
  MoreVertical,
  Loader2,
  PlayCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MaterialDisplay from '@/components/materials/MaterialDisplay';

// Types based on our database schema
interface TeachezeeMaterial {
  id: string;
  user_id: string;
  type: 'reading_passage' | 'reading_test' | 'listening_test';
  title: string;
  content: string;
  cefr_level: string;
  difficulty_score: number;
  target_audience?: string;
  metadata: {
    key_vocabulary?: string[];
    main_concepts?: string[];
    learning_objectives?: string[];
    summary?: string;
    word_count?: number;
    total_questions?: number;
    total_points?: number;
    generation_source?: string;
    [key: string]: any;
  };
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface TeachezeeQuestion {
  id: string;
  material_id: string;
  question_number: number;
  question_type: string;
  question_text: string;
  points: number;
  explanation?: string;
  answer_data: any;
  created_at: string;
}

interface MaterialsResponse {
  success: boolean;
  data: TeachezeeMaterial[];
  metadata: {
    count: number;
    limit: number;
    offset: number;
    filters: {
      type?: string;
      status?: string;
      cefr_level?: string;
    };
  };
}

export default function MaterialsManagePage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<TeachezeeMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<TeachezeeMaterial | null>(null);
  const [materialQuestions, setMaterialQuestions] = useState<TeachezeeQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Fetch materials from API
  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterLevel !== 'all') params.set('cefr_level', filterLevel);
      params.set('limit', '50');

      const response = await fetch(`/api/materials/list?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch materials');
      }

      const data: MaterialsResponse = await response.json();
      setMaterials(data.data);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch questions for a specific material
  const fetchMaterialQuestions = async (materialId: string) => {
    try {
      setIsLoadingQuestions(true);
      const response = await fetch(`/api/materials/questions?material_id=${materialId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setMaterialQuestions(data.data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setMaterialQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [filterType, filterStatus, filterLevel]);

  // Filter materials based on search term
  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.tags && material.tags.some(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const handleViewMaterial = (material: TeachezeeMaterial) => {
    setSelectedMaterial(material);
    if (material.type === 'reading_test') {
      fetchMaterialQuestions(material.id);
    } else {
      setMaterialQuestions([]);
    }
  };

  const handleEditMaterial = (material: TeachezeeMaterial) => {
    // Navigate to edit page (to be implemented)
    console.log('Edit material:', material.id);
  };

  const handleShareMaterial = (material: TeachezeeMaterial) => {
    // Implement sharing functionality
    console.log('Share material:', material.id);
  };

  const handleArchiveMaterial = async (material: TeachezeeMaterial) => {
    // Implement archive functionality
    console.log('Archive material:', material.id);
  };

  const handleUseMaterialInLesson = (material: TeachezeeMaterial) => {
    // Navigate to reading lesson interface with material ID
    const taskId = `material-${material.id}`;
    router.push(`/lessons/reading/${taskId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Materials Management</h1>
            <p className="text-gray-600">Create, organize, and manage your reading materials</p>
          </div>
          <Button 
            onClick={() => router.push('/materials/reading/create')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Material
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Material Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="reading_passage">Reading Passage</SelectItem>
              <SelectItem value="reading_test">Reading Test</SelectItem>
              <SelectItem value="listening_test">Listening Test</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="CEFR Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="A1">A1</SelectItem>
              <SelectItem value="A2">A2</SelectItem>
              <SelectItem value="B1">B1</SelectItem>
              <SelectItem value="B2">B2</SelectItem>
              <SelectItem value="C1">C1</SelectItem>
              <SelectItem value="C2">C2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Material Display Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Material Preview</h2>
              <Button 
                variant="outline" 
                onClick={() => setSelectedMaterial(null)}
              >
                Close
              </Button>
            </div>
            <div className="p-6">
              {isLoadingQuestions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading questions...
                </div>
              ) : (
                <MaterialDisplay
                  material={selectedMaterial}
                  questions={materialQuestions}
                  mode="preview"
                  onEdit={handleEditMaterial}
                  onShare={handleShareMaterial}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Materials Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Loading materials...</span>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No materials found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterLevel !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first material to get started'}
            </p>
            <Button 
              onClick={() => router.push('/materials/reading/create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight mb-2 truncate">
                      {material.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {material.cefr_level}
                      </Badge>
                      <Badge 
                        variant={material.type === 'reading_test' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {material.type === 'reading_passage' ? 'Passage' : 'Test'}
                      </Badge>
                      <Badge 
                        variant={material.status === 'published' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {material.status}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewMaterial(material)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditMaterial(material)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareMaterial(material)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUseMaterialInLesson(material)}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Use in Lesson
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveMaterial(material)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {material.metadata.summary || 
                   material.content.substring(0, 120) + (material.content.length > 120 ? '...' : '')}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-3">
                    {material.metadata.word_count && (
                      <span>~{material.metadata.word_count} words</span>
                    )}
                    {material.metadata.total_questions && (
                      <span>{material.metadata.total_questions} questions</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(material.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewMaterial(material)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleUseMaterialInLesson(material)}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Use
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditMaterial(material)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}