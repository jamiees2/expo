'use client';

import { LinkingOptions, NavigationAction } from '@react-navigation/native';
import Constants from 'expo-constants';
import Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import React, { type PropsWithChildren, Fragment, type ComponentType, useMemo } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import UpstreamNavigationContainer from './fork/NavigationContainer';
import { ExpoLinkingOptions } from './getLinkingConfig';
import { useInitializeExpoRouter } from './global-state/router-store';
import ServerContext, { ServerContextType } from './global-state/serverContext';
import { RequireContext } from './types';
import { SplashScreen } from './views/Splash';

export type ExpoRootProps = {
  context: RequireContext;
  location?: URL | string;
  wrapper?: ComponentType<PropsWithChildren>;
  linking?: Partial<ExpoLinkingOptions>;
};

const isTestEnv = process.env.NODE_ENV === 'test';

const INITIAL_METRICS =
  Platform.OS === 'web' || isTestEnv
    ? {
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }
    : undefined;

const hasViewControllerBasedStatusBarAppearance =
  Platform.OS === 'ios' &&
  !!Constants.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;

export function ExpoRoot({ wrapper: ParentWrapper = Fragment, ...props }: ExpoRootProps) {
  /*
   * Due to static rendering we need to wrap these top level views in second wrapper
   * View's like <SafeAreaProvider /> generate a <div> so if the parent wrapper
   * is a HTML document, we need to ensure its inside the <body>
   */
  const wrapper = ({ children }: PropsWithChildren) => {
    return (
      <ParentWrapper>
        <SafeAreaProvider
          // SSR support
          initialMetrics={INITIAL_METRICS}>
          {children}
          {/* Users can override this by adding another StatusBar element anywhere higher in the component tree. */}
          {!hasViewControllerBasedStatusBarAppearance && <StatusBar style="auto" />}
        </SafeAreaProvider>
      </ParentWrapper>
    );
  };

  return <ContextNavigator {...props} wrapper={wrapper} />;
}

const initialUrl =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? new URL(window.location.href)
    : undefined;

function ContextNavigator({
  context,
  location: initialLocation = initialUrl,
  wrapper: WrapperComponent = Fragment,
  linking = {},
}: ExpoRootProps) {
  // location and linking.getInitialURL are both used to initialize the router state
  //  - location is used on web and during static rendering
  //  - linking.getInitialURL is used on native
  const serverContext = useMemo(() => {
    let contextType: ServerContextType = {};

    if (initialLocation instanceof URL) {
      contextType = {
        location: {
          pathname: initialLocation.pathname,
          search: initialLocation.search,
        },
      };
    } else if (typeof initialLocation === 'string') {
      // The initial location is a string, so we need to parse it into a URL.
      const url = new URL(initialLocation, 'http://placeholder.base');
      contextType = {
        location: {
          pathname: url.pathname,
          search: url.search,
        },
      };
    }

    return contextType;
  }, []);

  linking = getNativeLinking(context, linking, serverContext.location);

  const store = useInitializeExpoRouter(context, linking);

  if (store.shouldShowTutorial()) {
    SplashScreen.hideAsync();
    if (process.env.NODE_ENV === 'development') {
      const Tutorial = require('./onboard/Tutorial').Tutorial;
      return (
        <WrapperComponent>
          <Tutorial />
        </WrapperComponent>
      );
    } else {
      // Ensure tutorial styles are stripped in production.
      return null;
    }
  }

  const Component = store.rootComponent;

  return (
    <UpstreamNavigationContainer
      ref={store.navigationRef}
      initialState={store.initialState}
      linking={store.linking as LinkingOptions<any>}
      onUnhandledAction={onUnhandledAction}
      documentTitle={{
        enabled: false,
      }}>
      <ServerContext.Provider value={serverContext}>
        <WrapperComponent>
          <Component />
        </WrapperComponent>
      </ServerContext.Provider>
    </UpstreamNavigationContainer>
  );
}

let onUnhandledAction: (action: NavigationAction) => void;

if (process.env.NODE_ENV !== 'production') {
  onUnhandledAction = (action: NavigationAction) => {
    const payload: Record<string, any> | undefined = action.payload;

    let message = `The action '${action.type}'${
      payload ? ` with payload ${JSON.stringify(action.payload)}` : ''
    } was not handled by any navigator.`;

    switch (action.type) {
      case 'NAVIGATE':
      case 'PUSH':
      case 'REPLACE':
      case 'JUMP_TO':
        if (payload?.name) {
          message += `\n\nDo you have a route named '${payload.name}'?`;
        } else {
          message += `\n\nYou need to pass the name of the screen to navigate to. This may be a bug.`;
        }

        break;
      case 'GO_BACK':
      case 'POP':
      case 'POP_TO_TOP':
        message += `\n\nIs there any screen to go back to?`;
        break;
      case 'OPEN_DRAWER':
      case 'CLOSE_DRAWER':
      case 'TOGGLE_DRAWER':
        message += `\n\nIs your screen inside a Drawer navigator?`;
        break;
    }

    message += `\n\nThis is a development-only warning and won't be shown in production.`;

    if (process.env.NODE_ENV === 'test') {
      throw new Error(message);
    }
    console.error(message);
  };
} else {
  onUnhandledAction = function () {};
}

function getNativeLinking(
  context: RequireContext,
  linking: Partial<ExpoLinkingOptions>,
  serverLocation: ServerContextType['location']
): Partial<ExpoLinkingOptions> {
  const serverUrl = serverLocation
    ? `${serverLocation.pathname}${serverLocation.search}`
    : undefined;

  if (Platform.OS === 'web') {
    // This might slightly counterintuitive, as if we have a location we're not rendering on a native platform
    // But the ExpoRouter store uses the linking.getInitialURL to initialize the state
    // So we need to ensure that the linking.getInitialURL is set to the initial location
    if (serverLocation && !linking.getInitialURL) {
      linking.getInitialURL = () => serverUrl;
    }

    return linking;
  }

  // Get the +native file from the context
  const nativeLinkingKey = context.keys().find((key) => key.match(/^\.\/\+native\.[tj]sx?$/));
  const nativeLinking = nativeLinkingKey ? context(nativeLinkingKey) : undefined;

  return {
    ...linking,
    getInitialURL() {
      if (linking.getInitialURL) {
        return linking.getInitialURL();
      } else if (nativeLinking?.redirectSystemPath) {
        if (serverUrl) {
          // Ensure we initialize the router with the SSR location if present
          return nativeLinking.redirectSystemPath({ url: serverUrl, initial: true });
        } else {
          return Linking.getInitialURL().then((url) => {
            return nativeLinking.redirectSystemPath({ url, initial: true });
          });
        }
      } else {
        return serverUrl;
      }
    },
    subscribe(listener) {
      if (linking.subscribe) {
        return linking.subscribe(listener);
      }

      const subscription = Linking.addEventListener('url', async ({ url }) => {
        if (nativeLinking.redirectSystemPath) {
          listener(await nativeLinking.redirectSystemPath({ url, initial: false }));
        } else {
          listener(url);
        }
      });

      return () => subscription.remove();
    },
  };
}
