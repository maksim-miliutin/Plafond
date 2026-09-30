import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "e2e",
    testMatch: "**/*.e2e.ts",
    forbidOnly: Boolean(process.env.CI),
    retries: 0,
    reporter: process.env.CI ? [["github"], ["list"]] : "list",
    use: {
        baseURL: "http://localhost:3000",
        trace: "retain-on-failure",
    },
    webServer: {
        command: "npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },
    projects: [
        { name: "desktop", use: { ...devices["Desktop Chrome"] } },
        { name: "iphone-se", use: { ...devices["iPhone SE (3rd gen)"] } },
        { name: "iphone-17", use: { ...devices["iPhone 17"] } },
    ],
});
