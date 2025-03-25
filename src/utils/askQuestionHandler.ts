import { Mistral } from '@mistralai/mistralai';

// Define the expected response type for Mistral API
interface MistralMessage {
  role: string;
  content: string;
}

interface MistralChoice {
  message: MistralMessage;
}

interface MistralResponse {
  choices: MistralChoice[];
}

// Initialize Mistral client
const mistralClient = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY!,
});

export const handleAskQuestion = async (
  question: string,
  setIsLoading: (loading: boolean) => void,
  setAnswer: (answer: string) => void,
  setQuestion: (question: string) => void
) => {
  if (!question.trim()) return;

  setIsLoading(true);
  setAnswer('');

  try {
    const response = (await mistralClient.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant specializing in web3, smart contracts, blockchain protocols, and related technologies. Provide concise, accurate answers with links to resources if applicable. Focus on helping developers build projects faster by explaining concepts, providing code snippets, or pointing to documentation. Format your response with clear headings, bullet points, and code blocks for better readability.',
        },
        { role: 'user', content: question },
      ],
    })) as MistralResponse;

    if (response.choices && response.choices.length > 0 && response.choices[0].message.content) {
      let aiResponse = response.choices[0].message.content;

      // Parse and format the response
      aiResponse = aiResponse
        // Convert ### Headings to <h4> tags
        .replace(/###\s*(.+)/g, '<h4 class="text-purple-400 font-semibold mt-4 mb-2">$1</h4>')
        // Convert **bold** to <strong> tags
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Convert newlines to <br> for line breaks
        .replace(/\n/g, '<br>')
        // Convert code blocks (```code```) to <pre><code> tags
        .replace(/```(.*?)```/gs, '<pre class="bg-gray-800 p-2 rounded-lg"><code>$1</code></pre>')
        // Convert unordered lists (- item) to <ul><li> tags
        .replace(/- (.+)/g, '<ul class="list-disc pl-5"><li>$1</li></ul>');

      setAnswer(aiResponse);
    } else {
      setAnswer('No response received from the AI. Please try again.');
    }
    setQuestion('');
  } catch (error) {
    console.error('Error asking Mistral AI:', error);
    setAnswer('Sorry, something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};