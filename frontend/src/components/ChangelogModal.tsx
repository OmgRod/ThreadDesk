"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChangelogModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/changelog/status", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.isUpdateAvailable) {
          setData(data);
          setIsOpen(true);
        }
      });
  }, []);

  const acknowledge = async () => {
    await fetch("/api/changelog/acknowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: data.latestVersion }),
      credentials: "include",
    });
    setIsOpen(false);
  };

  if (!data) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`What's New in ${data.latestVersion}`}>
      <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.releaseNotes}</ReactMarkdown>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={acknowledge}>Got it</Button>
      </div>
    </Modal>
  );
}
