import WhatsApp from '@/components/WhatsApp';

export default function WhatsAppTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          WhatsApp Integration Test
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Test the WhatsApp Business API integration for the German tutor. 
          Students can now receive personalized German lessons directly via WhatsApp!
        </p>
      </div>
      
      <WhatsApp />

      <div className="mt-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">How it works:</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">📱 For Students</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Send text messages in German or English</li>
              <li>• Send voice messages for pronunciation practice</li>
              <li>• Get instant AI tutor responses</li>
              <li>• Practice German 24/7 via WhatsApp</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">🤖 AI Tutor Features</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Comprehensive A1 German instruction</li>
              <li>• Interactive exercises and tools</li>
              <li>• Grammar explanations with examples</li>
              <li>• Vocabulary building activities</li>
              <li>• Audio transcription for voice messages</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">⚙️ Configuration Required</h3>
          <p className="text-yellow-700 text-sm">
            To activate this integration, you need to configure your WhatsApp Business API credentials 
            in the environment variables and set up the webhook URL with Meta/Facebook.
          </p>
        </div>
      </div>
    </div>
  );
}