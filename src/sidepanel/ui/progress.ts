// The progress list on the site card, worked out from the controller's view.
import type { SignInView } from '../core/signInController';

export type StepState = 'done' | 'current' | 'todo';
export interface Step {
  label: string;
  state: StepState;
}

export const progressSteps = (view: SignInView): Step[] => {
  const detected: Step = { label: 'Sign-in form found', state: 'done' };
  const sent: Step = { label: 'Request sent to your phone', state: 'done' };
  switch (view.phase) {
    case 'requesting':
      return [
        detected,
        sent,
        { label: view.filledFieldIds.length ? 'Filling from your phone' : 'Choose an account on your phone', state: 'current' },
        { label: 'Signed in', state: 'todo' },
      ];
    case 'submitted':
      return [detected, sent, { label: 'Filled from your phone', state: 'done' }, { label: 'Checking the sign-in', state: 'current' }];
    case 'signed-in':
      return [detected, sent, { label: 'Filled from your phone', state: 'done' }, { label: 'Signed in', state: 'done' }];
    default:
      return [];
  }
};

export const ruleSourceLabel = (view: SignInView) =>
  view.ruleSource === 'rule' ? 'Sign-in form found with a page rule' : 'Sign-in form found automatically';

export const formatTime = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatSeconds = (ms?: number) => (ms === undefined ? '' : `${(ms / 1000).toFixed(1)} seconds`);
