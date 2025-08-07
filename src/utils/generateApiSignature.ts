import md5 from "md5";

const SHARED_SECRET = process.env.SHARED_SECRET!;

export const generateApiSignature = (
  params: Record<string, string>
): string => {
  const keyParams = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");

  return md5(`${keyParams}${SHARED_SECRET}`);
};
