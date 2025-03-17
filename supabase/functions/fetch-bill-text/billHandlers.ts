
import { corsHeaders, ILLINOIS_CURE_ACT_TEXT, ILLINOIS_BILL_1636654_TEXT } from './constants.ts';

// Handler for pre-defined Illinois Cure Act (ID: 1635636)
export function handleIllinoisCureAct(): Response {
  console.log('Returning Illinois Cure Act text');
  return new Response(
    JSON.stringify({
      text: ILLINOIS_CURE_ACT_TEXT,
      docId: '1635636',
      mimeType: 'text/plain',
      title: "Illinois Cure Act",
      state: "Illinois"
    }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      } 
    }
  );
}

// Handler for pre-defined Illinois Bill 1636654
export function handleIllinoisBill1636654(): Response {
  console.log('Returning hard-coded Illinois Bill 1636654 text');
  return new Response(
    JSON.stringify({
      text: ILLINOIS_BILL_1636654_TEXT,
      docId: '1636654',
      mimeType: 'text/plain',
      title: "Illinois House Bill 890",
      state: "Illinois"
    }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      } 
    }
  );
}

// Create error response with provided status code and message
export function createErrorResponse(
  message: string, 
  userMessage?: string, 
  details?: any, 
  status: number = 500
): Response {
  return new Response(
    JSON.stringify({ 
      error: message,
      userMessage: userMessage || 'An error occurred. Please try again later.',
      details: details
    }),
    { 
      status, 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      } 
    }
  );
}
