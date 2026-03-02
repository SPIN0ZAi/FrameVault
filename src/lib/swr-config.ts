export const swrConfig = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    errorRetryCount: 3,
    fetcher: async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error?.message || 'Request failed');
        }
        const json = await res.json();
        return json.data;
    },
};
