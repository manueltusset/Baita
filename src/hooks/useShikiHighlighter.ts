import { useState, useEffect } from "react";
import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

export function useShikiHighlighter() {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    if (!highlighterPromise) {
      highlighterPromise = createHighlighter({
        themes: ["github-dark-default"],
        langs: [
          "typescript", "javascript", "rust", "python", "bash",
          "json", "toml", "css", "html", "yaml", "markdown",
          "tsx", "jsx", "go", "sql", "shell",
        ],
      });
    }
    highlighterPromise.then(setHighlighter);
  }, []);

  return highlighter;
}
