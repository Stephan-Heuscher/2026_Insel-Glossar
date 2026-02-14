"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useGlossaryStore } from '@/store/glossaryStore';
import { QuizQuestion } from '@/lib/types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RotateCw, Trophy, ArrowRight, Check, X, Sparkles } from 'lucide-react';

type QuizState = 'setup' | 'playing' | 'result';

export default function QuizPage() {
    const { user } = useAuthStore();
    const { terms, quizQuestions, subscribeToTerms, subscribeToQuizQuestions } = useGlossaryStore();
    const [state, setState] = useState<QuizState>('setup');
    const [questionCount, setQuestionCount] = useState(10);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [answers, setAnswers] = useState<{ questionId: string; correct: boolean; userAnswer: string }[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub1 = subscribeToTerms();
        const unsub2 = subscribeToQuizQuestions();
        return () => { unsub1(); unsub2(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Generate questions from terms if not enough saved quiz questions
    const generateQuestionsFromTerms = (count: number): QuizQuestion[] => {
        const generated: QuizQuestion[] = [];
        const shuffledTerms = [...terms].sort(() => Math.random() - 0.5);

        for (let i = 0; i < Math.min(count, shuffledTerms.length); i++) {
            const term = shuffledTerms[i];
            if (!term.definitionDe) continue;

            // Get 3 random wrong answers from other terms
            const otherTerms = shuffledTerms.filter((_, j) => j !== i && shuffledTerms[j].definitionDe);
            const wrongAnswers = otherTerms
                .slice(0, 3)
                .map(t => t.definitionDe.substring(0, 150));

            generated.push({
                id: `gen_${i}`,
                term: term.term,
                question: `Was bedeutet "${term.term}"?`,
                correctAnswer: term.definitionDe.substring(0, 150),
                wrongAnswers,
                category: term.context || 'Allgemein',
                createdAt: new Date(),
                generatedBy: 'manual',
            });
        }
        return generated;
    };

    const startQuiz = () => {
        // Mix saved quiz questions with generated ones
        let allQuestions: QuizQuestion[] = [...quizQuestions];

        if (allQuestions.length < questionCount) {
            const generated = generateQuestionsFromTerms(questionCount - allQuestions.length);
            allQuestions = [...allQuestions, ...generated];
        }

        // Shuffle and take the requested count
        allQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount);

        if (allQuestions.length === 0) return;

        setQuestions(allQuestions);
        setCurrentIndex(0);
        setAnswers([]);
        setSelectedAnswer(null);
        setIsRevealed(false);
        setState('playing');
    };

    const handleAnswer = (answer: string) => {
        if (isRevealed) return;
        setSelectedAnswer(answer);
        setIsRevealed(true);

        const correct = answer === currentQuestion?.correctAnswer;
        setAnswers([...answers, {
            questionId: currentQuestion?.id || '',
            correct,
            userAnswer: answer,
        }]);
    };

    const nextQuestion = () => {
        if (currentIndex + 1 >= questions.length) {
            setState('result');
            return;
        }
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setIsRevealed(false);
    };

    const saveResult = async () => {
        if (!user) return;
        setSaving(true);
        const score = answers.filter(a => a.correct).length;
        await addDoc(collection(db, 'users', user.uid, 'quizResults'), {
            score,
            totalQuestions: questions.length,
            answers,
            category: 'Allgemein',
            createdAt: serverTimestamp(),
        });
        setSaving(false);
    };

    const currentQuestion = questions[currentIndex];
    const allAnswers = useMemo(() => {
        if (!currentQuestion) return [];
        return [currentQuestion.correctAnswer, ...currentQuestion.wrongAnswers]
            .sort(() => Math.random() - 0.5);
    }, [currentQuestion]);

    const score = answers.filter(a => a.correct).length;

    // SETUP
    if (state === 'setup') {
        return (
            <div className="max-w-lg mx-auto mt-8 animate-in">
                <div className="glass-card p-8 space-y-6 text-center">
                    <div className="text-5xl mb-2">🧠</div>
                    <h1 className="text-2xl font-extrabold text-white">Glossar-Quiz</h1>
                    <p className="text-slate-400">Teste dein Wissen über Fachbegriffe des Inselspitals</p>

                    <div>
                        <label className="label text-center">Anzahl Fragen</label>
                        <div className="flex justify-center gap-2 mt-2">
                            {[5, 10, 15, 20].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setQuestionCount(n)}
                                    className={`w-12 h-12 rounded-xl font-bold transition-all ${questionCount === n
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-sm text-slate-500">
                        {terms.length} Begriffe verfügbar • {quizQuestions.length} gespeicherte Fragen
                    </div>

                    <button
                        onClick={startQuiz}
                        className="btn-primary w-full justify-center text-base"
                        disabled={terms.length < 4}
                    >
                        <Sparkles size={18} /> Quiz starten
                    </button>

                    {terms.length < 4 && (
                        <p className="text-amber-400 text-sm">
                            Mindestens 4 Begriffe erforderlich. Aktuell: {terms.length}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // PLAYING
    if (state === 'playing' && currentQuestion) {
        return (
            <div className="max-w-2xl mx-auto mt-8 space-y-6 animate-in">
                {/* Progress */}
                <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Frage {currentIndex + 1} von {questions.length}</span>
                    <span>{score} richtig</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                </div>

                {/* Question */}
                <div className="glass-card p-6 sm:p-8 space-y-6">
                    {currentQuestion.category && (
                        <span className="badge badge-teal">{currentQuestion.category}</span>
                    )}
                    <h2 className="text-xl font-bold text-white">{currentQuestion.question}</h2>

                    <div className="space-y-3">
                        {allAnswers.map((answer, i) => {
                            let className = 'quiz-answer';
                            if (isRevealed) {
                                if (answer === currentQuestion.correctAnswer) className += ' correct';
                                else if (answer === selectedAnswer) className += ' incorrect';
                            }
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(answer)}
                                    className={className}
                                    disabled={isRevealed}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        {answer}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {isRevealed && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                {selectedAnswer === currentQuestion.correctAnswer ? (
                                    <span className="badge badge-green"><Check size={12} /> Richtig!</span>
                                ) : (
                                    <span className="badge badge-red"><X size={12} /> Falsch</span>
                                )}
                            </div>
                            <button onClick={nextQuestion} className="btn-primary">
                                {currentIndex + 1 >= questions.length ? 'Ergebnis anzeigen' : 'Nächste Frage'}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // RESULT
    if (state === 'result') {
        const pct = Math.round((score / questions.length) * 100);
        return (
            <div className="max-w-lg mx-auto mt-8 animate-in">
                <div className="glass-card p-8 space-y-6 text-center">
                    <div className="text-5xl">
                        {pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚'}
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">Quiz beendet!</h2>

                    <div className={`text-5xl font-extrabold ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                        {pct}%
                    </div>
                    <p className="text-slate-400 text-lg">
                        {score} von {questions.length} richtig
                    </p>

                    {pct >= 80 && <p className="text-green-300">Ausgezeichnet! Du bist ein Glossar-Profi! 🎉</p>}
                    {pct >= 50 && pct < 80 && <p className="text-amber-300">Gut gemacht! Weiter so!</p>}
                    {pct < 50 && <p className="text-red-300">Übung macht den Meister! Versuch es nochmal.</p>}

                    <div className="flex gap-3 justify-center">
                        {user && (
                            <button onClick={saveResult} className="btn-primary" disabled={saving}>
                                {saving ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <><Trophy size={16} /> Ergebnis speichern</>}
                            </button>
                        )}
                        <button onClick={() => setState('setup')} className="btn-secondary">
                            <RotateCw size={16} /> Nochmal
                        </button>
                    </div>

                    {/* Answer breakdown */}
                    <div className="pt-6 border-t border-white/5 space-y-2 text-left">
                        <h3 className="label">Übersicht</h3>
                        {questions.map((q, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm py-1.5">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${answers[i]?.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {answers[i]?.correct ? '✓' : '✗'}
                                </span>
                                <span className="text-slate-300 flex-1 truncate">{q.term}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
