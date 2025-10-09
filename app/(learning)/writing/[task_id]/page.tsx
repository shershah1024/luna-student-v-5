"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface WritingTask {
  id: number;
  task_id: string;
  task_prompt: string;
  assignment_id: string;
  lesson_id: string;
  level: string;
  image_url?: string;
}

export default function WritingPage() {
  const params = useParams();
  const taskId = params?.task_id as string;
  const [task, setTask] = useState<WritingTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTask() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/writing-tasks?task_id=${taskId}`);
        if (!res.ok) throw new Error("Failed to fetch writing task");
        const data = await res.json();
        setTask(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (taskId) fetchTask();
  }, [taskId]);

  const [learnerResponse, setLearnerResponse] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [evalError, setEvalError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setEvalError("");
    setFeedback(null);
    try {
      const res = await fetch(`/api/essay-evaluation?task_id=${encodeURIComponent(taskId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_data: task?.task_prompt,
          learner_response: learnerResponse,
        }),
      });
      if (!res.ok) throw new Error("Failed to get feedback");
      const data = await res.json();
      setFeedback(data);
    } catch (err: any) {
      setEvalError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {loading && <div>Loading task...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {task && (
        <>
          <h1 className="text-2xl font-bold mb-6 text-center">
            {task.assignment_id || task.lesson_id || `Writing Task ${task.task_id}`}
          </h1>
          <div className="mb-6 p-4 bg-gray-50 rounded border">
            <h2 className="font-semibold mb-2">Prompt</h2>
            <pre className="whitespace-pre-wrap text-gray-800">{task.task_prompt}</pre>
          </div>
          <form onSubmit={handleSubmit} className="mb-8">
            <label htmlFor="essay" className="block mb-2 font-medium">Your Answer</label>
            <textarea
              id="essay"
              rows={8}
              className="w-full border rounded p-2 mb-4"
              value={learnerResponse}
              onChange={e => setLearnerResponse(e.target.value)}
              placeholder="Write your answer here in German..."
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
              disabled={submitting}
            >
              {submitting ? "Evaluating..." : "Submit for Feedback"}
            </button>
          </form>
          {evalError && <div className="text-red-600 mb-4">{evalError}</div>}
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
                <strong>Total Score:</strong>{' '}
                {typeof feedback.total_score === 'number' && typeof feedback.max_total_score === 'number'
                  ? `${feedback.total_score} / ${feedback.max_total_score}`
                  : 'Not available'}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
