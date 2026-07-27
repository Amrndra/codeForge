"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSearchParams } from "next/navigation"
import {apiFetch} from "@/lib/api"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Play, Send, RotateCcw, Copy, CheckCircle2, Plus, Trash2, Loader2 } from "lucide-react"
import Editor from "@monaco-editor/react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";


const languages = [
  { id: "cpp", name: "C++17", extension: "cpp" },
  { id: "python", name: "Python 3", extension: "py" },
  { id: "java", name: "Java 17", extension: "java" },
]

interface TestCase {
  input: string
  output: string
}

interface RunCaseResult {
  index: number
  status: string
  input: string
  expectedOutput: string | null
  output: string
}

interface RunResponse {
  status: string
  output: string
  results: RunCaseResult[]
}

const defaultCode = `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Your code here
    
    return 0;
}`

const starterCodeByLanguage: Record<string, string> = {
  cpp: defaultCode,
  python: `def main():
    # Your code here
    pass


if __name__ == "__main__":
    main()`,
  java: `public class Main {
    public static void main(String[] args) {
        // Your code here
    }
}`,
}

const getCodeStorageKey = (problemId: string, language: string) =>
  `codeforge:problem-code:${problemId}:${language}`

const getStarterCode = (language: string) =>
  starterCodeByLanguage[language] ?? defaultCode

