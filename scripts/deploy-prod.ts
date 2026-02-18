
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const steps = [
    {
        title: "1. Environment Variables Configuration",
        check: "Have you set up all PROD variables in Vercel/Render? (DATABASE_URL, NEXTAUTH_SECRET, etc.)",
    },
    {
        title: "2. Database Migration",
        check: "Have you run `npx prisma migrate deploy` against the NEON production database?",
    },
    {
        title: "3. Domain Configuration (Custom Domains)",
        check: "Have you configured the Wildcard Domain (*.tuapp.com) in your DNS provider (Cloudflare/Vercel)?",
    },
    {
        title: "4. SSL Certificates",
        check: "Is SSL active for the root domain and wildcard subdomains?",
    },
    {
        title: "5. Cron Jobs",
        check: "Have you configured Vercel Cron or an external cron for `/api/cron/subscription-check`?",
    },
    {
        title: "6. Super Admin User",
        check: "Have you manually created or verified the SUPER_ADMIN user in the production DB?",
    }
];

async function runChecklist() {
    console.log("\n🚀 BILLAR PLATFORM - PRODUCTION DEPLOYMENT CHECKLIST 🚀\n");
    console.log("This script will guide you through the final verification before Go-Live.\n");

    for (const step of steps) {
        console.log(`\n📋 ${step.title}`);
        const answer = await new Promise<string>(resolve => {
            rl.question(`   ❓ ${step.check} (y/n): `, resolve);
        });

        if (answer.toLowerCase() !== 'y') {
            console.log(`\n❌ STOP: You must complete this step before proceeding.`);
            console.log(`   Action required: Please address "${step.title}" now.`);
            process.exit(1);
        } else {
            console.log(`   ✅ Checked.`);
        }
    }

    console.log("\n\n🎉 CONGRATULATIONS! Your platform is ready for the First Customer.");
    console.log("   Next Step: Run `npm run start` or push to main branch to deploy.");
    rl.close();
}

runChecklist();
