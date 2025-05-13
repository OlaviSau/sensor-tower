import { mkdir, readFile, writeFile } from "node:fs/promises";

/**
 * Reads the companies either from a local cache or fetches and caches the input.
 * This speeds up development, but should work on the first run as well.
 */
export async function getCompanies() {
    try {
        const list = await readFile("./cache/companies.input.txt", "utf8");
        console.log("INFO: found input file companies.input.txt, skipping fetch");
        return list;
    } catch {
        return await fetchCompanies();
    }
}

/**
 * Fetches and caches the input companies.
 * Explicitly letting errors bubble as Node.js errors are sufficiently descriptive.
 */
async function fetchCompanies() {
    console.log("INFO: fetching input companies from https://vginsights.com/assets/samples/companies.txt");
    const list = await fetch("https://vginsights.com/assets/samples/companies.txt").then(res => res.text());
    try {
        await mkdir("./cache");
    } catch {
        // ignore
    }
    await writeFile("./cache/companies.input.txt", list);
    console.log("INFO: cached input to ./cache/companies.input.txt");
    return list;
}