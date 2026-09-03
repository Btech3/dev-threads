import { Inngest } from 'inngest';

/**
 * INNGEST Setup
 * 
 * What: Background job processing and scheduling
 * When: Called for async tasks (send emails, notifications, analytics)
 * Why: Don't block main request/response cycle
 * How: Define events, create functions, INNGEST manages execution
 */
export const inngest = new Inngest({
  id: 'dev-thread',
  name: 'Dev Thread',
});

export default inngest;