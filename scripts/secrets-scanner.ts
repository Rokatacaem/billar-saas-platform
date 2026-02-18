#!/usr/bin/env tsx
/**
 * 🛡️ Sentinel: Secrets Scanner
 * Scans codebase for exposed credentials and sensitive data
 */

import * as fs from 'fs';
import * as path from 'path';

interface SecretPattern {
    name: string;
    pattern: RegExp;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const SECRET_PATTERNS: SecretPattern[] = [
    {
        name: 'AWS Access Key',
        pattern: /AKIA[0-9A-Z]{16}/g,
        severity: 'CRITICAL'
    },
    {
        name: 'Generic API Key',
        pattern: /api[_-]?key[_-]?[=:]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi,
        severity: 'HIGH'
    },
    {
        name: 'Database URL with Credentials',
        pattern: /postgresql:\/\/[^:]+:[^@]+@[^\/]+/gi,
        severity: 'CRITICAL'
    },
    {
        name: 'MySQL Connection String',
        pattern: /mysql:\/\/[^:]+:[^@]+@[^\/]+/gi,
        severity: 'CRITICAL'
    },
    {
        name: 'Private Key',
        pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
        severity: 'CRITICAL'
    },
    {
        name: 'JWT Token',
        pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
        severity: 'HIGH'
    },
    {
        name: 'Generic Secret',
        pattern: /secret[_-]?[=:]\s*['"]?[a-zA-Z0-9]{16,}['"]?/gi,
        severity: 'MEDIUM'
    },
    {
        name: 'Generic Password',
        pattern: /password[_-]?[=:]\s*['"]?[^'"\s]{8,}['"]?/gi,
        severity: 'HIGH'
    },
    {
        name: 'Slack Token',
        pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
        severity: 'HIGH'
    },
    {
        name: 'GitHub Token',
        pattern: /gh[pousr]_[a-zA-Z0-9]{36}/g,
        severity: 'CRITICAL'
    }
];

const EXCLUDED_DIRS = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'coverage',
    '.vercel',
    '.gemini'
];

const EXCLUDED_FILES = [
    '.env.example',
    'secrets-scanner.ts',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock'
];

interface Finding {
    file: string;
    line: number;
    pattern: string;
    match: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

function scanFile(filePath: string): Finding[] {
    const findings: Finding[] = [];

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            SECRET_PATTERNS.forEach(pattern => {
                const matches = line.matchAll(pattern.pattern);
                for (const match of matches) {
                    // Skip if it's clearly a placeholder or example
                    if (
                        match[0].includes('your-') ||
                        match[0].includes('example') ||
                        match[0].includes('placeholder') ||
                        match[0].includes('xxx') ||
                        match[0].includes('***')
                    ) {
                        continue;
                    }

                    findings.push({
                        file: filePath,
                        line: index + 1,
                        pattern: pattern.name,
                        match: match[0].substring(0, 50) + '...',
                        severity: pattern.severity
                    });
                }
            });
        });
    } catch (error) {
        // Skip files that can't be read
    }

    return findings;
}

function scanDirectory(dir: string, findings: Finding[] = []): Finding[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!EXCLUDED_DIRS.includes(entry.name)) {
                scanDirectory(fullPath, findings);
            }
        } else if (entry.isFile()) {
            if (!EXCLUDED_FILES.includes(entry.name)) {
                const fileFindings = scanFile(fullPath);
                findings.push(...fileFindings);
            }
        }
    }

    return findings;
}

async function main() {
    console.log('\n🛡️ SENTINEL: Secrets Scanner\n');
    console.log('='.repeat(70));
    console.log('Scanning codebase for exposed credentials...\n');

    const rootDir = process.cwd();
    const findings = scanDirectory(rootDir);

    if (findings.length === 0) {
        console.log('✅ No exposed secrets detected!\n');
        console.log('='.repeat(70) + '\n');
        return;
    }

    // Group by severity
    const critical = findings.filter(f => f.severity === 'CRITICAL');
    const high = findings.filter(f => f.severity === 'HIGH');
    const medium = findings.filter(f => f.severity === 'MEDIUM');

    console.log(`❌ Found ${findings.length} potential secret(s):\n`);

    if (critical.length > 0) {
        console.log(`🚨 CRITICAL (${critical.length}):`);
        critical.forEach(f => {
            console.log(`   ${f.file}:${f.line}`);
            console.log(`   Pattern: ${f.pattern}`);
            console.log(`   Match: ${f.match}\n`);
        });
    }

    if (high.length > 0) {
        console.log(`⚠️  HIGH (${high.length}):`);
        high.forEach(f => {
            console.log(`   ${f.file}:${f.line}`);
            console.log(`   Pattern: ${f.pattern}`);
            console.log(`   Match: ${f.match}\n`);
        });
    }

    if (medium.length > 0) {
        console.log(`📋 MEDIUM (${medium.length}):`);
        medium.forEach(f => {
            console.log(`   ${f.file}:${f.line}`);
            console.log(`   Pattern: ${f.pattern}`);
            console.log(`   Match: ${f.match}\n`);
        });
    }

    console.log('='.repeat(70));
    console.log('⚠️  ACTION REQUIRED: Review and remove exposed secrets');
    console.log('='.repeat(70) + '\n');

    process.exit(critical.length > 0 ? 1 : 0);
}

main();
