import { jest } from '@jest/globals';

jest.mock('expo-symbols', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    SymbolView: ({ testID }: { testID?: string }) => React.createElement(Text, { testID }, 'icon'),
  };
});
