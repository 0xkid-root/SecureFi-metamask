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

export const handleSearchWithMistral = async (
  searchQuery: string,
  setIsLoading: (loading: boolean) => void,
  setSearchResults: (results: string) => void,
  setSearchQuery: (query: string) => void
) => {
  if (!searchQuery.trim()) return;

  setIsLoading(true);
  setSearchResults('');

  try {
    const response = (await mistralClient.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant specializing in web3, smart contracts, blockchain protocols, and related technologies. The user is searching for information about smart contracts, keywords, or contract addresses. Provide concise, accurate answers with links to resources if applicable. Focus on helping developers find relevant smart contracts, code snippets, or documentation. Format your response with clear headings, bullet points, and code blocks for better readability.',
        },
        { role: 'user', content: `Search for: ${searchQuery}` },
      ],
    })) as MistralResponse;

    if (response.choices && response.choices.length > 0 && response.choices[0].message.content) {
      let aiResponse = response.choices[0].message.content;

      // Parse and format the response (same formatting as handleAskQuestion)
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

      setSearchResults(aiResponse);
    } else {
      setSearchResults('No results found. Please try a different search query.');
    }
    setSearchQuery(''); // Clear the input after search
  } catch (error) {
    console.error('Error searching with Mistral AI:', error);
    setSearchResults('Sorry, something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};