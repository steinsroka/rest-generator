#!/usr/bin/env node
import yargs from "yargs";
import { RestGeneratorCommand } from "../src/RestGeneratorCommand";
// const red = "\x1b[31m%s\x1b[0m";
// const green = "\x1b[32m%s\x1b[0m";
// const yellow = "\x1b[33m%s\x1b[0m";
// const blue = "\x1b[34m%s\x1b[0m";

yargs().command(new RestGeneratorCommand()).alias("v", "version").help("h")
  .argv;
