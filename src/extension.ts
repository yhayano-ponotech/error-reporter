import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface ErrorReport {
    filePath: string;
    line: number;
    message: string;
    severity: vscode.DiagnosticSeverity;
	codeSnippet?: string;
}

interface Config {
    includeFileTypes: string[];
    excludePatterns: string[];
    severityLevel: string;
    outputPath: string;
    outputFormat: string;
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('error-reporter.exportErrors', async () => {
        try {
            const config = getConfiguration();
            console.log('Current configuration:', config);  // 設定内容をログ出力
            
            const allDiagnostics: ErrorReport[] = [];
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('No workspace folder open');
            }

            // Show progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Scanning for errors...",
                cancellable: true
            }, async (progress, token) => {
                for (const workspaceFolder of workspaceFolders) {
                    if (token.isCancellationRequested) return;

                    // Create include pattern from file types
                    const includePatterns = config.includeFileTypes.map(pattern => 
                        new vscode.RelativePattern(workspaceFolder, pattern)
                    );

                    // Get all files matching any include pattern
                    let files: vscode.Uri[] = [];
                    for (const pattern of includePatterns) {
                        const matchedFiles = await vscode.workspace.findFiles(
                            pattern,
                            `{${config.excludePatterns.join(',')}}`
                        );
                        files = [...files, ...matchedFiles];
                    }

                    const totalFiles = files.length;
                    let processedFiles = 0;

                    for (const file of files) {
                        if (token.isCancellationRequested) return;

                        progress.report({
                            message: `Scanning file ${processedFiles + 1} of ${totalFiles}`,
                            increment: (1 / totalFiles) * 100
                        });

                        const document = await vscode.workspace.openTextDocument(file);
                        // ファイルを開いた後、少し待って診断情報が更新されるのを待つ
                        // await new Promise(resolve => setTimeout(resolve, 1000));
                        const diagnostics = vscode.languages.getDiagnostics(document.uri);
                        
                        // デバッグ用のログ
                        console.log(`File: ${file.fsPath}`);
                        console.log(`Total diagnostics found: ${diagnostics.length}`);
                        
                        // 各診断情報をログ
                        diagnostics.forEach(diagnostic => {
                            console.log(`Severity: ${diagnostic.severity}, Message: ${diagnostic.message}`);
                            if (shouldIncludeDiagnostic(diagnostic, config.severityLevel)) {
								const errorLine = diagnostic.range.start.line;
								const lineText = document.lineAt(errorLine).text;
                                allDiagnostics.push({
                                    filePath: vscode.workspace.asRelativePath(file),
                                    line: diagnostic.range.start.line + 1,
                                    message: diagnostic.message,
                                    severity: diagnostic.severity,
									codeSnippet: lineText
                                });
                            } else {
                                console.log('Diagnostic filtered out by severity level');
                            }
                        });

                        // 各ファイルの処理完了後のカウント
                        console.log(`Accumulated diagnostics: ${allDiagnostics.length}`);

                        processedFiles++;
                    }
                }
            });

            if (allDiagnostics.length === 0) {
                vscode.window.showInformationMessage('No issues found matching the current configuration.');
                return;
            }

