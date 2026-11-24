import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

export function useStudyHistory(uid, editalId, refreshKey) {
  const [studies, setStudies] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!uid || !editalId) {
        if (active) { setStudies({}); setLoading(false); }
        return;
      }

      setLoading(true);
      try {
        const snapshot = await getDoc(doc(db, "users", uid));
        const data = snapshot.exists() ? snapshot.data() : {};
        const editalStudies = data.estudosPorEdital?.[editalId] || (editalId === "pf" ? data.estudos : {}) || {};
        if (active) setStudies(editalStudies);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [uid, editalId, refreshKey]);

  return { studies, loading };
}
