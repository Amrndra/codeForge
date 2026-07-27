// No imports needed, using native fetch in Node 18+

const testGlot = async () => {
    const payload = {
        files: [
            {
                name: "main.py",
                content: "print('Hello from Glot.io keyless')"
            }
        ]
    };
    try {
        const response = await fetch("https://glot.io/api/run/python/latest", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        console.log("Status:", response.status);
        console.log("Status text:", response.statusText);
        const text = await response.text();
        console.log("Response:", text);
    } catch (e) {
        console.error("Error:", e);
    }
};

testGlot();
