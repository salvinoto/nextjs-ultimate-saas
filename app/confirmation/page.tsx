export default async function Page({
    searchParams,
}: {
    searchParams: {
        checkout_id: string
    }
}) {
    const { checkout_id } = await searchParams
    return <div>Thank you! Your checkout is now being processed.</div>
}
