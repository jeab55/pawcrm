import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getStoredStaff, storeStaff } from "@/lib/staff";

/**
 * Per-station active-staff selector.
 * @param {string} station - unique key, e.g. "counter", "exam-room", "pharmacy"
 * @param {string[]} roles - staff roles allowed to work at this station
 * Selection persists in localStorage per station (per browser/tab), never on the user profile.
 */
export function useStationStaff(station, roles = []) {
  const [staffList, setStaffList] = useState([]);
  const [selected, setSelected] = useState(() => getStoredStaff(station));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await base44.entities.Staff.list("-created_date", 200);
        const active = all.filter(
          (s) => s.active !== false && (roles.length === 0 || roles.includes(s.role))
        );
        if (mounted) setStaffList(active);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station]);

  const select = useCallback((staff) => {
    setSelected(staff);
    storeStaff(station, staff);
  }, [station]);

  return { staffList, selected, select, loading };
}