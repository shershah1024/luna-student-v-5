'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import { generateUUID } from '@/lib/utils';

// Vocabulary Practice Widget Component
function VocabularyPracticeWidget({ data }: { data: any }) {
  const [currentCard, setCurrentCard] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  
  if (!data?.words || !Array.isArray(data.words)) {
    return <div className="p-2 bg-red-100 rounded">Invalid vocabulary data</div>;
  }

  const words = data.words;
  const theme = data.theme;

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 shadow-sm">
      {theme && (
        <h3 className="text-lg font-semibold text-green-800 mb-3 text-center">
          📚 {theme}
        </h3>
      )}
      
      <div className="bg-white rounded-lg p-4 shadow-sm min-h-[120px] flex flex-col justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {words[currentCard]?.german}
          </div>
          
          {words[currentCard]?.pronunciation && (
            <div className="text-sm text-gray-500 mb-2">
              [{words[currentCard].pronunciation}]
            </div>
          )}
          
          {showTranslation && (
            <div className="text-lg text-green-600 font-medium">
              {words[currentCard]?.english}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
          disabled={currentCard === 0}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
        >
          ← Prev
        </button>
        
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showTranslation ? 'Hide' : 'Show'} Translation
        </button>
        
        <button
          onClick={() => setCurrentCard(Math.min(words.length - 1, currentCard + 1))}
          disabled={currentCard === words.length - 1}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
        >
          Next →
        </button>
      </div>
      
      <div className="text-center text-sm text-gray-500 mt-2">
        Card {currentCard + 1} of {words.length}
      </div>
    </div>
  );
}

export default function SimpleVocabularyChatbot() {
  const [input, setInput] = useState('');

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/vocabulary-tutor-ai-sdk',
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            ...body,
          },
        };
      },
    }),
    onError: (error) => {
      console.error('[VOCAB CHAT] Error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: input }],
      });
      setInput('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Simple Vocabulary Tutor</h1>
      
      <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4 bg-gray-50">
        {messages.map((message) => {
          console.log('[VOCAB CHAT] Message:', message);
          return (
            <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border'
              }`}>
                {message.parts?.map((part, index) => {
                  console.log('[VOCAB CHAT] Part:', part);
                  return (
                    <div key={index}>
                      {part.type === 'text' && part.text}
                      {part.type === 'tool-call' && (
                        <div className="mt-2 p-2 bg-gray-100 rounded">
                          <strong>Tool:</strong> {part.toolName}
                        </div>
                      )}
                      {part.type === 'tool-result' && (
                        <div className="mt-2">
                          {part.toolName === 'vocabularyPractice' && (
                            <VocabularyPracticeWidget data={part.result} />
                          )}
                          {part.toolName !== 'vocabularyPractice' && (
                            <div className="p-2 bg-green-100 rounded">
                              <pre>{JSON.stringify(part.result, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Handle ai-chatbot style tool parts */}
                      {(part.type as any)?.startsWith?.('tool-') && (
                        <div className="mt-2">
                          {(part.type as any) === 'tool-vocabularyPractice' && (part as any).state === 'output-available' && (
                            <VocabularyPracticeWidget data={(part as any).output} />
                          )}
                          {(part.type as any) !== 'tool-vocabularyPractice' && (
                            <div className="p-2 bg-blue-100 rounded">
                              <strong>Tool Type:</strong> {part.type}<br/>
                              <strong>State:</strong> {(part as any).state}<br/>
                              <pre>{JSON.stringify(part, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }) || message.content}
              </div>
            </div>
          );
        })}
        
        {status === 'loading' && (
          <div className="text-gray-500">AI is thinking...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about German vocabulary..."
          className="flex-1 p-2 border rounded"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}