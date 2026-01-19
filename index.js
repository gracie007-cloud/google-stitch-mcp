#!/usr/bin/env node

/**
 * stitch-mcp - Universal MCP Server for Google Stitch
 * 
 * robust, cross-platform implementation.
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { exec } = require("child_process");
const { promisify } = require("util");
const os = require("os");

const execAsync = promisify(exec);

const STITCH_URL = "https://stitch.googleapis.com/mcp";
const TIMEOUT_MS = 180000; // 3 minutes

// Helpers for formatted logging
const log = {
    info: (msg) => console.error(`[stitch-mcp] ℹ️  ${msg}`),
    success: (msg) => console.error(`[stitch-mcp] ✅ ${msg}`),
    warn: (msg) => console.error(`[stitch-mcp] ⚠️  ${msg}`),
    error: (msg) => console.error(`[stitch-mcp] ❌ ${msg}`),
};

// Cross-platform gcloud execution
async function runGcloud(params) {
    const isWin = os.platform() === "win32";
    const command = isWin ? "gcloud.cmd" : "gcloud";
    const fullCommand = `${command} ${params}`;

    try {
        const { stdout } = await execAsync(fullCommand, {
            encoding: "utf8",
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 10000, // 10s timeout for CLI commands
            windowsHide: true
        });
        return stdout.trim();
    } catch (error) {
        // Enhance error message
        const msg = error.message || error.toString();
        if (msg.includes("ENOENT") || msg.includes("not recognized")) {
            throw new Error(`gcloud CLI not found. Please install Google Cloud SDK.`);
        }
        if (msg.includes("Reauthentication required") || msg.includes("Credentials")) {
            throw new Error(`Authentication expired. Run: gcloud auth application-default login`);
        }
        throw error;
    }
}

async function getAccessToken() {
    try {
        return await runGcloud("auth application-default print-access-token");
    } catch (error) {
        log.error("Failed to get access token");
        throw error;
    }
}

async function getProjectId() {
    // 1. Env var
    if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
    if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;

    // 2. gcloud config
    try {
        const project = await runGcloud("config get-value project");
        if (project && project !== "(unset)") {
            return project;
        }
    } catch (e) { /* ignore */ }

    throw new Error("Project ID not found. Set GOOGLE_CLOUD_PROJECT env var or run: gcloud config set project YOUR_PROJECT");
}

async function callStitchAPI(method, params, projectId) {
    const token = await getAccessToken();

    const body = {
        jsonrpc: "2.0",
        method,
        params,
        id: Date.now()
    };

    log.info(`→ ${method}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(STITCH_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Goog-User-Project": projectId,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const text = await response.text();
            let errorMessage = `HTTP ${response.status}: ${text}`;
            let errorCode = -32000; // Default server error

            // Map HTTP errors to JSON-RPC errors
            if (response.status === 400) errorCode = -32602; // Invalid params
            if (response.status === 401 || response.status === 403) errorCode = -32001; // Auth error
            if (response.status === 404) errorCode = -32601; // Method not found

            throw { code: errorCode, message: errorMessage };
        }

        const data = await response.json();
        log.success(`Completed ${method}`);
        return data;

    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') throw { code: -32002, message: "Request timeout (3 minutes)" };
        if (error.code) throw error; // Already formatted
        throw { code: -32603, message: error.message || "Internal error" };
    }
}

async function main() {
    try {
        log.info(`Starting Stitch MCP Server v1.0.0 (${os.platform()})`);

        // 1. Startup Checks
        const projectId = await getProjectId();
        log.info(`Project: ${projectId}`);

        try {
            await getAccessToken();
            log.success("Auth verified");
        } catch (e) {
            throw new Error("Authentication failed. Run: gcloud auth application-default login");
        }

        // 2. Setup Server
        const server = new Server(
            { name: "stitch", version: "1.0.0" },
            { capabilities: { tools: {} } }
        );

        const { ListToolsRequestSchema, CallToolRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

        // 3. Handlers
        let cachedTools = null;

        server.setRequestHandler(ListToolsRequestSchema, async () => {
            if (cachedTools) return cachedTools;
            try {
                const result = await callStitchAPI("tools/list", {}, projectId);
                if (result.result) {
                    cachedTools = result.result;
                    return result.result;
                }
                return { tools: [] };
            } catch (error) {
                log.error(`Tools list failed: ${error.message}`);
                // Return empty list instead of crashing, but log error
                return { tools: [] };
            }
        });

        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                const result = await callStitchAPI("tools/call", { name, arguments: args || {} }, projectId);
                if (result.result) return result.result;
                if (result.error) return { content: [{ type: "text", text: `API Error: ${result.error.message}` }], isError: true };
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                log.error(`Tool ${name} failed: ${error.message}`);
                return {
                    content: [{ type: "text", text: `Error: ${error.message}` }],
                    isError: true
                };
            }
        });

        server.onerror = (err) => log.error(`Server error: ${err}`);

        // 4. Connect
        const transport = new StdioServerTransport();
        await server.connect(transport);
        log.success("Server ready and listening on stdio");

    } catch (error) {
        log.error(`Fatal Startup Error: ${error.message}`);
        process.exit(1);
    }
}

main();
