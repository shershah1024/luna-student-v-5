"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useAuth } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

interface WritingTask {
  id: number;
  task_id: string;
  task_prompt: string;
  created_at?: string;
}

interface Evaluation {
  task_completion: number;
  range: number;
  accuracy: number;
  task_completion_feedback: string;
  range_feedback: string;
  accuracy_feedback: string;
  overall_feedback: string;
}

export default function WritingTasksListPage() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [tasks, setTasks] = useState<WritingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation | null>>({});
  const [expandedFeedback, setExpandedFeedback] = useState<Record<string, boolean>>({});
  const [expandedPrompt, setExpandedPrompt] = useState<Record<string, boolean>>({});
  
  const toggleFeedback = (taskId: string) => {
    setExpandedFeedback(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const togglePrompt = (taskId: string) => {
    setExpandedPrompt(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  useEffect(() => {
    async function fetchTasks() {
      if (!isLoaded || !isSignedIn) return;
      
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/writing-tasks?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch writing tasks");
        const data = await res.json();
        setTasks(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!loading && tasks.length && userId) {
      (async () => {
        try {
          const res = await fetch('/api/writing-evaluations');
          if (!res.ok) throw new Error('Failed to fetch evaluations');
          const data = await res.json();
          const evalMap = Object.fromEntries(
            (data || []).map((e: any) => [e.task_id, e] as const)
          ) as Record<string, Evaluation>;
          setEvaluations(evalMap);
        } catch (err: any) {
          console.error('Evaluation fetch error:', err.message);
        }
      })();
    }
  }, [loading, tasks, userId]);

  // If authentication is not loaded yet, show loading state
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If user is not signed in, show sign in component
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold mb-8 text-indigo-800">Sign in to view your writing tasks</h1>
        <SignIn />
      </div>
    );
  }

  // Prepare data for the graph
  const completedEvaluations = tasks
    .map((task) => {
      const evalObj = evaluations[task.task_id];
      if (!evalObj) return null;
      const overall =
        (evalObj.task_completion || 0) +
        (evalObj.range || 0) +
        (evalObj.accuracy || 0);
      return {
        ...evalObj,
        task_id: task.task_id,
        label: task.task_id.replace('writing_', 'Task '),
        overall
      };
    })
    .filter((ev) => ev && typeof ev.task_completion === 'number');

  return (
    <div className="max-w-7xl mx-auto pt-24 py-12 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-indigo-800">IGCSE Spanish Writing Tasks</h1>

      {loading && <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div></div>}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">{error}</div>}
      
      {!loading && !error && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Progress Graph - Now on the side */}
          <div className="lg:w-1/3 bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-fit sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 100 2h10a1 1 0 100-2H3z" clipRule="evenodd" />
              </svg>
              Your Progress
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={completedEvaluations}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fill: '#4a5568', fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#4a5568', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="task_completion" name="Task Completion" stroke="#805ad5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="range" name="Range" stroke="#38b2ac" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#f6ad55" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="overall" name="Overall Score" stroke="#e53e3e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-3 italic">Track your progress across all completed writing tasks.</p>
          </div>

          {/* Cards - Main content */}
          <div className="lg:w-2/3">
            <div className="grid gap-6 md:grid-cols-2">
              {tasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
                  <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <a href={`/writing/${task.task_id}`} className="text-indigo-700 hover:text-indigo-900 font-semibold text-lg transition-colors duration-200">
                    {task.task_id.replace('writing_', 'Writing Task ')}
                  </a>
                  <div className="text-xs text-gray-500">
                    {task.created_at && new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="mb-3 border-b border-gray-100 pb-3">
                  <button 
                    onClick={() => togglePrompt(task.task_id)}
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
                  >
                    <span>Task Prompt</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 transform transition-transform duration-200 ${expandedPrompt[task.task_id] ? 'rotate-180' : ''}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {expandedPrompt[task.task_id] && (
                    <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {task.task_prompt}
                    </div>
                  )}
                </div>
                {evaluations[task.task_id] ? (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-gray-800">Scores</p>
                        <div className="text-indigo-600 font-bold text-lg">
                          {(
                            (evaluations[task.task_id]!.task_completion || 0) +
                            (evaluations[task.task_id]!.range || 0) +
                            (evaluations[task.task_id]!.accuracy || 0)
                          )}/28
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="bg-purple-50 p-2 rounded text-center">
                          <div className="text-xs text-purple-700 font-medium">Task</div>
                          <div className="text-purple-800 font-bold">{evaluations[task.task_id]!.task_completion}</div>
                        </div>
                        <div className="bg-teal-50 p-2 rounded text-center">
                          <div className="text-xs text-teal-700 font-medium">Range</div>
                          <div className="text-teal-800 font-bold">{evaluations[task.task_id]!.range}</div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded text-center">
                          <div className="text-xs text-orange-700 font-medium">Accuracy</div>
                          <div className="text-orange-800 font-bold">{evaluations[task.task_id]!.accuracy}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <button 
                        onClick={() => toggleFeedback(task.task_id)}
                        className="flex items-center justify-between w-full text-left text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                      >
                        <span>Detailed Feedback</span>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 transform transition-transform duration-200 ${expandedFeedback[task.task_id] ? 'rotate-180' : ''}`} 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {expandedFeedback[task.task_id] && (
                        <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                          <div>
                            <h4 className="font-medium text-purple-800">Task Completion</h4>
                            <p>{evaluations[task.task_id]!.task_completion_feedback}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-teal-800">Range</h4>
                            <p>{evaluations[task.task_id]!.range_feedback}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-orange-800">Accuracy</h4>
                            <p>{evaluations[task.task_id]!.accuracy_feedback}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-red-800">Overall</h4>
                            <p>{evaluations[task.task_id]!.overall_feedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-24 text-gray-400 italic text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <span>No evaluation yet</span>
                  </div>
                )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