            // Generate and save report
            const outputPath = getOutputPath(config, workspaceFolders[0].uri.fsPath);
            const reportContent = formatReport(allDiagnostics, config.outputFormat);
            
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, reportContent);

            vscode.window.showInformationMessage(
                `Report exported to: ${outputPath}`,
                'Open Report'
            ).then(selection => {
                if (selection === 'Open Report') {
                    vscode.workspace.openTextDocument(outputPath)
                        .then(doc => vscode.window.showTextDocument(doc));
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export errors: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

function getConfiguration(): Config {
    const config = vscode.workspace.getConfiguration('errorReporter');
    return {
        includeFileTypes: config.get('includeFileTypes', ['*.ts', '*.js']),
        excludePatterns: config.get('excludePatterns', ['**/node_modules/**']),
        severityLevel: config.get('severityLevel', 'error'),
        outputPath: config.get('outputPath', ''),
        outputFormat: config.get('outputFormat', 'txt')
    };
}

function shouldIncludeDiagnostic(diagnostic: vscode.Diagnostic, severityLevel: string): boolean {
    const severityMap = {
        'error': vscode.DiagnosticSeverity.Error,
        'warning': vscode.DiagnosticSeverity.Warning,
        'info': vscode.DiagnosticSeverity.Information
    };
    
    const minimumSeverity = severityMap[severityLevel as keyof typeof severityMap];
    const shouldInclude = diagnostic.severity <= minimumSeverity;
    
    // デバッグログ
    console.log(`Checking diagnostic severity: ${diagnostic.severity}`);
    console.log(`Minimum severity: ${minimumSeverity}`);
    console.log(`Should include: ${shouldInclude}`);
    
    return shouldInclude;
}

function getOutputPath(config: Config, workspacePath: string): string {
    if (config.outputPath) {
        return path.resolve(config.outputPath);
    }

    const filename = `error-report.${config.outputFormat}`;
    return path.join(workspacePath, filename);
}

function formatReport(errors: ErrorReport[], format: string): string {
    switch (format) {
        case 'json':
            return formatJsonReport(errors);
        case 'markdown':
            return formatMarkdownReport(errors);
        case 'csv':
            return formatCsvReport(errors);
        default:
            return formatTextReport(errors);
    }
}

function formatTextReport(errors: ErrorReport[]): string {
    const timestamp = new Date().toISOString();
    let content = `Error Report - Generated at ${timestamp}\n`;
    content += '='.repeat(50) + '\n\n';
    content += `Total Issues Found: ${errors.length}\n\n`;

    const errorsByFile = groupByFile(errors);

    Object.entries(errorsByFile).forEach(([file, fileErrors]) => {
        content += `File: ${file}\n`;
        content += '-'.repeat(file.length + 6) + '\n';
        
        fileErrors.forEach((error, index) => {
            const severity = getSeverityLabel(error.severity);
            content += `${index + 1}. [${severity}] Line ${error.line}: ${error.message}\n`;
        });
        content += '\n';
    });

    return content;
}

function formatJsonReport(errors: ErrorReport[]): string {
    const report = {
        generated: new Date().toISOString(),
        totalIssues: errors.length,
        issues: groupByFile(errors)
    };
    return JSON.stringify(report, null, 2);
}

function formatMarkdownReport(errors: ErrorReport[]): string {
    const timestamp = new Date().toISOString();
    let content = `# エラーレポート\n\n`;
    content += `## 概要\n\n`;
    content += `- 生成日時: ${timestamp}\n`;
    content += `- 検出された問題の総数: ${errors.length}\n\n`;
    
    const errorsByFile = groupByFile(errors);
    const errorsBySeverity = countBySeverity(errors);

    // 重要度別の集計を追加
    content += `### 重要度別の内訳\n\n`;
    content += `| 重要度 | 件数 |\n`;
    content += `|--------|------|\n`;
    Object.entries(errorsBySeverity).forEach(([severity, count]) => {
        content += `| ${severity} | ${count} |\n`;
    });
    content += '\n';

    // ファイル別のエラー一覧
    content += `## ファイル別の詳細\n\n`;
    Object.entries(errorsByFile).forEach(([file, fileErrors]) => {
        content += `### ${file}\n\n`;
        
        // テーブル形式でエラー情報を表示
        content += `| 行 | 重要度 | メッセージ | 該当コード |\n`;
        content += `|-----|----------|-------------|-------------|\n`;
        fileErrors.forEach((error) => {
            const severity = getSeverityLabel(error.severity);
            // エスケープ処理を追加
            const escapedMessage = error.message.replace(/\|/g, '\\|').replace(/\n/g, ' ');
			const escapedCode = (error.codeSnippet || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
            content += `| ${error.line} | ${severity} | ${escapedMessage} | ${escapedCode} |\n`;
        });
        content += '\n';
    });

    return content;
}

function formatCsvReport(errors: ErrorReport[]): string {
    const headers = ['File', 'Line', 'Severity', 'Message'];
    const rows = errors.map(error => [
        error.filePath,
        error.line.toString(),
        getSeverityLabel(error.severity),
        `"${error.message.replace(/"/g, '""')}"`
    ]);

    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

function groupByFile(errors: ErrorReport[]): Record<string, ErrorReport[]> {
    return errors.reduce((acc, error) => {
        if (!acc[error.filePath]) {
            acc[error.filePath] = [];
        }
        acc[error.filePath].push(error);
        return acc;
    }, {} as Record<string, ErrorReport[]>);
}

function getSeverityLabel(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
        case vscode.DiagnosticSeverity.Error:
            return 'エラー';
        case vscode.DiagnosticSeverity.Warning:
            return '警告';
        case vscode.DiagnosticSeverity.Information:
            return '情報';
        default:
            return 'ヒント';
    }
}

// 重要度別のエラー数を集計する関数
function countBySeverity(errors: ErrorReport[]): Record<string, number> {
    return errors.reduce((acc, error) => {
        const severity = getSeverityLabel(error.severity);
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

export function deactivate() {}