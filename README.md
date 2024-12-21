# Error Reporter for Visual Studio Code

Error Reporter is a VSCode extension that collects errors, warnings, and informational messages from your workspace and outputs them as easy-to-read reports.

## ⚠️ Important Notes

Key limitations to keep in mind when using this extension:

1. **Error Detection Mechanism**:
   - It relies on VSCode's diagnostic capabilities, so **you must open the files and ensure VSCode detects the errors**.
   - Errors in unopened files or files that VSCode has not yet diagnosed cannot be detected.

2. **Recommended Workflow**:
   - Open the files where you want to check for errors in VSCode.
   - Wait for VSCode to display diagnostics (e.g., red squiggly lines).
   - Generate the error report after ensuring diagnostics are visible.

## Features

- **Comprehensive Error Detection**:
  - Automatically scans errors in open files in VSCode.
  - Supports multiple file types (TypeScript, JavaScript, Python, Java, etc.).
  - Includes detailed information with code snippets of error locations.

- **Customizable Output**:
  - Markdown format (default).
  - Plain text format.
  - JSON format.
  - CSV format.

- **Flexible Filtering**:
  - Filter by severity level (errors, warnings, information).
  - Specify file types.
  - Configure exclusion patterns.

## Installation

### Install from VSCode Marketplace
1. Open VSCode.
2. Open the Extensions view (Ctrl+Shift+X or Cmd+Shift+X).
3. Search for "Error Reporter."
4. Click "Install."

### Install from .vsix File
1. Download the `.vsix` file from the release page.
2. Open VSCode.
3. Open the Extensions view.
4. From the ... menu, select "Install from VSIX..."
5. Select the downloaded `.vsix` file.

## Usage

1. Open your project in VSCode.
2. **Open all files where you want to check for errors**:
   - This step is crucial.
   - Wait for VSCode to complete its diagnostics and display errors (e.g., red squiggly lines).
3. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P).
4. Run the "Export Errors to File" command.
5. Check the progress indicator.
6. Once complete, an error report is generated.

### Limitations

- Errors in unopened files are not detected.
- You must wait for VSCode diagnostics to finish.
- For large projects, opening all files and waiting for diagnostics may take time.

## Configuration Options

You can modify settings as follows:
1. Open VSCode Settings (Ctrl+, or Cmd+,).
2. Search for "Error Reporter."

### Available Settings

```json
{
    "errorReporter.includeFileTypes": [
        "**/*.ts",
        "**/*.js",
        "**/*.tsx",
        "**/*.jsx",
        "**/*.vue",
        "**/*.py",
        "**/*.java",
        "**/*.cs"
    ],
    "errorReporter.excludePatterns": [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.git/**"
    ],
    "errorReporter.severityLevel": "error",
    "errorReporter.outputPath": "",
    "errorReporter.outputFormat": "markdown"
}
```

### Explanation of Settings

- **includeFileTypes**: File patterns to scan.
- **excludePatterns**: Patterns to exclude from scanning.
- **severityLevel**:
  - "error": Errors only.
  - "warning": Errors and warnings.
  - "info": All diagnostics.
- **outputPath**: Path for the output file (if empty, defaults to the workspace root).
- **outputFormat**: Report format (markdown, txt, json, csv).

## Output Formats

### Markdown Format (Default)
```markdown
# Error Report

## Overview
- Generated On: 2024-12-21T10:30:00Z
- Total Issues Detected: 5

### Breakdown by Severity
| Severity | Count |
|----------|-------|
| Errors   | 3     |
| Warnings | 2     |

## Details by File
### src/app.ts
| Line | Severity | Message          | Code Snippet       |
|------|----------|------------------|--------------------|
| 42   | Error    | Variable not found | const x = y;      |
```

### Other Formats
- **Plain Text**: Simple text report.
- **JSON**: Structured data for programmatic processing.
- **CSV**: Suitable for spreadsheet analysis.

## Troubleshooting

### If No Errors Are Detected
1. **Most Common Cause**: The file is not open in VSCode.
   - Solution: Open the file, wait for VSCode's diagnostics (e.g., red squiggly lines) to appear, and then run the extension.
2. **Other Checks**:
   - Verify that the file extension is included in `includeFileTypes`.
   - Ensure the file is not excluded by `excludePatterns`.
   - Check that `severityLevel` is set appropriately.

### If Reports Are Not Generated
1. Check workspace permissions.
2. Verify that the custom output path is correct if specified.
3. Restart VSCode and try again.

## Developer Information

### Build Instructions
```bash
# Install dependencies
npm install

# Build the extension
npm run compile

# Watch mode for development
npm run watch
```

### Debugging
1. Open the project in VSCode.
2. Press F5 to start a debug session.
3. Check the developer tools (Ctrl+Shift+I) for logs.

## License

MIT License - See the [LICENSE](LICENSE) file for details.

## Contribution

1. Fork this repository.
2. Create a new branch.
3. Commit your changes.
4. Submit a pull request.

## Changelog

### Version 0.0.1
- Initial release.
- Basic error detection.
- Support for multiple output formats.
- Configurable settings.
- Code snippet display for error locations.