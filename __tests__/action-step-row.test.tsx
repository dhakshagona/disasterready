import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import { useState } from 'react';

import { ActionStepRow } from '@/components/ui/action-step-row';
import { demoFloodPlan } from '@/data/mock-repositories';

function TestStep() {
  const [completed, setCompleted] = useState(false);
  const step = demoFloodPlan.steps[0];

  if (!step) return null;

  return (
    <ActionStepRow
      step={step}
      completed={completed}
      onToggle={() => setCompleted((value) => !value)}
    />
  );
}

describe('ActionStepRow', () => {
  it('toggles completion through an accessible checkbox', async () => {
    const screen = await render(<TestStep />);
    const step = screen.getByRole('checkbox', { name: /Move to higher ground/, checked: false });

    expect(step).toBeTruthy();
    await fireEvent.press(step);
    expect(await screen.findByRole('checkbox', { name: /Move to higher ground/, checked: true })).toBeTruthy();
  });
});
