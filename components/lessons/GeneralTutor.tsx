'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface GeneralTutorProps {
  sectionId: string;
  lessonId: string;
  userId: string;
  context: any;
  onComplete: () => void;
}

export default function GeneralTutor({
  sectionId,
  lessonId,
  userId,
  context,
  onComplete,
}: GeneralTutorProps) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your tutor. Feel free to ask any questions about this lesson. Type "done" when you\'re finished.',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    if (input.toLowerCase().trim() === 'done') {
      onComplete();
      return;
    }

    setMessages([
      ...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: 'This is a placeholder response. In the full implementation, this would connect to an AI tutor.' },
    ]);
    setInput('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Tutor</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Ask questions about the lesson or practice conversation
          </p>
        </div>

        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question or type 'done' to finish..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
