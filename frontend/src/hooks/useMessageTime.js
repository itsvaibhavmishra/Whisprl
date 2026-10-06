import useSettings from "@/hooks/useSettings";
import { formatMessageTime } from "@/utils/formatMessageTime";

const useMessageTime = () => {
  const { use24Hour } = useSettings();
  return (time) => formatMessageTime(time, { use24Hour });
};

export default useMessageTime;
