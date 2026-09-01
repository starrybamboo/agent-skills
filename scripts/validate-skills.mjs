import { fileURLToPath } from "node:url";
import path from "node:path";
import { validateCatalog } from "../skills/shared-skills-manager/scripts/catalog.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await validateCatalog(repositoryRoot);

for (const warning of result.warnings) console.warn(`WARNING ${warning}`);
console.log(`VALID ${result.skills.length} skills; manifest, references, scripts, licenses, and public boundary passed.`);