export default function ProblemPage() {
  const { slug } = useParams<{ slug: string }>()
  const [problem,setProblem]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("cpp")
  const [code, setCode] = useState(defaultCode)
  const [output, setOutput] = useState("")
  const [activePanel, setActivePanel] = useState<"cases" | "output">("cases")
  const [copied, setCopied] = useState(false)
  const [sampleTestCases, setSampleTestCases] = useState<TestCase[]>([])
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([{ input: "", output: "" }])
  const [isRunning, setIsRunning] = useState(false)
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/problems";
  const contestId = searchParams.get("contestId");
  const languageMap: Record<string, string> = {
    cpp: "C++",
    java: "Java",
    python: "Python",
  };

  const problemId = problem?._id ?? ""
  const codeStorageKey = problemId
    ? getCodeStorageKey(problemId, selectedLanguage)
    : ""

  const persistCode = (problemIdToStore: string, languageToStore: string, value: string) => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(
      getCodeStorageKey(problemIdToStore, languageToStore),
      value
    )
  }

  const handleLanguageChange = (nextLanguage: string) => {
    if (problemId) {
      persistCode(problemId, selectedLanguage, code)
    }

    setSelectedLanguage(nextLanguage)
  }

  const formatRunResult = (runResult: RunResponse) => {
    const lines: string[] = []
    lines.push(`Verdict: ${runResult.status}`)
    lines.push("")

    if (!runResult.results.length) {
      lines.push(runResult.output || "No test cases were provided.")
      return lines.join("\n")
    }

    lines.push(runResult.output || "Run completed.")
    lines.push("")

    runResult.results.forEach((result, index) => {
      const label = result.index < sampleTestCases.length ? "Sample" : "Custom"
      lines.push(`Test Case ${index + 1} (${label})`)
      lines.push(`Status: ${result.status}`)
      lines.push("Input:")
      lines.push(result.input || "")
      lines.push("Expected Output:")
      lines.push(result.expectedOutput ?? "-")
      lines.push("Actual Output:")
      lines.push(result.output || "")
      if (index !== runResult.results.length - 1) {
        lines.push("")
      }
    })

    return lines.join("\n")
  }

  useEffect(
    ()=>{
        (async()=>{
            try{setLoading(true);
                const res=await apiFetch(`/problems/${slug}`);
                const problemData = res.data;
            setProblem(problemData)
            setSampleTestCases(Array.isArray(problemData?.sampleTestCases) ? problemData.sampleTestCases : [])
            console.log(problemData)
            }
            catch(e:any){
                setError(e.message)
            }
            finally{
                setLoading(false)
            }
        }
    )()},[slug])

  useEffect(() => {
    if (!problemId || typeof window === "undefined") {
      return
    }

    const savedCode = window.localStorage.getItem(codeStorageKey)
    setCode(savedCode ?? getStarterCode(selectedLanguage))
  }, [problemId, codeStorageKey, selectedLanguage])

  useEffect(() => {
    if (!problemId || typeof window === "undefined") {
      return
    }

    const timeoutId = window.setTimeout(() => {
      persistCode(problemId, selectedLanguage, code)
    }, 750)

    return () => window.clearTimeout(timeoutId)
  }, [problemId, selectedLanguage, code])


  if (loading) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center text-sm text-muted-foreground">
        Loading problem...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center text-sm text-muted-foreground">
        Problem not found.
      </div>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addCustomTestCase = () => {
    setCustomTestCases((cases) => [...cases, { input: "", output: "" }])
  }

  const updateCustomTestCase = (index: number, field: keyof TestCase, value: string) => {
    setCustomTestCases((cases) =>
      cases.map((testCase, currentIndex) =>
        currentIndex === index ? { ...testCase, [field]: value } : testCase
      )
    )
  }

  const removeCustomTestCase = (index: number) => {
    setCustomTestCases((cases) => cases.filter((_, currentIndex) => currentIndex !== index))
  }

  const buildRunTestCases = () => {
    const normalizedCustomCases = customTestCases
      .filter((testCase) => testCase.input.trim() !== "" || testCase.output.trim() !== "")
      .map((testCase) => ({
        input: testCase.input,
        output: testCase.output,
      }))

    return [...sampleTestCases, ...normalizedCustomCases]
  }

  const pollSubmission = (submissionId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/submissions/${submissionId}`);

        const submission = res.data.submission;

        if (
          submission.status === "Pending" ||
          submission.status === "Judging"
        ) {
          setOutput(
  `Status: ${submission.status}

  Waiting for judge...`
          );

          return;
        }

        clearInterval(interval);

        setOutput(
  `Verdict: ${submission.verdict}

  Time: ${submission.executionTime ?? "-"} ms

  Memory: ${submission.memoryUsed ?? "-"} MB`
        );
      } catch (err: any) {
        clearInterval(interval);
        setOutput(err.message);
      }
    }, 1500);
  };

  const pollRunJob = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/submissions/run/${jobId}`)
        const { state, result, failedReason } = res.data

        if (state === "waiting" || state === "active" || state === "delayed") {
          setOutput("Running code...")
          return
        }

        clearInterval(interval)
        setIsRunning(false)

        if (state === "completed" && result) {
          setOutput(formatRunResult(result))
          return
        }

        setOutput(failedReason || "Run job failed.")
      } catch (err: any) {
        clearInterval(interval)
        setIsRunning(false)
        setOutput(err.message)
      }
    }, 1000)
  }

  const handleRun = async () => {

    const language = languageMap[selectedLanguage];

    if (!language) {
      setActivePanel("output");
      setOutput("This language is not supported yet.");
      return;
    }

    const testCases = buildRunTestCases();

    if (testCases.length === 0) {
      setActivePanel("output");
      setOutput("Add at least one sample or custom test case before running code.");
      return;
    }

    try {
      setActivePanel("output");
      setIsRunning(true);
      setOutput("Running code...");

      const runRes = await apiFetch(
        `/submissions/run`,
        {
          method: "POST",
          body: JSON.stringify({
            problemId: problem._id,
            language,
            code,
            sampleTestCases,
            customTestCases,
          }),
        }
      );

        const jobId = runRes.data.jobId;
        setOutput("Running code...");

      pollRunJob(jobId);
    } catch (err: any) {
      setIsRunning(false)
      setOutput(err.message)
    }
  };
  const handleSubmit = async () => {

    const language = languageMap[selectedLanguage];

    if (!language) {
      setActivePanel("output");
      setOutput("This language is not supported yet.");
      return;
    }

    try {
      setActivePanel("output");
      setOutput("Submitting solution...");

      const submitRes = await apiFetch(
        `/submissions/submit`,
        {
          method: "POST",
          body: JSON.stringify({
            problemId: problem._id,
            language,
            code,
            contestId
          }),
        }
      );
      console.log("Submission response:", submitRes);
      const submissionId = submitRes.data.submissionId;

      setOutput(`Submission queued...\nSubmission ID: ${submissionId}`);

      pollSubmission(submissionId);

    } catch (err: any) {
      setOutput(err.message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col">
      {/* Problem Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={returnTo}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Problems
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">{problem.title}</h1>
            <span className="rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              {problem.difficulty}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Time: {problem.timelimit+" ms"}</span>
          <span className="text-border">|</span>
          <span>Memory: {problem.memorylimit+" MB"}</span>
        </div>
      </div>

      {/* Main Content */}
      <PanelGroup direction="horizontal" className="flex-1">

        {/* Problem Statement */}
        <Panel defaultSize={45} minSize={25}>
          <div className="h-full overflow-auto border-r border-border p-6">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-xl font-semibold">Problem Statement</h2>

              <p className="text-muted-foreground whitespace-pre-wrap">
                {problem.statement}
              </p>

              <h3 className="mt-6 text-lg font-semibold">
                Input Format
              </h3>

              <p className="whitespace-pre-wrap">
                {problem.inputFormat}
              </p>

              <h3 className="mt-6 text-lg font-semibold">
                Output Format
              </h3>

              <p className="whitespace-pre-wrap">
                {problem.outputFormat}
              </p>

              <h3 className="mt-6 text-lg font-semibold">
                Constraints
              </h3>

              <p className="whitespace-pre-wrap">
                {problem.constraints}
              </p>

              <h3 className="mt-6 text-lg font-semibold">
                Examples
              </h3>

              {problem.sampleTestCases?.map((sample: any, index: number) => (
                <div
                  key={index}
                  className="mt-4 rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="mb-2 text-sm font-medium">
                    Example {index + 1}
                  </div>

                  <div className="font-mono text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Input:
                      </span>

                      <pre>{sample.input}</pre>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Output:
                      </span>

                      <pre>{sample.output}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />

        {/* Right Side */}
        <Panel defaultSize={55} minSize={30}>

          <div className="flex h-full flex-col">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">

              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="rounded border border-border bg-secondary px-3 py-1.5 text-sm"
              >
                {languages.map((lang) => (
                  <option
                    key={lang.id}
                    value={lang.id}
                  >
                    {lang.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied
                    ? <CheckCircle2 className="h-4 w-4 text-success" />
                    : <Copy className="h-4 w-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const starterCode = getStarterCode(selectedLanguage)
                    setCode(starterCode)

                    if (problemId) {
                      persistCode(problemId, selectedLanguage, starterCode)
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

              </div>

            </div>

            <PanelGroup
              direction="vertical"
              className="flex-1"
            >

              {/* Editor */}
              <Panel defaultSize={75} minSize={30}>

                <Editor
                  height="100%"
                  language={selectedLanguage}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value ?? "")}
                  options={{
                    minimap: { enabled: false },
                    automaticLayout: true,
                    fontSize: 14,
                    tabSize: 4,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                  }}
                />

              </Panel>

              <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors" />

              {/* Bottom Panel */}
              <Panel
                defaultSize={25}
                minSize={15}
              >

                <div className="flex h-full flex-col">

                  <div className="flex border-b border-border">

                    <button
                      onClick={() => setActivePanel("cases")}
                      className={`px-4 py-2 ${
                        activePanel === "cases"
                          ? "border-b-2 border-primary"
                          : ""
                      }`}
                    >
                      Test Cases
                    </button>

                    <button
                      onClick={() => setActivePanel("output")}
                      className={`px-4 py-2 ${
                        activePanel === "output"
                          ? "border-b-2 border-primary"
                          : ""
                      }`}
                    >
                      Output
                    </button>

                  </div>

                  <div className="flex-1 overflow-auto p-4">

                    {activePanel === "cases" ? (

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h3 className="text-sm font-semibold">Sample Testcases</h3>
                              <p className="text-xs text-muted-foreground">
                                Loaded from the problem data. Edit them if you want to run a modified version.
                              </p>
                            </div>
                          </div>

                          {sampleTestCases.length > 0 ? sampleTestCases.map((testCase, index) => (
                            <div
                              key={`sample-${index}`}
                              className="rounded-lg border border-border bg-secondary/20 p-3"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-medium">Sample {index + 1}</span>
                                <span className="text-xs text-muted-foreground">Editable</span>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                    Input
                                  </label>
                                  <textarea
                                    value={testCase.input}
                                    onChange={(e) => setSampleTestCases((cases) => cases.map((currentCase, currentIndex) => currentIndex === index ? { ...currentCase, input: e.target.value } : currentCase))}
                                    className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none"
                                    placeholder="Enter testcase input"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                    Expected Output
                                  </label>
                                  <textarea
                                    value={testCase.output}
                                    onChange={(e) => setSampleTestCases((cases) => cases.map((currentCase, currentIndex) => currentIndex === index ? { ...currentCase, output: e.target.value } : currentCase))}
                                    className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none"
                                    placeholder="Enter expected output"
                                  />
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="rounded-lg border border-dashed border-border bg-secondary/10 p-4 text-sm text-muted-foreground">
                              No sample testcases found for this problem.
                            </div>
                          )}
                        </div>

                        <div className="border-t border-border pt-4 space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h3 className="text-sm font-semibold">Custom Testcases</h3>
                              <p className="text-xs text-muted-foreground">
                                These are added only for the current run.
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addCustomTestCase}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Case
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {customTestCases.map((testCase, index) => (
                              <div
                                key={`custom-${index}`}
                                className="rounded-lg border border-border bg-secondary/20 p-3"
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-sm font-medium">Custom {index + 1}</span>

                                  {customTestCases.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCustomTestCase(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                      Input
                                    </label>
                                    <textarea
                                      value={testCase.input}
                                      onChange={(e) => updateCustomTestCase(index, "input", e.target.value)}
                                      className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none"
                                      placeholder="Enter testcase input"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                      Expected Output
                                    </label>
                                    <textarea
                                      value={testCase.output}
                                      onChange={(e) => updateCustomTestCase(index, "output", e.target.value)}
                                      className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none"
                                      placeholder="Enter expected output"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    ) : (

                      <div className="space-y-3">
                        {isRunning && (
                          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/20 px-3 py-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Running...
                          </div>
                        )}

                        <pre className="whitespace-pre-wrap font-mono text-sm leading-6">
                          {output || "Run your code to see output here."}
                        </pre>
                      </div>

                    )}

                  </div>

                </div>

              </Panel>

            </PanelGroup>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">

              <Button
                variant="outline"
                onClick={handleRun}
                disabled={isRunning}
              >
                <Play className="mr-2 h-4 w-4" />
                Run
              </Button>

              <Button onClick={handleSubmit}>
                <Send className="mr-2 h-4 w-4" />
                Submit
              </Button>

            </div>

          </div>

        </Panel>

      </PanelGroup>
    </div>
  )
}
