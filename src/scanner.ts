import * as path from 'path';
import * as vscode from 'vscode';
import { exec } from 'child_process';

export interface Issue {
  line: number;
  message: string;
  fix?: string;
}

export async function scanFileForIssues(filePath: string): Promise<Issue[]> {
  return new Promise<Issue[]>((resolve) => {
    // point to semgrep-rules inside your extension workspace
    const rulesDir = path.join(
      vscode.workspace.rootPath || __dirname,
      'semgrep-rules'
    );

    const cmd = `semgrep --config "${rulesDir}" "${filePath}" --json`;
    console.log('🔎 Running:', cmd);

    exec(cmd, (err: Error | null, stdout: string) => {
      if (err) {
        console.error('Semgrep error:', err);
        resolve([]);
        return;
      }
      try {
        const json = JSON.parse(stdout);
        const issues: Issue[] = json.results.map((res: any) => ({
          line: res.start.line,
          message: res.extra.message,
          fix: res.extra.metadata?.fix,
        }));
        resolve(issues);
      } catch (e) {
        console.error('Parse error:', e);
        resolve([]);
      }
    });
  });
}
