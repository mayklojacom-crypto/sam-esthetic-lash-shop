import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LiveVisitorsCard = () => {
  const [online, setOnline] = useState(0);
  const [peak, setPeak] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchIt = async () => {
      try {
        const { data } = await supabase.functions.invoke("live-visitors-count");
        if (!mounted || !data) return;
        setOnline(data.online || 0);
        setPeak(data.peakToday || 0);
        setLoaded(true);
      } catch {
        // ignore
      }
    };
    fetchIt();
    const iv = setInterval(fetchIt, 15_000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  return (
    <Card className="border-emerald-200/60 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-xs md:text-sm font-medium text-emerald-700">Ao vivo no site</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">
              {loaded ? online : "—"} <span className="text-sm font-medium text-slate-500">{online === 1 ? "pessoa" : "pessoas"}</span>
            </p>
            <p className="text-[10px] md:text-xs text-slate-500 mt-1">Pico hoje: <span className="font-semibold text-slate-700">{peak}</span></p>
          </div>
          <div className="bg-emerald-100 p-2 md:p-2.5 rounded-xl flex-shrink-0 ml-2">
            <Users size={18} className="text-emerald-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveVisitorsCard;
