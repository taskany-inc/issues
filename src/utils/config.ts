export const refreshInterval = process.env.NEXT_PUBLIC_API_REFRESH_INTERVAL
    ? // eslint-disable-next-line radix
      parseInt(process.env.NEXT_PUBLIC_API_REFRESH_INTERVAL)
    : 3000;

export const profileUrl = process.env.NEXT_PUBLIC_PROFILE_URL;
