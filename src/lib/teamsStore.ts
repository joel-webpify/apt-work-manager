import { useEffect, useState } from "react";

export interface Team {
  id: string;
  name: string;
  /** hsl token, same format as Employee.color */
  color: string;
  memberIds: string[];
  leadId?: string;
}

const KEY = "teams-v1";
const SEED: Team[] = [
  { id: "t1", name: "Window crew", color: "32 90% 50%", memberIds: ["e3", "e4"], leadId: "e3" },
  { id: "t2", name: "Plumbing + apprentice", color: "200 80% 45%", memberIds: ["e1", "e6"], leadId: "e1" },
];

let teams: Team[] = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Team[]) : SEED;
  } catch {
    return SEED;
  }
})();
const listeners = new Set<() => void>();
function save(next: Team[]) {
  teams = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(teams));
  } catch {
    /* storage full — keep in memory */
  }
  listeners.forEach((l) => l());
}

export const getTeams = () => teams;
export function addTeam(t: Omit<Team, "id">) {
  save([...teams, { ...t, id: `t${Date.now().toString(36)}` }]);
}
export function updateTeam(id: string, patch: Partial<Team>) {
  save(teams.map((t) => (t.id === id ? { ...t, ...patch } : t)));
}
export function removeTeam(id: string) {
  save(teams.filter((t) => t.id !== id));
}
export function useTeams(): Team[] {
  const [snap, setSnap] = useState(teams);
  useEffect(() => {
    const l = () => setSnap(teams);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
