type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
    const { checkout_id } = await searchParams
    return <div>Thank you! Your checkout is now being processed. Checkout ID: {checkout_id}</div>
}
