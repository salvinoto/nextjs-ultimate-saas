'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle } from 'lucide-react'

export default function ForbiddenPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer)
          router.push('/')
        }
        return prevCount - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center text-primary">
            <AlertTriangle className="mr-2 h-8 w-8" />
            5000 Internal Server Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-xl mb-4 text-muted-foreground">
            The server encountered an internal error and was unable to complete your request. Are you authorized to access this page?
          </p>
          <p className="text-lg text-secondary-foreground">
            Redirecting in {countdown} seconds...
          </p>
        </CardContent>
        <CardFooter>
          <Progress value={(5 - countdown) * 20} className="w-full" />
        </CardFooter>
      </Card>
    </div>
  )
}

