'use client'

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { useState } from 'react'

interface Subscription {
    id: string;
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
}

interface SubscriptionTableProps {
    initialSubscriptions: Subscription[];
    cancelSubscription: (id: string) => Promise<void>;
}

export function SubscriptionTable({ initialSubscriptions, cancelSubscription }: SubscriptionTableProps) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions)
    const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    async function handleCancelSubscription(id: string) {
        try {
            await cancelSubscription(id);
            setSubscriptions(subscriptions.filter(sub => sub.id !== id));
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error canceling subscription:', error);
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Subscription ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                            <TableCell>{subscription.id}</TableCell>
                            <TableCell>{subscription.status}</TableCell>
                            <TableCell>{subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="text-right">
                                <Dialog open={isDialogOpen && selectedSubscription === subscription.id}
                                    onOpenChange={(open) => {
                                        setIsDialogOpen(open);
                                        if (!open) setSelectedSubscription(null);
                                    }}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive"
                                            onClick={() => setSelectedSubscription(subscription.id)}>
                                            Cancel
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Cancel Subscription</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to cancel this subscription? This action cannot be undone.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="outline"
                                                onClick={() => setIsDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button variant="destructive"
                                                onClick={() => handleCancelSubscription(subscription.id)}>
                                                Confirm Cancel
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}