import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { MethodInfo, ParamType } from "./types";

const API_ENDPOINT = `process.env.{YOUR_API_ENDPOINT}`;

export class RestInterfaceGenerator {
  private sourceFile: ts.SourceFile;

  constructor(filePath: string) {
    const content = fs.readFileSync(filePath, "utf-8");
    this.sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
  }

  private extractMethodInfo(node: ts.MethodDeclaration): MethodInfo {
    const methodName = node.name.getText();
    const params: MethodInfo["params"] = [];
    const decorators = ts.canHaveDecorators(node)
      ? ts.getDecorators(node)
      : undefined;

    let httpMethod = "";
    let path = "";

    // Extract HTTP method and path from decorator
    if (decorators) {
      const httpDecorator = decorators.find((d) => {
        const name = d.expression.getText().split("(")[0];
        return ["Get", "Post", "Put", "Delete", "Patch"].includes(name);
      });

      if (httpDecorator) {
        httpMethod = httpDecorator.expression
          .getText()
          .split("(")[0]
          .toUpperCase();
        path = httpDecorator.expression
          .getText()
          .split(`("`)[1]
          .split(`")`)[0]
          .replace(/"/g, "");
      }
    }

    const resolveParamType = (
      decoratorName:
        | "BodyParam"
        | "PathParam"
        | "QueryParam"
        | "HeaderParam"
        | "SystemParam"
    ) => {
      switch (decoratorName) {
        case "BodyParam":
          return ParamType.Body;
        case "PathParam":
          return ParamType.Path;
        case "QueryParam":
          return ParamType.Query;
        case "HeaderParam":
          return ParamType.Header;
        case "SystemParam":
          return ParamType.System;
        default:
          throw new Error(`Unknown decorator name: ${decoratorName}`);
      }
    };

    // Extract parameters
    node.parameters.forEach((param) => {
      const paramDecorators = ts.canHaveDecorators(param)
        ? ts.getDecorators(param)
        : undefined;
      if (paramDecorators) {
        const decorator = paramDecorators[0];
        const decoratorName = decorator.expression.getText().split("(")[0];

        params.push({
          name: param.name.getText(),
          type: param.type?.getText() || "any",
          required: decorator.expression.getText().includes("required: true"),
          paramType: resolveParamType(decoratorName as any),
        });
      }
    });

    // Extract return type
    const returnType = node.type?.getText() || "void";

    return {
      name: methodName,
      params,
      returnType,
      httpMethod,
      path,
    };
  }

  private generateUrlFile(className: string, methods: MethodInfo[]): string {
    const urlEntries = methods
      .map((method) => {
        const isPathParamExist = method.params.some(
          (param) => param.paramType === ParamType.Path
        );
        if (!isPathParamExist) {
          return `  public static ${method.name}: RestUrl = ["${method.httpMethod}", "${method.path}"];`;
        }

        // path의 순서와 pathParamKeys의 순서가 같아야 함
        // const urlKeys = method.path
        //   .split("/")
        //   .filter(e => e.startsWith(":"))
        //   .map(e => e.replace(/:(\w+)\(\\\\d\+\)/, "$1"));

        const pathParams = method.params.filter(
          (param) => param.paramType === ParamType.Path
        );

        const pathParamWithTypes = pathParams
          .map((e) => `${e.name}: ${e.type}`)
          .join(", ");
        const pathParamKeys = pathParams.map((e) => e.name).join(", ");

        // Convert path params to template literals
        const processedPath = method.path.replace(
          /:([a-zA-Z_][a-zA-Z0-9_]*) (?:\([^)]*\))?/g,
          (_, key) => {
            if (!pathParamKeys.includes(key)) {
              throw new Error(
                "pathParam RegEx invalid. Check if the Path regex matches the pathParam."
              );
            }
            return `\${${key}}`;
          }
        );

        return `  public static ${method.name}: (${pathParamWithTypes}) => RestUrl = (${pathParamKeys}) => ["${method.httpMethod}", \`${processedPath}\`];`;
      })
      .join("\n");

    return `import { RestUrl } from "../common/cyan.types";

export class ${className}Url {
${urlEntries}
}`;
  }

