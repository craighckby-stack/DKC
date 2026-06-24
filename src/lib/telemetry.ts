export const logEvolutionEvent = (event: string, data: any) => {
};

export const calculateSaturationScore = (metrics: any) => {
  return Object.values(metrics).reduce((a: any, b: any) => a + b, 0);
};
