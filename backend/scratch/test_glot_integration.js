// Simple node test script to check the updated executeViaGlot behavior directly.

const GLOT_LANG_MAP = {
    "cpp":        { glotLang: "cpp",        filename: "main.cpp"    },
    "c++":        { glotLang: "cpp",        filename: "main.cpp"    },
    "python":     { glotLang: "python",     filename: "main.py"     },
    "java":       { glotLang: "java",       filename: "Main.java"   },
    "javascript": { glotLang: "javascript", filename: "main.js"     },
};

const executeViaGlot = async (language, code, stdin = "") => {
    const lookupLang = String(language ?? "").toLowerCase();
    const langConfig = GLOT_LANG_MAP[lookupLang];

    if (!langConfig) {
        return {
            stdout: "",
            stderr: "",
            error: `Language "${language}" is not supported by the execution engine.`,
        };
    }

    const { glotLang, filename } = langConfig;
    const token = process.env.GLOT_TOKEN;
    if (!token) {
        return {
            stdout: "",
            stderr: "",
            error: "Execution engine config missing. Please set GLOT_TOKEN in your environment or backend/.env.",
        };
    }
    const url = `https://glot.io/api/run/${glotLang}/latest`;

    const payload = {
        files: [
            {
                name: filename,
                content: code,
            },
        ],
        stdin: stdin,
    };

    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15_000), // Abort after 15 seconds
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            return {
                stdout: "",
                stderr: "",
                error: `Glot.io API error (HTTP ${response.status}): ${errorText || response.statusText}`,
            };
        }

        const data = await response.json();
        return {
            stdout: data.stdout ?? "",
            stderr: data.stderr ?? "",
            error: data.error ?? "",
        };
    } catch (err) {
        console.error("Full fetch error details:", err);
        const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
        return {
            stdout: "",
            stderr: "",
            error: isTimeout
                ? "Execution timed out waiting for Glot.io response."
                : `Network error contacting Glot.io: ${err?.message || "Unknown error"}`,
        };
    }
};

const test = async () => {
    console.log("--- Testing Python ---");
    const pythonCode = "import sys\nprint('Hello ' + sys.stdin.read().strip())";
    const pyRes = await executeViaGlot("Python", pythonCode, "CodeForge");
    console.log("Python Result:", pyRes);

    console.log("\n--- Testing C++ ---");
    const cppCode = `#include <iostream>
using namespace std;
int main() {
    string name;
    cin >> name;
    cout << "Hello C++ " << name << endl;
    return 0;
}`;
    const cppRes = await executeViaGlot("C++", cppCode, "World");
    console.log("C++ Result:", cppRes);

    console.log("\n--- Testing C++ Compilation Error ---");
    const cppBadCode = `#include <iostream>
using namespace std;
int main() {
    bad_line_here;
    return 0;
}`;
    const cppBadRes = await executeViaGlot("C++", cppBadCode);
    console.log("C++ Compilation Error Result:", cppBadRes);
};

test();
