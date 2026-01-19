# Stitch MCP

**Universal MCP Server for Google Stitch**

Build amazing UI/UX designs instantly with AI. Works seamlessly with Cursor, Claude, Antigravity, and any MCP-compatible editor.

Created by **Aakash Kargathara**.

---

## 🚀 How It Works

![Stitch Flowchart](https://mermaid.ink/img/pako:eNp9ks1KAzEQx19lSEEUWgR7cg_C0kop-FGsPUjtId2d7i7uJksyaS3dHnwBRQTx5qWIV28-jy-gj2B2s4JezCEf_8wvmfknKxbIEJnHIsXzGM67lwJsG2lU2-Ov5_sNXEgDu9DFOaYyRzXZgVbroDjhZBRP4YiLyPAIC_D7Nn7zaEfwtU40cUETd5qVSua4M4CBkiQDmRYwRDVHZZmHF9CUUBC3siCvCbdZUUMMjELwDcUFdFJpwvHH083n-x30pIxSdFrNVXOHVUeCP-gXcCiiRKC96vYVfvR-rdagW1RkDwUqTqgLODWUGypzfINR35qgk0ho2IKONa0mXUxFnqE1RejSiz-FD2O5sGppqtNdr2lp069LnSVp6jVm-7OmJiWv0Gu02-163lokIcXeXn79G6xTduB0-j_ImixDlfEkZN6KUYxZ-eghzrhJia2bjBuSw6UImEfKYJOZPLQedBNuP0bmxPU3MxfCuQ?bgColor=!white)

## ✨ Why this is cool
- **Zero Config**: Just login once and it works everywhere.
- **Universal**: Works on Windows, Mac, and Linux.
- **Free**: Google Stitch API is free to use.

## �️ Quick Setup (2 Minutes)

### 1. Prerequisite: Google Cloud
You need a Google Cloud project with the Stitch API enabled.

```bash
# Login to your Google Cloud
gcloud auth login

# Set your project (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default set-quota-project YOUR_PROJECT_ID

# Enable the magic
gcloud beta services mcp enable stitch.googleapis.com
```

### 2. Install the Credentials
This gives `stitch-mcp` permission to talk to Google on your behalf.

```bash
gcloud auth application-default login
```

### 3. Add to Your AI Editor

Copy and paste this into your MCP config file:

**For Claude Desktop**:
`~/Library/Application Support/Claude/claude_desktop_config.json`

**For Cursor**:
Settings > MCP > Add New Server

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "stitch-mcp"],
      "env": {
         "GOOGLE_CLOUD_PROJECT": "YOUR_PROJECT_ID"
      }
    }
  }
}
```

## 🎮 What You Can Do

Just talk to your AI naturally!

| You say... | Stitch does... |
|------------|----------------|
| **"Create a new generic project"** | Creates a project folder for your ideas |
| **"Design a minimal music player app in dark mode"** | Generates a full UI design |
| **"Show me the login screen"** | Retrieves screen details |
| **"Download the HTML for this screen"** | Gets you the code |

**Example Flow:**

1.  **You**: "Design a habit tracker app"
2.  **AI**: Calls `stitch-mcp` to generate screen...
3.  **Stitch**: Returns the design image and HTML
4.  **AI**: "Here is your design! 🎨"

## 📄 License

**Apache 2.0** - Open source and free to use.

---
*Built with ❤️ by Aakash Kargathara*
