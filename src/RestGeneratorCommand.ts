import { RestInterfaceGenerator } from "./RestInterfaceGenerator";
import { Arguments, CommandModule } from "yargs";
import { OptionType } from "./types";

export class RestGeneratorCommand implements CommandModule {
  // TODO: outputDir rest 위치로 지정
  command = "rest-generator <option> <controllerPath> <controllerName>";
  describe = "generate rest file from input file";

  async handler(
    args: Arguments<
      any & {
        option?: OptionType;
        inputFile: string;
        outputFile?: string;
      }
    >
  ) {
    const service = "docs";
    const projectRoot = process.cwd();
    // const outputDir = args.outputDir
    //   ? args.outputDir
    //   : `${projectRoot}/lib/rest/${service}`;
    const inputPath = `${args.controllerPath}/${args.controllerName}.ts`;
    const generator = new RestInterfaceGenerator(inputPath);
    generator.generate("./", args.option);
  }
}
