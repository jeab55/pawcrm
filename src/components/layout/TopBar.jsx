import React, { useState, useEffect, useRef } from "react";
import { Search, Menu, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function TopBar({ onToggleSidebar }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const pets = await base44.entities.Pet.filter({ name: { $regex: query, $options: "i" } }, "-created_date", 5);
        const pets2 = await base44.entities.Pet.filter({ owner_name: { $regex: query, $options: "i" } }, "-created_date", 5);
        const merged = [...pets, ...pets2].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i).slice(0, 8);
        setResults(merged);
        setShowResults(true);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border h-16 flex items-center px-4 gap-4">
      <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-muted lg:hidden">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาสัตว์เลี้ยง / เจ้าของ..."
          className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
        />
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border max-h-80 overflow-y-auto">
            {results.map((pet) => (
              <button
                key={pet.id}
                onClick={() => { navigate(`/pets/${pet.id}`); setShowResults(false); setQuery(""); }}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 flex items-center gap-3 border-b last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {pet.name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{pet.name} <span className="text-muted-foreground font-normal">({pet.species})</span></p>
                  <p className="text-xs text-muted-foreground">{pet.owner_name} • {pet.owner_phone}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-muted relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        {user && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {user.full_name?.[0] || "U"}
            </div>
            <span className="text-sm font-medium">{user.full_name || user.email}</span>
          </div>
        )}
      </div>
    </header>
  );
}