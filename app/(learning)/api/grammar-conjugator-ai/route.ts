import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Grammar conjugation feedback tool
const conjugationFeedbackTool = tool({
  description: 'Provide detailed feedback on German verb conjugation attempts',
  parameters: z.object({
    verb: z.string().describe('The German infinitive verb'),
    tense: z.string().describe('The target tense'),
    pronoun: z.string().describe('The pronoun used'),
    userAnswer: z.string().describe('The user\'s conjugation attempt'),
    correctAnswer: z.string().describe('The correct conjugation'),
    isCorrect: z.boolean().describe('Whether the user\'s answer is correct'),
    explanation: z.string().describe('Detailed explanation of the conjugation rule'),
    culturalContext: z.string().optional().describe('Cultural context or usage notes'),
    mnemonicTip: z.string().optional().describe('Memory aid or mnemonic device'),
    commonMistakes: z.array(z.string()).optional().describe('Common errors with this verb'),
    nextSuggestion: z.string().optional().describe('Suggestion for next practice verb or tense')
  }),
  execute: async ({ verb, tense, pronoun, userAnswer, correctAnswer, isCorrect, explanation, culturalContext, mnemonicTip, commonMistakes, nextSuggestion }) => {
    return {
      feedback: {
        verb,
        tense,
        pronoun,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation,
        culturalContext,
        mnemonicTip,
        commonMistakes,
        nextSuggestion
      }
    };
  }
});

// Personalized practice generation tool
const practiceGeneratorTool = tool({
  description: 'Generate personalized German verb practice questions based on user progress',
  parameters: z.object({
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Current difficulty level'),
    focusAreas: z.array(z.string()).describe('Areas needing practice (e.g., irregular verbs, separable verbs)'),
    verbType: z.string().describe('Type of verb to practice'),
    tense: z.string().describe('Tense to focus on'),
    culturalContext: z.boolean().optional().describe('Include cultural context'),
    scenario: z.string().optional().describe('Real-world scenario for the exercise')
  }),
  execute: async ({ difficulty, focusAreas, verbType, tense, culturalContext, scenario }) => {
    return {
      exercise: {
        difficulty,
        focusAreas,
        verbType,
        tense,
        culturalContext,
        scenario,
        generated: true
      }
    };
  }
});

// Learning analytics tool
const learningAnalyticsTool = tool({
  description: 'Analyze user learning patterns and provide insights',
  parameters: z.object({
    userId: z.string().describe('User identifier'),
    sessionData: z.object({
      correctAnswers: z.number(),
      totalQuestions: z.number(),
      timeSpent: z.number(),
      verbsAttempted: z.array(z.string()),
      difficultAreas: z.array(z.string())
    }).describe('Current session performance data'),
    insights: z.array(z.string()).describe('Learning insights and recommendations'),
    nextSteps: z.array(z.string()).describe('Recommended next learning steps')
  }),
  execute: async ({ userId, sessionData, insights, nextSteps }) => {
    return {
      analytics: {
        userId,
        sessionData,
        insights,
        nextSteps,
        timestamp: new Date().toISOString()
      }
    };
  }
});

// Conversational practice tool
const conversationPracticeTool = tool({
  description: 'Generate conversational scenarios for verb practice',
  parameters: z.object({
    verb: z.string().describe('The target verb to practice'),
    scenario: z.string().describe('Conversational scenario'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Difficulty level'),
    culturalSetting: z.string().optional().describe('German cultural setting'),
    dialogue: z.array(z.object({
      speaker: z.string(),
      message: z.string(),
      conjugationFocus: z.string().optional()
    })).describe('Generated dialogue for practice')
  }),
  execute: async ({ verb, scenario, difficulty, culturalSetting, dialogue }) => {
    return {
      conversation: {
        verb,
        scenario,
        difficulty,
        culturalSetting,
        dialogue
      }
    };
  }
});

export async function POST(request: Request) {
  const { messages, userId, currentVerb, currentTense, currentPronoun, learningGoals, sessionData, learningPattern } = await request.json();

  try {
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      tools: {
        conjugationFeedback: conjugationFeedbackTool,
        practiceGenerator: practiceGeneratorTool,
        learningAnalytics: learningAnalyticsTool,
        conversationPractice: conversationPracticeTool
      },
      system: `You are an expert German language tutor specializing in verb conjugation. Your role is to:

1. **Conjugation Analysis**: Provide accurate, detailed feedback on German verb conjugations with explanations of grammar rules
2. **Personalized Learning**: Adapt to user skill level and learning patterns to provide targeted practice
3. **Cultural Context**: Include cultural insights and real-world usage examples
4. **Memory Aids**: Provide mnemonics, patterns, and tips to help remember conjugation rules
5. **Error Analysis**: Identify common mistakes and provide specific guidance to avoid them

Key Principles:
- Be encouraging and supportive, especially with beginners
- Explain not just what is correct, but WHY it's correct
- Connect grammar to practical communication situations
- Use the tools to provide structured feedback and generate personalized exercises
- Include cultural context to make learning more engaging and authentic

Current Context:
- User ID: ${userId}
- Current Verb: ${currentVerb}
- Current Tense: ${currentTense}
- Current Pronoun: ${currentPronoun}
- Learning Goals: ${learningGoals?.join(', ') || 'General improvement'}
- Session Data: ${sessionData ? JSON.stringify(sessionData) : 'New session'}

German Conjugation Rules Reference:
- Present tense regular verbs: stem + (e, st, t, en, t, en)
- Past tense regular verbs: stem + (te, test, te, ten, tet, ten)
- Irregular verbs have unique patterns that must be memorized
- Separable verbs split in main clauses: prefix goes to end
- Perfect tense uses haben/sein + past participle
- Modal verbs follow special patterns

Always use the appropriate tools when:
- Checking conjugations (conjugationFeedbackTool)
- Generating practice exercises (practiceGeneratorTool)
- Analyzing learning progress (learningAnalyticsTool)
- Creating conversation scenarios (conversationPracticeTool)`,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in grammar conjugator AI route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}