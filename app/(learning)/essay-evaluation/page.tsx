"use client";

export const dynamic = 'force-dynamic';

import React, { useState } from "react";

const SAMPLE_QUESTION = `3(a) Un concurso de escritura\nLa semana pasada ganaste un concurso de escritura. Escribe un email a tu amigo /amiga colombiano/a para contarle tu experiencia.\n- ¿Cómo te sentiste al ganar el concurso de escritura?\n- ¿Cuánto dinero recibiste por ganar?\n- Describe lo que hiciste para celebrar.\n- ¿Qué piensan tus padres sobre los concursos de escritura?\n- ¿En qué otros concursos vas a participar en el futuro?`;

export default function EssayEvaluationPage() {
  const [learnerResponse, setLearnerResponse] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFeedback(null);
    try {
      const res = await fetch("/api/essay-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_data: SAMPLE_QUESTION,
          learner_response: learnerResponse,
        }),
      });
      if (!res.ok) throw new Error("Failed to get feedback");
      const data = await res.json();
      setFeedback(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Spanish IGCSE Essay Practice</h1>
      <div className="mb-6 p-4 bg-gray-50 rounded border">
        <h2 className="font-semibold mb-2">Question</h2>
        <pre className="whitespace-pre-wrap text-gray-800">{SAMPLE_QUESTION}</pre>
      </div>
      <form onSubmit={handleSubmit} className="mb-8">
        <label htmlFor="essay" className="block mb-2 font-medium">Your Answer</label>
        <textarea
          id="essay"
          rows={8}
          className="w-full border rounded p-2 mb-4"
          value={learnerResponse}
          onChange={e => setLearnerResponse(e.target.value)}
          placeholder="Write your answer here in Spanish..."
          required
          onPaste={e => {
            e.preventDefault();
            alert('Pasting is disabled. Please type your answer.');
          }}
          onCopy={e => e.preventDefault()}
          onCut={e => e.preventDefault()}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Evaluating..." : "Submit for Feedback"}
        </button>
      </form>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {feedback && (
        <div className="bg-green-50 border rounded p-4">
          <h2 className="font-semibold mb-2 text-green-800">Feedback</h2>
          <div className="mb-2">
            <strong>Overall Evaluation:</strong>
            <p>{feedback.overall_evaluation}</p>
          </div>
          <div className="mb-2">
            <strong>Scores:</strong>
            <ul className="list-disc ml-6">
              <li>Task Completion: {feedback.parameter_evaluations.task_completion.score} / {feedback.parameter_evaluations.task_completion.max_score}</li>
              <li>Range: {feedback.parameter_evaluations.range.score} / {feedback.parameter_evaluations.range.max_score}</li>
              <li>Accuracy: {feedback.parameter_evaluations.accuracy.score} / {feedback.parameter_evaluations.accuracy.max_score}</li>
            </ul>
          </div>
          <div className="mb-2">
            <strong>Task Completion Feedback:</strong>
            <p>{feedback.parameter_evaluations.task_completion.comment}</p>
            <em>{feedback.parameter_evaluations.task_completion.final_comment}</em>
          </div>
          <div className="mb-2">
            <strong>Range Feedback:</strong>
            <p>{feedback.parameter_evaluations.range.comment}</p>
            <em>{feedback.parameter_evaluations.range.final_comment}</em>
          </div>
          <div className="mb-2">
            <strong>Accuracy Feedback:</strong>
            <p>{feedback.parameter_evaluations.accuracy.comment}</p>
            <em>{feedback.parameter_evaluations.accuracy.final_comment}</em>
          </div>
          <div className="mt-2">
            <strong>Total Score:</strong> {feedback.total_score} / {feedback.max_total_score}
          </div>
        </div>
      )}
    </div>
  );
}