  private generateRestFile(className: string, methods: MethodInfo[]): string {
    const capitalizeFirstLetter = (str: string) => {
      if (!str.length) return "";
      return str.charAt(0).toUpperCase() + str.slice(1);
    };
    const importList = new Set<string>();

    const restEntries = methods
      .map((method) => {
        const requestType = `${capitalizeFirstLetter(method.name)}Request`;
        importList.add(requestType);

        const responseType = method.returnType
          .replace("Promise<", "")
          .replace(">", "");
        importList.add(responseType);

        const pathParams = method.params.filter(
          (param) => param.paramType === ParamType.Path
        );
        const pathParamKeys = pathParams?.map((e) => e.name).join(", ");
        const extractKeys =
          pathParams
            ?.map((param) => {
              return `    const ${param.name} = extractKey(req, "${param.name}");`;
            })
            .join("\n") + "\n".repeat(!!pathParamKeys.length ? 1 : 0);
        const urlVariable = pathParams.length
          ? `...${className}Url.${method.name}(${pathParamKeys})`
          : `...${className}Url.${method.name}`;

        return `  public static async ${method.name}(req: ApiReq<${requestType}>): ${method.returnType} {
    const authorization = extractKey(req, "authorization");
${extractKeys}
    const resp = await HttpRequest.request<${responseType}>(
      ${API_ENDPOINT},
      ${urlVariable},
      req,
      {
        authorization,
      }
    );

    return resp.data;
  }`;
      })
      .join("\n\n");

    return `import { ${Array.from(importList).join(
      ", "
    )} } from "./${className}.dto";
import { ${className}Url } from "./${className}.url";
import { ApiReq } from "../common/flax.types";
import { extractKey, HttpRequest } from "../common/HttpRequest";

export class ${className}Rest {
  ${restEntries}
}`;
  }

  private generateFlaxFile(className: string, methods: MethodInfo[]): string {
    const capitalizeFirstLetter = (str: string) => {
      if (!str.length) return "";

      return str.charAt(0).toUpperCase() + str.slice(1);
    };
    const importList = new Set<string>();

    const flaxEntries = methods
      .map((method) => {
        const requestType = `${capitalizeFirstLetter(method.name)}Request`;
        importList.add(requestType);

        const responseType = method.returnType
          .replace("Promise<", "")
          .replace(">", "");
        importList.add(responseType);

        const pathParams = method.params.filter(
          (param) => param.paramType === ParamType.Path
        );
        const pathParamKeys = pathParams?.map((e) => e.name).join(", ");
        const urlVariable = pathParams.length
          ? `${className}Url.${method.name}(${pathParamKeys})`
          : `${className}Url.${method.name}`;
        const extractKeys =
          pathParams
            ?.map((param) => {
              return `const ${param.name} = extractKey(data, "${param.name}");`;
            })
            .join("\n") + "\n".repeat(!!pathParamKeys.length ? 1 : 0);

        return `  public static ${method.name}(data: FxRequestData<${requestType}>): FxApiRequestData<${responseType}> {
    ${extractKeys}
    return {
      ...restReq(${API_ENDPOINT}, ${urlVariable}, data),
      reducer: resp => resp,
      errReducer: resp => resp,
    };
  }`;
      })
      .join("\n\n");

    return `import { ${Array.from(importList).join(
      ", "
    )} } from "./${className}.dto";
import { ${className}Url } from "./${className}.url";
import { restReq } from "../common/cyan.types";
import { FxApiRequestData, FxRequestData } from "../common/flax.types";
import { extractKey } from "../common/HttpRequest";

export class ${className}Flax {
  ${flaxEntries}
}`;
  }

  public generate(outputDir: string): void {
    ts.forEachChild(this.sourceFile, (node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.getText().replace("Controller", "");
        const methods: MethodInfo[] = [];

        node.members.forEach((member) => {
          if (ts.isMethodDeclaration(member)) {
            const methodInfo = this.extractMethodInfo(member);
            methods.push(methodInfo);
          }
        });

        // Generate rest.ts
        const restContent = this.generateRestFile(className, methods);
        fs.writeFileSync(
          path.join(outputDir, `${className}.rest.ts`),
          restContent
        );

        // // Generate flax.ts
        const flaxContent = this.generateFlaxFile(className, methods);
        fs.writeFileSync(
          path.join(outputDir, `${className}.flax.ts`),
          flaxContent
        );

        // Generate url.ts
        const urlContent = this.generateUrlFile(className, methods);
        fs.writeFileSync(
          path.join(outputDir, `${className}.url.ts`),
          urlContent
        );
      }
    });
  }
}

// CLI usage
if (require.main === module) {
  const [, , service, inputFile] = process.argv;
  if (!service || !inputFile) {
    console.error("Usage: ts-node generator.ts <service> <input-file>");
    process.exit(1);
  }

  const outputDir = path.join(__dirname, "..", "maven-rest", service);
  const generator = new RestInterfaceGenerator(inputFile);
  generator.generate(outputDir);
}
