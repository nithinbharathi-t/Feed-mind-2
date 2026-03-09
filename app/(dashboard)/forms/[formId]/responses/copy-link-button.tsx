"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyLinkButton({ formId }: { formId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/f/${formId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Button variant="outline" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4 mr-2 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4 mr-2" />
      )}
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  );
}
