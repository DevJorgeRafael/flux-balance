import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FatalErrorScreen } from './FatalErrorScreen';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <SafeAreaProvider>
          <FatalErrorScreen
            kind="unexpected"
            error={this.state.error}
            onRetry={this.handleRetry}
          />
        </SafeAreaProvider>
      );
    }

    return this.props.children;
  }
}
