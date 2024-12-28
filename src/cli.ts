#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../package.json";
import { RestInterfaceGenerator } from "./RestInterfaceGenerator";

const program = new Command();

program
  .name("rest-generator")
  .description("Generate REST API boilerplate from specification")
  .usage("rest-generator <input-path> <output-path>")
  .version(version, "-v, --version", "Output the current version")
  .argument("<input-path>", "Path to input specification file")
  .argument("[output-path]", "Path to output directory", "./")
  .action((inputPath, outputPath) => {
    const generator = new RestInterfaceGenerator(inputPath);
    generator.generate(outputPath);
    console.log(`REST interface generated in ${outputPath} successfully!`);
  });

program.parse();
