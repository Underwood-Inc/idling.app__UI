import { useEffect, useState } from "react";

/**
 * This method should only be used in the root App rendering
 */
const useSSRMismatchGuard = (): { isClient: boolean } => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return { isClient };
};

export default useSSRMismatchGuard;
