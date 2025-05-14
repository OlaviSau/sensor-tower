import { getCompanies } from "./get-companies.js";
import { writeFile } from "node:fs/promises";
import { distance } from "fastest-levenshtein";
import ascii from "any-ascii";

(async () => {
    const inputCompanies = await getCompanies();
    const lines = inputCompanies.trim().split("\n");
    const originalCount = lines.length;
    console.log(`INFO: input has ${originalCount} lines`);

    // just making sure I didn't get funny results by using new line to split
    if (process.env.DEBUG) {
        for (const line of lines) {
            if (line.length < 3) {
                console.log(`INFO: short company name ${line}`);
            } else if (line.length > 50) {
                console.log(`INFO: long company name ${line}`);
            }
        }
        console.log(`INFO: logged abnormal lines for error discovery`);
    }

    // build a map of companies for keeping track of duplicates
    const companies = new Map<string, Company>();
    for (const name of lines) {
        const company = companies.get(name);
        if (!company) {
            companies.set(name, {
                name,
                duplicates: []
            });
        } else {
            company.duplicates.push(name);
            // perhaps useful on a different data set
            console.log(`INFO: found exact duplicate ${name}`);
        }
    }

    // transform the company names into their most basic forms
    const transformations = new Map<string, Company>();
    for (const [name, company] of companies) {
        const transformation = ascii(
            name
                .replace(/[.,!\-:%©&]/g, "") // remove all special characters
                .replace(/工作室/g, "")  // chinese word for studio
                .replace(/株式会社/g, "") // asian holding company
                .replace(/深圳市/g, "") // Shenzhen
        )
            .toLowerCase()
            // common words that are unlikely to cause false positives even without space prefix
            .replace(/(games?|studios?|limited|collective)/g, "")
            // generic business terms
            .replace(/ (llc|ltd|co|team|pictures?|proje[ck]ts?|studis|networks?|arts|vr|interactive|digital|development|oü|oy|productions?|corporation|corp|technology|bv|solutions|works|software|creative|games?|gmaes|gaming|GmbH|inc|designs?|media|group|entertain?e?ment|experience|&amp;?)/g, "")
            .replace(/[\s\t]/g, ""); // remove spaces and tabs

        // add as duplicate or add as a new "unique" transformation
        const duplicate = transformations.get(transformation);
        if (duplicate !== undefined) {
            markDuplicate(company, duplicate);
        } else {
            transformations.set(transformation, company);
            process.env.DEBUG && console.log(transformation); // useful for checking the output of the transformations
        }
    }

    let i = 0;
    for (const [transformation, company] of transformations) {
        if (transformation.length < 8) continue; // less than eight has too many false positives
        i++ % 1000 === 0 ? console.log(`${i} entries compared`) : undefined; // just so progress can be monitored
        for (const [duplicateTransformation, duplicate] of transformations) {
            if (duplicateTransformation.length < 8 || duplicate.duplicates.length || company === duplicate) continue;
            if(
                // less runs into a decent amount of false positives with human names
                transformation.length > 11
                && duplicateTransformation.length > 11
                && transformation.substring(0, 11) === duplicateTransformation.substring(0, 11)
            ) {
                markDuplicate(company, duplicate);
            } else if (
                Math.abs(transformation.length - duplicateTransformation.length) < 1
                && distance(transformation, duplicateTransformation) === 1
            ) {
                markDuplicate(company, duplicate);
            }
        }
    }

    const duplicateFile = [];
    const uniqueCompanies = new Set<string>();
    for (const [name, company] of companies) {
        if (!company.duplicates || !company.duplicates.some((duplicate) => uniqueCompanies.has(duplicate))) {
            uniqueCompanies.add(name);
            if (company.duplicates.length) {
                duplicateFile.push(name);
                for (const duplicate of company.duplicates) {
                    duplicateFile.push(`- ${duplicate}`)
                }
            }
        }
    }

    await writeFile("companies.duplicate.txt", duplicateFile.join("\n"), "utf8");
    await writeFile("companies.unique.txt", Array.from(uniqueCompanies).join("\n"), "utf8");

    console.log(
        `INFO: basic transformations removed ${originalCount - uniqueCompanies.size} companies`
    );
})();

function markDuplicate(company: Company, duplicate: Company) {
    company.duplicates.push(duplicate.name);
    duplicate.duplicates.push(company.name);
}

interface Company {
    name: string;
    duplicates: string[]
}