import { RestInterfaceGenerator } from "./generator";
import * as path from "path";

const [, , service, inputFile] = process.argv;

if (!service || !inputFile) {
  console.error("Usage: rest-generate <service> <input-file>");
  process.exit(1);
}

const outputDir = path.join(process.cwd(), "maven-rest", service);
const generator = new RestInterfaceGenerator(inputFile);
generator.generate(outputDir);
