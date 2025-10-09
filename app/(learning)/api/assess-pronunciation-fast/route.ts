import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fast pronunciation assessment endpoint that accepts WebM/Opus directly
// This eliminates the need for conversion via materials backend
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 [FAST] Starting fast pronunciation assessment...');
    
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const referenceText = formData.get("referenceText") as string;
    const language = formData.get("language") as string || "de-DE"; // Default to German

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log('🚀 [FAST] Audio file details:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      sizeKB: Math.round(audioFile.size / 1024),
      referenceText,
      language,
      duration: audioFile.size > 0 ? `~${Math.round(audioFile.size / 6000)}s (estimated)` : 'unknown'
    });

    // Call materials backend pronunciation assessment endpoint directly
    console.log('🚀 [FAST] Calling materials backend pronunciation assessment directly...');
    
    try {
      const materialsFormData = new FormData();
      materialsFormData.append("audio", audioFile);
      materialsFormData.append("reference_text", referenceText);
      materialsFormData.append("language", language);

      const materialsStartTime = Date.now();
      const response = await fetch("http://materials-backend-api.eastus.azurecontainer.io:8000/assess-pronunciation", {
        method: 'POST',
        body: materialsFormData
      });

      const materialsProcessingTime = Date.now() - materialsStartTime;
      console.log('🚀 [FAST] Materials backend response in', materialsProcessingTime, 'ms');

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚀 [FAST] Materials backend failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        return NextResponse.json({
          error: `Materials backend pronunciation assessment failed: ${response.status} - ${errorText}`,
          materialsProcessingTime
        }, { status: response.status });
      }

      const result = await response.json();
      const totalProcessingTime = Date.now() - startTime;
      
      console.log('🚀 [FAST] Materials backend result:', {
        success: result.success,
        recognizedText: result.recognized_text,
        pronunciationScore: result.scores?.pronunciation_score,
        processingTime: totalProcessingTime
      });

      if (!result.success) {
        console.error('🚀 [FAST] Assessment failed:', result.error);
        return NextResponse.json({
          error: `Pronunciation assessment failed: ${result.error}`,
          processingTime: totalProcessingTime,
          materialsProcessingTime
        }, { status: 400 });
      }

      // Convert materials backend response to expected frontend format
      const words = result.words?.map((word: any) => ({
        word: word.word,
        accuracyScore: word.accuracy_score || 0,
        errorType: word.error_type || 'None'
      })) || [];

      console.log('🚀 [FAST] ✅ Success! Pronunciation assessment completed in', totalProcessingTime, 'ms');

      return NextResponse.json({
        recognizedText: result.recognized_text,
        referenceText,
        scores: {
          accuracyScore: result.scores?.accuracy_score || 0,
          fluencyScore: result.scores?.fluency_score || 0,
          completenessScore: result.scores?.completeness_score || 0,
          pronunciationScore: result.scores?.pronunciation_score || 0,
          prosodyScore: result.scores?.prosody_score || 0
        },
        words,
        processingTime: totalProcessingTime,
        materialsProcessingTime,
        method: 'Materials Backend Direct Assessment'
      });

    } catch (materialsError) {
      console.error('🚀 [FAST] Materials backend error:', materialsError);
      return NextResponse.json({
        error: `Materials backend error: ${materialsError instanceof Error ? materialsError.message : String(materialsError)}`,
        processingTime: Date.now() - startTime
      }, { status: 500 });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('🚀 [FAST] ❌ Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
      processingTime,
      method: 'Fast REST API (No Conversion)'
    }, { status: 500 });
  }
}