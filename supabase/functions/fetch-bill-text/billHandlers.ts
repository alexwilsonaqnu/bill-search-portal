
import { corsHeaders } from './constants.ts';
import { createSuccessResponse, createErrorResponse } from './utils/httpUtils.ts';
import { ILLINOIS_CURE_ACT_TEXT, ILLINOIS_BILL_1636654_TEXT } from './constants.ts';

// Handler for pre-defined Illinois Cure Act (ID: 1635636)
export function handleIllinoisCureAct() {
  console.log('Returning Illinois Cure Act text');
  return createSuccessResponse({
    text: ILLINOIS_CURE_ACT_TEXT,
    docId: '1635636',
    mimeType: 'text/plain',
    title: "Illinois Cure Act",
    state: "Illinois"
  });
}

// Handler for pre-defined Illinois Bill 1636654
export function handleIllinoisBill1636654() {
  console.log('Returning hard-coded Illinois Bill 1636654 text');
  return createSuccessResponse({
    text: ILLINOIS_BILL_1636654_TEXT,
    docId: '1636654',
    mimeType: 'text/plain',
    title: "Illinois House Bill 890",
    state: "Illinois"
  });
}

// Re-export the error response function from httpUtils for backward compatibility
export { createErrorResponse } from './utils/httpUtils.ts';
