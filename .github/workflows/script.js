var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// .github/workflows/script.mts
var script_exports = {};
__export(script_exports, {
  default: () => script_default
});
module.exports = __toCommonJS(script_exports);

// .github/workflows/lib.ts
var myFunc = (core) => {
  core.info("Just wanted to log something in another file!");
};

// .github/workflows/script.mts
var script_default = async ({ github, context, core }) => {
  const something = core.getInput("something");
  core.info(`Got input: ${something}`);
  myFunc(core);
  const payload = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: `Got input: ${something}`
  };
  core.info(`Creating comment here: ${context.issue.number}`);
  if (context.issue.number) {
    await github.rest.issues.createComment({
      ...payload,
      issue_number: context.issue.number
    });
  } else {
    core.info("Not in a PR, skipping");
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
