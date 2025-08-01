export type Session = {
  name: string;
  key: string;
  subscriber: number;
};

export type Data = {
  session?: Session;
  message?: string;
  error?: number;
};
