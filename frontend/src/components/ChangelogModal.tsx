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
    console.log("ChangelogModal: checking status");

    fetch("/api/changelog/status", { credentials: "include" })
      .then((res) => {
        console.log("ChangelogModal: API status =", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("ChangelogModal: API data =", data);
        
        const lastSeenVersion = localStorage.getItem("lastSeenVersion");
        
        if (data.latestVersion && data.latestVersion !== lastSeenVersion) {
          console.log("ChangelogModal: new version detected, showing modal");
          setData(data);
          setIsOpen(true);
        } else {
          console.log("ChangelogModal: no update available");
        }
      })
      .catch(err => console.error("ChangelogModal: Error checking changelog:", err));
  }, []);

  const acknowledge = async () => {
    localStorage.setItem("lastSeenVersion", data.latestVersion);
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
