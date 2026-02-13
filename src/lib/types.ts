export interface GlossaryTerm {
    id?: string;
    term: string;
    context: string;
    definitionDe: string;
    definitionEn: string;
    einfacheSprache: string;
    eselsleitern: string[];
    source: string;
    status: 'pending' | 'approved';
    createdBy: string;
    createdByName: string;
    createdAt: Date | any;
    updatedAt: Date | any;
    reviewedBy?: string;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    avatarId: string;
    createdAt: Date | any;
}

export interface QuizQuestion {
    id?: string;
    term: string;
    question: string;
    correctAnswer: string;
    wrongAnswers: string[];
    category: string;
    createdAt: Date | any;
    generatedBy: 'llm' | 'manual';
}

export interface QuizResult {
    id?: string;
    score: number;
    totalQuestions: number;
    answers: { questionId: string; correct: boolean; userAnswer: string }[];
    createdAt: Date | any;
    category: string;
}

// Hospital-themed avatars
export const AVATARS = [
    { id: 'doctor', label: 'Ärztin/Arzt', emoji: '🩺' },
    { id: 'nurse', label: 'Pflege', emoji: '👩‍⚕️' },
    { id: 'surgeon', label: 'Chirurgie', emoji: '🔬' },
    { id: 'pharmacist', label: 'Pharmazie', emoji: '💊' },
    { id: 'researcher', label: 'Forschung', emoji: '🧬' },
    { id: 'therapist', label: 'Therapie', emoji: '🧠' },
    { id: 'paramedic', label: 'Rettung', emoji: '🚑' },
    { id: 'lab', label: 'Labor', emoji: '🧪' },
    { id: 'admin', label: 'Administration', emoji: '📋' },
    { id: 'it', label: 'IT / Technik', emoji: '💻' },
    { id: 'heart', label: 'Kardiologie', emoji: '❤️' },
    { id: 'baby', label: 'Geburtshilfe', emoji: '👶' },
];
