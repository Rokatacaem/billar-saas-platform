import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Security Audit - Dependency Scanner
 * Escanea vulnerabilidades en dependencias npm
 */

async function main() {
    console.log('🔍 Starting Security Audit...\n');

    const reportsDir = path.join(process.cwd(), 'security-reports');

    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    try {
        // Ejecutar npm audit
        console.log('Running npm audit...');
        const auditOutput = execSync('npm audit --json', {
            encoding: 'utf8',
            stdio: 'pipe'
        });

        const audit = JSON.parse(auditOutput);

        // Guardar reporte completo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportsDir, `audit-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2));

        console.log(`\n📄 Full report saved to: ${reportPath}\n`);

        // Analizar severidades
        const vulnerabilities = audit.metadata?.vulnerabilities || {};
        const { info, low, moderate, high, critical } = vulnerabilities;

        console.log('📊 Vulnerability Summary:');
        console.log(`   ℹ️  Info:     ${info || 0}`);
        console.log(`   🟡 Low:      ${low || 0}`);
        console.log(`   🟠 Moderate: ${moderate || 0}`);
        console.log(`   🔴 High:     ${high || 0}`);
        console.log(`   ⚠️  Critical: ${critical || 0}\n`);

        // Fallar si hay vulnerabilidades HIGH o CRITICAL
        if (high > 0 || critical > 0) {
            console.error('❌ SECURITY AUDIT FAILED: High or Critical vulnerabilities found!');
            console.error('\nRun `npm audit fix` to attempt automatic fixes.');
            console.error('For manual review, check the report at:', reportPath);
            process.exit(1);
        }

        console.log('✅ Security audit passed. No critical vulnerabilities found.');

    } catch (error: any) {
        // npm audit retorna exit code 1 si hay vulnerabilidades
        if (error.stdout) {
            try {
                const audit = JSON.parse(error.stdout);
                const vulnerabilities = audit.metadata?.vulnerabilities || {};

                if (vulnerabilities.high > 0 || vulnerabilities.critical > 0) {
                    console.error('❌ CRITICAL VULNERABILITIES DETECTED');
                    console.error(`High: ${vulnerabilities.high}, Critical: ${vulnerabilities.critical}`);
                    process.exit(1);
                }
            } catch (parseError) {
                console.error('Failed to parse audit output:', error.message);
                process.exit(1);
            }
        } else {
            console.error('Audit command failed:', error.message);
            process.exit(1);
        }
    }
}

main();
