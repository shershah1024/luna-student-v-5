'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WhatsApp() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!phoneNumber || !message) {
      setResponse('Please fill in both phone number and message');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(`Message sent successfully! Message ID: ${data.messageId}`);
        setMessage('');
      } else {
        setResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>WhatsApp Deutschtutor</CardTitle>
        <CardDescription>
          Send messages to students via WhatsApp Business API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2">
            Phone Number (with country code, e.g., +49...)
          </label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+491234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            Message
          </label>
          <Textarea
            id="message"
            placeholder="Enter your message..."
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <Button 
          onClick={sendMessage} 
          disabled={isLoading || !phoneNumber || !message}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </Button>

        {response && (
          <div className={`p-4 rounded-md ${
            response.includes('successfully') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {response}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Set up WhatsApp Business API account</li>
            <li>Add environment variables to .env.local</li>
            <li>Configure webhook URL: {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '[your-domain]/api/whatsapp/webhook'}</li>
            <li>Test the integration by sending messages</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}