import { jest } from '@jest/globals';

jest.mock('expo-symbols', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    SymbolView: ({ testID }: { testID?: string }) => React.createElement(Text, { testID }, 'icon'),
  };
});

jest.mock('expo-image', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Image: (props: object) => React.createElement(View, props),
  };
});

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => ({ numberOfPages: 1, uri: 'file:///checklist.pdf' })),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));
