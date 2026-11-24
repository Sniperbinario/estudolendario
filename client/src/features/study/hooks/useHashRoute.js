import { useCallback, useEffect, useState } from "react";

const currentRoute = () => window.location.hash?.replace("#/", "") || "login";

export function useHashRoute() {
  const [route, setRoute] = useState(currentRoute);

  const navigate = useCallback((nextRoute) => {
    setRoute(nextRoute);
    const destination = `#/${nextRoute}`;
    if (window.location.hash !== destination) window.history.pushState(null, "", destination);
  }, []);

  useEffect(() => {
    const sync = () => setRoute(currentRoute());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  return [route, navigate];
}
