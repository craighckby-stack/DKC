import { useEffect, useRef, useState } from 'react';

export const useTemporalScroll = (dependency: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (auto && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [dependency, auto]);

  return { ref, setAuto };
};