"use client"

import { useState, type KeyboardEvent } from "react"
import { Badge } from "~/components/ui/badge"

interface TagInputProps {
  labels: string[];
  onLabelsChange: (labels: string[]) => void;
}

export function TagInput({ labels, onLabelsChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!labels.includes(trimmed)) {
        onLabelsChange([...labels, trimmed]);
      }
      setInputValue("");
    }
  }

  function handleRemove(label: string) {
    onLabelsChange(labels.filter((l) => l !== label));
  }

  return (
    <div className="flex flex-col gap-2">
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-[#ede9fe] px-2 py-0.5 text-xs font-medium text-violet-700"
            >
              {label}
              <button
                type="button"
                onClick={() => handleRemove(label)}
                className="leading-none text-violet-500 hover:text-violet-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter to add..."
        className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
      />
    </div>
  );
}
