import { lazy, Suspense, useEffect, useState } from "react";
import LandingPage from "./features/marketing/LandingPage";

const StudyApp = lazy(() => import("./features/study/StudyApp"));

function LoadingScreen() {
  return (
    <div className="app-loading" role="status">
      <span className="app-loading__mark">EL</span>
      <span>Preparando sua área de estudos…</span>
    </div>
  );
}

function isPublicRoute() {
  return !window.location.hash || window.location.hash === "#/" || window.location.hash === "#";
}

export default function App() {
  const [publicRoute, setPublicRoute] = useState(isPublicRoute);

  useEffect(() => {
    const syncRoute = () => setPublicRoute(isPublicRoute());
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  const openPlatform = () => {
    window.history.pushState(null, "", "#/login");
    setPublicRoute(false);
  };

  if (publicRoute) return <LandingPage onComecar={openPlatform} />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <StudyApp />
    </Suspense>
  );
}
