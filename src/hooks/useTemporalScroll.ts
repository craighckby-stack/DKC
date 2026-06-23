import { useEffect, useRef, useState } from 'react';

export const useTemporalScroll = (deps: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAuto, setIsAuto] = useState(true);

  useEffect(() => {
    if (isAuto && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, deps);

  return { scrollRef, setIsAuto };
};