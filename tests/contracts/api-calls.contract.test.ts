// @vitest-environment node
/**
 * Contract test: every `apiClient.request({ method, path, query, body })` in
 * `src` and `scripts` names a route in the backend snapshot
 * (`openapi/openapi.json`), and each query key written out as a literal is a
 * key that route declares. An undeclared query key is a 422, and a deleted
 * route (`/payments`, the `/images`, `/boost` and `/renew` routes) is a 404.
 *
 * Only `apiClient.request({...})` calls are read. A call whose `path` is not a
 * literal or template string is listed in `nonLiteralPath` and must be named in
 * `KNOWN_DYNAMIC_PATHS`. Query keys that come from a spread or a helper cannot
 * be read here; those helpers are covered by their own tests.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const API_PREFIX = "/api/v1";
/** Accepted on a GET list route, declared or not (changelog 1.3). */
const LIST_QUERY = new Set(["cursor", "limit", "include_total"]);
/** Files where a request `path` is built at run time (a variable, not a literal). */
const KNOWN_DYNAMIC_PATHS = new Set<string>([]);

interface OperationObject {
  parameters?: Array<{ name: string; in: string }>;
  responses?: Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }>;
}

/** A GET whose 200 body is a cursor page. The pagination keys apply to it, and only to it. */
function isCursorList(operation: OperationObject | undefined, method: string): boolean {
  if (method.toUpperCase() !== "GET") return false;
  const ref = operation?.responses?.["200"]?.content?.["application/json"]?.schema?.$ref ?? "";
  return /CursorPage/.test(ref) || (operation?.parameters ?? []).some((p) => p.name === "cursor");
}

const spec = JSON.parse(fs.readFileSync(path.join(ROOT, "openapi/openapi.json"), "utf8")) as {
  paths: Record<string, Record<string, OperationObject>>;
};

/** `/flatmates/profiles/{user_id}` and `/flatmates/profiles/{}` are the same route. */
const routes = new Map<string, Record<string, OperationObject>>();
for (const [route, operations] of Object.entries(spec.paths)) {
  routes.set(route.replace(/\{[^}]+\}/g, "{}"), operations);
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) && !entry.name.includes("openapi-types")
      ? [full]
      : [];
  });
}

interface Call {
  where: string;
  method: string;
  route: string;
  queryKeys: string[];
}

const nonLiteralPath: string[] = [];

function readCalls(): Call[] {
  const calls: Call[] = [];
  for (const file of [...sourceFiles(path.join(ROOT, "src")), ...sourceFiles(path.join(ROOT, "scripts"))]) {
    const text = fs.readFileSync(file, "utf8");
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node: ts.Node) => {
      const isRequestCall =
        ts.isCallExpression(node) &&
        /(^|\.)(apiClient\.request|request)$/.test(node.expression.getText().replace(/\s+/g, "")) &&
        /apiClient/.test(node.expression.getText());
      if (isRequestCall && ts.isCallExpression(node) && node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
        const objectLiteral = node.arguments[0];
        const props = new Map<string, ts.PropertyAssignment>();
        for (const prop of objectLiteral.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) props.set(prop.name.text, prop);
        }
        const pathProp = props.get("path");
        const init = pathProp?.initializer;
        const isPathLiteral = init && (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init) || ts.isTemplateExpression(init));
        if (pathProp && !isPathLiteral) {
          const rel = path.relative(ROOT, file);
          if (!KNOWN_DYNAMIC_PATHS.has(rel)) nonLiteralPath.push(`${rel}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
        }
        const node2 = objectLiteral;
        if (pathProp && isPathLiteral) {
          const methodInit = props.get("method")?.initializer;
          const query = props.get("query")?.initializer;
          const line = source.getLineAndCharacterOfPosition(node2.getStart()).line + 1;
          calls.push({
            where: `${path.relative(ROOT, file)}:${line}`,
            method: methodInit && ts.isStringLiteral(methodInit) ? methodInit.text : "GET",
            route: init.getText().slice(1, -1).replace(/\$\{[^}]+\}/g, "{}"),
            queryKeys:
              query && ts.isObjectLiteralExpression(query)
                ? query.properties.flatMap((p) => {
                    // `.text` drops the quotes of "limit"; a computed key cannot be read, so it is skipped.
                    if (!(ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p))) return [];
                    return ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? [p.name.text] : [];
                  })
                : []
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return calls;
}

const calls = readCalls();

describe("API calls match the backend OpenAPI snapshot", () => {
  it("finds the calls it is meant to check", () => {
    expect(calls.length).toBeGreaterThan(50);
  });

  it("reads every request path as a literal", () => {
    expect(nonLiteralPath).toEqual([]);
  });

  it("calls only routes and methods the backend declares", () => {
    const unknown = calls
      .filter((call) => !routes.get(API_PREFIX + call.route)?.[call.method.toLowerCase()])
      .map((call) => `${call.method} ${call.route} (${call.where})`);
    expect(unknown).toEqual([]);
  });

  it("sends only query keys the route declares", () => {
    const undeclared: string[] = [];
    for (const call of calls) {
      const operation = routes.get(API_PREFIX + call.route)?.[call.method.toLowerCase()];
      const declared = new Set((operation?.parameters ?? []).filter((p) => p.in === "query").map((p) => p.name));
      for (const key of call.queryKeys) {
        if (!declared.has(key) && !(LIST_QUERY.has(key) && isCursorList(operation, call.method))) {
          undeclared.push(`${call.method} ${call.route} sends ${key} (${call.where})`);
        }
      }
    }
    expect(undeclared).toEqual([]);
  });

  it("calls no deleted payment, boost, renew or listing-image route", () => {
    const banned = calls.filter((call) => /^\/payments|\/boost$|\/renew$|^\/properties\/\{\}\/images/.test(call.route));
    expect(banned.map((call) => call.where)).toEqual([]);
  });
});
