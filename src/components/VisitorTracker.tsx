import { useVisitorHeartbeat } from "@/hooks/useVisitorHeartbeat";

const VisitorTracker = () => {
  useVisitorHeartbeat();
  return null;
};

export default VisitorTracker;
