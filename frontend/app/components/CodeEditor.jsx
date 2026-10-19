"use client";
import Editor from "@monaco-editor/react";
export default function CodeEditor({
  code,
  setCode
}) {

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">

      <Editor
        height="450px"
        defaultLanguage="python"
        language="python"
        value={code}
        onChange={(value) =>
          setCode(value || "")
        }

        theme="vs-dark"

        options={{
          minimap: {
            enabled: false
          },

          fontSize: 15,

          automaticLayout: true,

          scrollBeyondLastLine: false
        }}
      />

    </div>
  );
}