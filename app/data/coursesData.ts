import { Award, BookOpen, Target } from "lucide-react";

export interface CourseSection {
  name: string;
  duration: string;
  marks: string;
  tasks: string;
  description: string;
}

export interface Course {
  id: string;
  title: string;
  organization: string;
  level: string;
  description: string;
  longDescription?: string;
  href: string;
  icon?: React.ElementType;
  badgeColor?: string;
  totalDuration?: string;
  passingScore?: string;
  examFee?: string;
  sections?: CourseSection[];
  highlights?: string[];
}

// Goethe-Institut German courses
export const coursesData: Course[] = [
  {
    id: "goethe-a1",
    title: "Goethe-Zertifikat A1: Start Deutsch 1",
    organization: "Goethe-Institut",
    level: "A1",
    description: "For beginners with basic German skills. Certifies very basic language competence.",
    longDescription: "The Goethe-Zertifikat A1: Start Deutsch 1 is a German language exam for adults that certifies very basic language skills and corresponds to the first level (A1) on the six-level scale of competence laid down in the Common European Framework of Reference for Languages (CEFR). This examination is suitable for adults and young people.",
    href: "/dashboard",
    icon: Target,
    badgeColor: "bg-blue-100 text-blue-700",
    totalDuration: "80 minutes",
    passingScore: "60 out of 100 points",
    examFee: "€70-120 (varies by location)",
    sections: [
      {
        name: "Listening (Hören)",
        duration: "20 minutes",
        marks: "25",
        tasks: "4 parts",
        description: "Short conversations, announcements, and dialogues"
      },
      {
        name: "Reading (Lesen)",
        duration: "25 minutes",
        marks: "25",
        tasks: "3 parts",
        description: "Short texts, signs, and simple messages"
      },
      {
        name: "Writing (Schreiben)",
        duration: "20 minutes",
        marks: "25",
        tasks: "2 parts",
        description: "Filling out forms and writing short messages"
      },
      {
        name: "Speaking (Sprechen)",
        duration: "15 minutes",
        marks: "25",
        tasks: "3 parts",
        description: "Self-presentation and simple conversations"
      }
    ],
    highlights: [
      "Internationally recognized certification",
      "Perfect for visa applications",
      "Foundation for further German studies",
      "Practical everyday communication focus"
    ]
  },
  {
    id: "goethe-a2",
    title: "Goethe-Zertifikat A2",
    organization: "Goethe-Institut",
    level: "A2",
    description: "Elementary level certification for basic communication skills.",
    longDescription: "The Goethe-Zertifikat A2 is a German exam for adults that certifies elementary language skills and corresponds to the second level (A2) on the six-level scale of competence laid down in the Common European Framework of Reference for Languages (CEFR).",
    href: "/dashboard",
    icon: BookOpen,
    badgeColor: "bg-green-100 text-green-700",
    totalDuration: "105 minutes",
    passingScore: "60 out of 100 points",
    examFee: "€80-140 (varies by location)",
    highlights: [
      "Elementary level certification",
      "Covers routine communication",
      "Internationally recognized",
      "Preparation for B1 level"
    ]
  },
  {
    id: "goethe-b1",
    title: "Goethe-Zertifikat B1",
    organization: "Goethe-Institut",
    level: "B1",
    description: "Intermediate level certification for independent language use.",
    longDescription: "The Goethe-Zertifikat B1 is a German exam for young people and adults that certifies intermediate German language skills according to the third level (B1) on the six-level scale of competence laid down in the Common European Framework of Reference for Languages (CEFR).",
    href: "/dashboard",
    icon: Award,
    badgeColor: "bg-orange-100 text-orange-700",
    totalDuration: "180 minutes",
    passingScore: "60% per module",
    examFee: "€100-180 (varies by location)",
    highlights: [
      "Intermediate level certification",
      "Independent language use",
      "University preparation",
      "Work opportunities"
    ]
  }
];