import { createContext } from 'react';

import { logWarning } from './utils/console';

const FullscreenContext = createContext({
  fullscreen: false,
  requestFullscreen() {
    logWarning(
      'Fullscreen request ignored since there is no ' +
        'FullscreenContextProvider ancestor.'
    );
  },
  requestExitFullscreen() {
    logWarning(
      'Exit fullscreen request ignored since there is no ' +
        'FullscreenContextProvider ancestor.'
    );
  }
});
FullscreenContext.displayName = 'FullscreenContext';

export default FullscreenContext;
