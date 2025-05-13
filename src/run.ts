import { getCompanies } from "./get-companies";

(async () => {
    const inputCompanies = await getCompanies();
    const lines = inputCompanies.trim().split("\n");
    const originalCount = lines.length;
    console.log(`INFO: input has ${originalCount} lines`);

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

    const companies = new Map<string, Company>();
    for (const name of lines) {
        const company = companies.get(name);
        if (!company) {
            companies.set(name, {
                name: name,
                currentTransformation: name,
                transformations: [name],
                duplicates: []
            });
        } else {
            company.duplicates.push(name);
            console.log(`INFO: found exact duplicate ${name}`);
        }
    }

    const transformations = new Map<string, Company>();
    for (const [name, company] of companies) {
        const transformation = company
            .currentTransformation
            .toLowerCase()
            .replace(/ (llc|ltd|co|limited)([.,])*/g, "")
            .trim();
        company.currentTransformation = transformation;
        company.transformations.push(transformation);

        const duplicate = transformations.get(transformation);
        if (duplicate !== undefined) {
            duplicate.duplicates.push(name);
            company.duplicates.push(duplicate.name);
        }

        transformations.set(transformation, company);
    }

    if (process.env.DEBUG) {
        const printed = new Set<string>();
        for (const [name, company] of companies) {
            if (company.duplicates.length && !printed.has(company.name)) {
                console.log(name);
                for (const duplicate of company.duplicates) {
                    console.log(`- ${duplicate}`)
                    printed.add(duplicate);
                }
            }
        }
    }
})();

interface Company {
    name: string;
    currentTransformation: string,
    transformations: string[],
    duplicates: string[]
}