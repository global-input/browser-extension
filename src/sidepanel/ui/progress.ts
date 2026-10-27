// The progress list on the site card, worked out from the controller's view.
import type { SignInView } from '../core/signInController';

export type StepState = 'done' | 'current' | 'todo';
export interface Step {
  label: string;
  state: StepState;
}

const twoStepProgress = (view: SignInView): Step[] => {
  const found: Step = { label: 'Sign-in form found', state: 'done' };
  const usernameDone: Step = { label: 'Username from your phone', state: 'done' };
  const passwordDone: Step = { label: 'Password from your phone', state: 'done' };
  const signedIn: Step = { label: 'Signed in', state: 'todo' };
  if (view.phase === 'signed-in') {
    return [found, usernameDone, passwordDone, { ...signedIn, state: 'done' }];
  }
  if (view.step === 'username') {
    return view.phase === 'submitted'
      ? [found, usernameDone, { label: 'Waiting for the password page', state: 'current' }, signedIn]
      : [found, { label: 'Choose the account on your phone (username)', state: 'current' }, { label: 'Password from your phone', state: 'todo' }, signedIn];
  }
  return view.phase === 'submitted'
    ? [found, usernameDone, passwordDone, { label: 'Checking the sign-in', state: 'current' }]
    : [found, usernameDone, { label: 'Choose the account on your phone (password)', state: 'current' }, signedIn];
};

export const progressSteps = (view: SignInView): Step[] => {
  if (view.twoStep && (view.phase === 'requesting' || view.phase === 'submitted' || view.phase === 'signed-in')) {
    return twoStepProgress(view);
  }
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
