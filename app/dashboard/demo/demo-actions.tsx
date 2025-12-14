"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { UsageLimitGate } from "@/components/usage/usage-limit-gate";
import {
  Activity,
  Sparkles,
  HardDrive,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { UsageStatus, MeterSlug } from "@/lib/metering";
import {
  simulateApiCall,
  simulateAiGeneration,
  simulateStorageUpload,
  simulateSeatActivity,
} from "../actions";

interface DemoActionsProps {
  usage: Record<MeterSlug, UsageStatus>;
}

export function DemoActions({ usage }: DemoActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // API Request Demo
  const [apiResult, setApiResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // AI Generation Demo
  const [prompt, setPrompt] = useState("");
  const [aiResult, setAiResult] = useState<{
    success: boolean;
    content?: string;
    tokens?: number;
  } | null>(null);

  // Storage Demo
  const [fileSize, setFileSize] = useState("1.5");
  const [storageResult, setStorageResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Seat Demo
  const [seatResult, setSeatResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleApiCall = async () => {
    setApiResult(null);
    try {
      const result = await simulateApiCall();
      setApiResult(result);
      if (result.success) {
        toast.success("API call tracked successfully");
      } else {
        toast.error(result.message);
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      setApiResult({ success: false, message });
      toast.error(message);
    }
  };

  const handleAiGeneration = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setAiResult(null);
    try {
      const result = await simulateAiGeneration(prompt);
      setAiResult(result);
      if (result.success) {
        toast.success(`Generated content using ${result.tokens} tokens`);
      } else {
        toast.error("AI generation failed");
      }
      setPrompt("");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      setAiResult({ success: false });
      toast.error(message);
    }
  };

  const handleStorageUpload = async () => {
    const size = parseFloat(fileSize);
    if (isNaN(size) || size <= 0) {
      toast.error("Please enter a valid file size");
      return;
    }
    setStorageResult(null);
    try {
      const result = await simulateStorageUpload(size);
      setStorageResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      setStorageResult({ success: false, message });
      toast.error(message);
    }
  };

  const handleSeatActivity = async () => {
    setSeatResult(null);
    try {
      const result = await simulateSeatActivity();
      setSeatResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      setSeatResult({ success: false, message });
      toast.error(message);
    }
  };

  return (
    <>
      {/* API Request Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" />
            API Request Demo
          </CardTitle>
          <CardDescription>
            Simulate an API call that tracks usage against the api_requests meter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Current:</span>
            <Progress
              value={
                usage.api_requests.limit
                  ? (usage.api_requests.current / usage.api_requests.limit) *
                    100
                  : 0
              }
              className="flex-1 h-2"
            />
            <span className="text-muted-foreground">
              {usage.api_requests.current.toLocaleString()} /{" "}
              {usage.api_requests.limit?.toLocaleString() ?? "∞"}
            </span>
          </div>

          <UsageLimitGate
            usageStatus={usage.api_requests}
            featureLabel="API Requests"
            onAction={handleApiCall}
            buttonText="Make API Call"
            className="w-full"
          />

          {apiResult && (
            <div
              className={`flex items-center gap-2 text-sm ${
                apiResult.success ? "text-green-600" : "text-destructive"
              }`}
            >
              {apiResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {apiResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generation Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5" />
            AI Generation Demo
          </CardTitle>
          <CardDescription>
            Simulate AI content generation that tracks token usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Tokens:</span>
            <Progress
              value={
                usage.ai_tokens.limit
                  ? (usage.ai_tokens.current / usage.ai_tokens.limit) * 100
                  : 0
              }
              className="flex-1 h-2"
            />
            <span className="text-muted-foreground">
              {usage.ai_tokens.current.toLocaleString()} /{" "}
              {usage.ai_tokens.limit?.toLocaleString() ?? "∞"}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter a prompt for AI generation..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
            />
          </div>

          <UsageLimitGate
            usageStatus={usage.ai_tokens}
            featureLabel="AI Tokens"
            onAction={handleAiGeneration}
            buttonText="Generate Content"
            className="w-full"
            disabled={!prompt.trim()}
          />

          {aiResult?.success && aiResult.content && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground text-xs mb-1">
                Generated ({aiResult.tokens} tokens):
              </p>
              <p>{aiResult.content}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-5 w-5" />
            Storage Upload Demo
          </CardTitle>
          <CardDescription>
            Simulate a file upload that tracks storage usage (peak billing)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Storage:</span>
            <Progress
              value={
                usage.storage_gb.limit
                  ? (usage.storage_gb.current / usage.storage_gb.limit) * 100
                  : 0
              }
              className="flex-1 h-2"
            />
            <span className="text-muted-foreground">
              {usage.storage_gb.current.toFixed(2)} GB /{" "}
              {usage.storage_gb.limit?.toFixed(0) ?? "∞"} GB
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileSize">File Size (GB)</Label>
            <Input
              id="fileSize"
              type="number"
              step="0.1"
              min="0.1"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
            />
          </div>

          <UsageLimitGate
            usageStatus={usage.storage_gb}
            featureLabel="Storage"
            onAction={handleStorageUpload}
            buttonText="Upload File"
            className="w-full"
          />

          {storageResult && (
            <div
              className={`flex items-center gap-2 text-sm ${
                storageResult.success ? "text-green-600" : "text-destructive"
              }`}
            >
              {storageResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {storageResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seat Activity Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Team Seat Demo
          </CardTitle>
          <CardDescription>
            Track unique user activity for seat-based billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Seats:</span>
            <Progress
              value={
                usage.team_seats.limit
                  ? (usage.team_seats.current / usage.team_seats.limit) * 100
                  : 0
              }
              className="flex-1 h-2"
            />
            <span className="text-muted-foreground">
              {Math.floor(usage.team_seats.current)} /{" "}
              {usage.team_seats.limit ?? "∞"} seats
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Seat activity is tracked per unique user. Multiple actions by the
            same user only count as one seat.
          </p>

          <UsageLimitGate
            usageStatus={usage.team_seats}
            featureLabel="Team Seats"
            onAction={handleSeatActivity}
            buttonText="Record Activity"
            className="w-full"
          />

          {seatResult && (
            <div
              className={`flex items-center gap-2 text-sm ${
                seatResult.success ? "text-green-600" : "text-destructive"
              }`}
            >
              {seatResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {seatResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
