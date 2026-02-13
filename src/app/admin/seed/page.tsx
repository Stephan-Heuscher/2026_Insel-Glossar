"use client";

import { useState } from "react";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore"; // Import from firebase/firestore directly in v9 modular SDK
import { getAuth, signInAnonymously } from "firebase/auth";
import { app } from "@/lib/firebase"; // Import initialized app from lib
import glossaryData from "@/data/glossary.json";

export default function SeedingPage() {
    const [status, setStatus] = useState<string>("Ready to seed");
    const [progress, setProgress] = useState<number>(0);
    const [isSeeding, setIsSeeding] = useState<boolean>(false);

    const handleSeed = async () => {
        setIsSeeding(true);
        setStatus("Initializing...");

        try {
            const auth = getAuth(app);
            const db = getFirestore(app);

            // Optional: Sign in anonymously if not already signed in
            if (!auth.currentUser) {
                setStatus("Signing in anonymously...");
                await signInAnonymously(auth);
            }

            setStatus(`Starting seed for ${glossaryData.length} terms...`);

            const batchSize = 450;
            const batches = [];
            let currentBatch = writeBatch(db);
            let operationCounter = 0;

            // Prepare batches
            for (const term of glossaryData) {
                const docRef = doc(collection(db, "glossary"));

                const termData = {
                    ...term,
                    status: "APPROVED",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: auth.currentUser?.uid || "system_seeder",
                    createdByName: "System Seeder"
                };

                currentBatch.set(docRef, termData);
                operationCounter++;

                if (operationCounter >= batchSize) {
                    batches.push(currentBatch);
                    currentBatch = writeBatch(db);
                    operationCounter = 0;
                }
            }

            if (operationCounter > 0) {
                batches.push(currentBatch);
            }

            setStatus(`Prepared ${batches.length} batches. Committing...`);

            // Commit batches sequentially
            for (let i = 0; i < batches.length; i++) {
                await batches[i].commit();
                const currentProgress = Math.round(((i + 1) / batches.length) * 100);
                setProgress(currentProgress);
                setStatus(`Committed batch ${i + 1} of ${batches.length}`);
            }

            setStatus("Seeding complete! Database populated.");

        } catch (error: any) {
            console.error("Seeding error:", error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Database Seeding</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                    This tool will seed the Firestore database with {glossaryData.length} terms from <code>src/data/glossary.json</code>.
                </p>

                <div className="mb-6">
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 font-mono">{status}</p>
                </div>

                <button
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className={`w-full py-2 px-4 rounded font-medium text-white 
                        ${isSeeding
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 transition-colors"
                        }`}
                >
                    {isSeeding ? "Seeding..." : "Start Seeding"}
                </button>
            </div>
        </div>
    );
}
