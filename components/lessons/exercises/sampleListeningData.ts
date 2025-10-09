// Sample data for testing the A1/A2 listening components

export const sampleA1ListeningData = {
  sectionId: "sample-section-a1",
  lessonId: "sample-lesson-a1", 
  userId: "sample-user",
  title: "Meeting New People",
  description: "Listen to simple conversations and answer questions about what you hear.",
  instructions: "You will hear people introducing themselves. Listen carefully and answer the questions.",
  audioUrl: "https://example.com/audio/a1-introductions.mp3", // This would be a real URL
  transcript: `
Speaker 1: Hallo, ich bin Anna. Ich komme aus Deutschland.
Speaker 2: Hi Anna! Ich heiße Tom. Ich bin aus Amerika.
Speaker 1: Freut mich, Tom! Wie alt bist du?
Speaker 2: Ich bin 25 Jahre alt. Und du?
Speaker 1: Ich bin 22.`,
  exercises: [
    {
      id: "q1",
      type: "multiple_choice" as const,
      content: {
        question: "What is the woman's name?",
        options: ["Anna", "Maria", "Lisa", "Emma"],
        correctIndex: 0
      },
      points: 1,
      explanation: "The woman says 'Hallo, ich bin Anna' which means 'Hello, I am Anna'."
    },
    {
      id: "q2", 
      type: "multiple_choice" as const,
      content: {
        question: "Where is Tom from?",
        options: ["Germany", "America", "England", "Canada"],
        correctIndex: 1
      },
      points: 1,
      explanation: "Tom says 'Ich bin aus Amerika' which means 'I am from America'."
    },
    {
      id: "q3",
      type: "true_false" as const,
      content: {
        statement: "Anna is 25 years old.",
        correctAnswer: false
      },
      points: 1,
      explanation: "Anna says 'Ich bin 22' which means she is 22 years old, not 25."
    }
  ],
  level: "A1" as const,
  theme: "Introductions",
  estimatedTime: 8
};

export const sampleA2ListeningData = {
  sectionId: "sample-section-a2",
  lessonId: "sample-lesson-a2",
  userId: "sample-user", 
  title: "Planning Weekend Activities",
  description: "Listen to a conversation about weekend plans and answer comprehension questions.",
  instructions: "Two friends are discussing their weekend plans. Listen and answer the questions about their conversation.",
  audioUrl: "https://example.com/audio/a2-weekend-plans.mp3",
  transcript: `
Maria: Was machst du am Wochenende, Klaus?
Klaus: Ich gehe am Samstag ins Kino. Möchtest du mitkommen?
Maria: Das ist eine gute Idee! Welcher Film läuft?
Klaus: Ein neuer Actionfilm. Er beginnt um 20 Uhr.
Maria: Perfekt! Und am Sonntag?
Klaus: Am Sonntag besuche ich meine Eltern. Wir essen zusammen Mittagessen.`,
  exercises: [
    {
      id: "q1",
      type: "multiple_choice" as const,
      content: {
        question: "What does Klaus plan to do on Saturday?",
        options: ["Visit his parents", "Go to the cinema", "Have lunch", "Go shopping"],
        correctIndex: 1
      },
      points: 1,
      explanation: "Klaus says 'Ich gehe am Samstag ins Kino' (I'm going to the cinema on Saturday)."
    },
    {
      id: "q2",
      type: "multiple_choice" as const,
      content: {
        question: "What time does the movie start?",
        options: ["7:00 PM", "8:00 PM", "9:00 PM", "6:00 PM"],
        correctIndex: 1
      },
      points: 1,
      explanation: "Klaus mentions 'Er beginnt um 20 Uhr' (It starts at 8:00 PM/20:00)."
    },
    {
      id: "q3",
      type: "fill_in_blank" as const,
      content: {
        text: "On Sunday, Klaus will [BLANK] his [BLANK] and have [BLANK] together.",
        answers: ["visit", "parents", "lunch"]
      },
      points: 2,
      explanation: "Klaus says he will visit his parents and have lunch together on Sunday."
    },
    {
      id: "q4",
      type: "true_false" as const,
      content: {
        statement: "Maria wants to join Klaus at the cinema.",
        correctAnswer: true
      },
      points: 1,
      explanation: "Maria responds positively saying 'Das ist eine gute Idee!' (That's a good idea!)."
    }
  ],
  level: "A2" as const,
  theme: "Weekend Activities",
  estimatedTime: 12
};

// Helper function to create lesson section data
export function createListeningSectionData(
  sectionId: string,
  title: string,
  audioUrl: string,
  transcript: string,
  exercises: any[],
  level: "A1" | "A2" = "A1",
  theme: string = "General Conversation"
) {
  return {
    id: sectionId,
    section_order: 1,
    section_type: "listening_task",
    title,
    instructions: level === "A1" 
      ? "Listen to the German audio and answer the simple questions. You can play the audio several times."
      : "Listen to the German conversation and answer the comprehension questions.",
    content: {
      audioUrl,
      transcript,
      exercises,
      theme,
      level
    },
    estimated_duration: level === "A1" ? 8 : 12,
    is_required: true
  };
}

// Export example data for different scenarios
export const exampleListeningSections = {
  a1: {
    introductions: createListeningSectionData(
      "a1-intro-section",
      "Introducing Yourself",
      sampleA1ListeningData.audioUrl,
      sampleA1ListeningData.transcript,
      sampleA1ListeningData.exercises,
      "A1",
      "Personal Information"
    ),
    family: createListeningSectionData(
      "a1-family-section", 
      "Talking About Family",
      "https://example.com/audio/a1-family.mp3",
      "Speaker: Das ist meine Familie. Mein Vater heißt Hans. Meine Mutter heißt Petra. Ich habe einen Bruder.",
      [
        {
          id: "family-q1",
          type: "multiple_choice",
          content: {
            question: "What is the father's name?",
            options: ["Peter", "Hans", "Klaus", "Tom"],
            correctIndex: 1
          },
          points: 1
        }
      ],
      "A1",
      "Family"
    )
  },
  a2: {
    weekend: createListeningSectionData(
      "a2-weekend-section",
      "Weekend Plans", 
      sampleA2ListeningData.audioUrl,
      sampleA2ListeningData.transcript,
      sampleA2ListeningData.exercises,
      "A2",
      "Leisure Activities"
    ),
    shopping: createListeningSectionData(
      "a2-shopping-section",
      "At the Store",
      "https://example.com/audio/a2-shopping.mp3",
      "Verkäufer: Guten Tag! Kann ich Ihnen helfen?\nKunde: Ja, ich suche ein Hemd. Haben Sie Größe M?",
      [
        {
          id: "shop-q1",
          type: "multiple_choice",
          content: {
            question: "What is the customer looking for?",
            options: ["A shirt", "Pants", "Shoes", "A jacket"],
            correctIndex: 0
          },
          points: 1
        }
      ],
      "A2", 
      "Shopping"
    )
  }
};