import { useState, useEffect } from 'react';

export const useMountTransition = (isMounted, unmountDelay = 350) => {
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isMounted && !hasRendered) {
      setHasRendered(true);
    } else if (!isMounted && hasRendered) {
      timeoutId = setTimeout(() => setHasRendered(false), unmountDelay);
    }
    return () => clearTimeout(timeoutId);
  }, [isMounted, unmountDelay, hasRendered]);

  return hasRendered;
};
