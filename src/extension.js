"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('error-reporter.exportErrors', async () => {
        try {
            // Get all diagnostics from all files
            const allDiagnostics = [];
            // Iterate through all open text editors
            vscode.workspace.textDocuments.forEach(document => {
                const diagnostics = vscode.languages.getDiagnostics(document.uri);
                diagnostics.forEach(diagnostic => {
                    if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                        allDiagnostics.push({
                            filePath: vscode.workspace.asRelativePath(document.uri),
                            line: diagnostic.range.start.line + 1,
                            message: diagnostic.message
                        });
                    }
                });
            });
            if (allDiagnostics.length === 0) {
                vscode.window.showInformationMessage('No errors found in the workspace.');
                return;
            }
            // Create error report content
            const reportContent = formatErrorReport(allDiagnostics);
            // Get workspace folder path
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('No workspace folder open');
            }
            // Create output file
            const outputPath = path.join(workspaceFolders[0].uri.fsPath, 'error-report.txt');
            fs.writeFileSync(outputPath, reportContent);
            vscode.window.showInformationMessage(`Error report exported to: ${outputPath}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to export errors: ${error}`);
        }
    });
    context.subscriptions.push(disposable);
}
function formatErrorReport(errors) {
    const timestamp = new Date().toISOString();
    let content = `Error Report - Generated at ${timestamp}\n`;
    content += '='.repeat(50) + '\n\n';
    errors.forEach((error, index) => {
        content += `Error #${index + 1}\n`;
        content += `---------\n`;
        content += `File: ${error.filePath}\n`;
        content += `Line: ${error.line}\n`;
        content += `Message: ${error.message}\n\n`;
    });
    return content;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map