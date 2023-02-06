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

// .github/actions/upsert-comment/script.mts
var script_exports = {};
__export(script_exports, {
  default: () => script_default
});
module.exports = __toCommonJS(script_exports);
var isTrue = (val) => {
  const b = val.toLowerCase();
  return b === "1" || b === "t" || b === "true" || b === "y" || b === "yes";
};
var tryParse = (str) => {
  if (!str)
    return;
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
};
var script_default = async ({ github, context, core }) => {
  const upsert = isTrue(core.getInput("upsert") || "true");
  core.info(`Will upsert: ${upsert}`);
  let body = tryParse(core.getInput("body"));
  const file = core.getInput("file");
  if (!(!file ^ !body)) {
    throw new Error("Either 'file' or 'body' must be set");
  }
  if (file) {
    const { promises: fs } = require("fs");
    body = await fs.readFile(file, "utf-8");
  }
  const [title] = body.split("\n");
  if (upsert) {
    core.info(`Will look for comment with title:`);
    core.info(title);
  }
  const { data: comments = [] } = upsert ? await github.rest.issues.listComments({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo
  }) : {};
  const titleRegexp = new RegExp(`^${title}$`, "m");
  const existingComment = comments.find(
    (comment) => comment.body.search(titleRegexp) === 0
  );
  if (body.length > 65536) {
    body = `${title}

This comment was automatically stripped by the upsert-comment action as it exceeds the 65536 character limit.`;
  }
  const payload = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    body
  };
  if (existingComment) {
    core.info(`Updating comment: ${existingComment.id}`);
    await github.rest.issues.updateComment({
      ...payload,
      comment_id: existingComment.id
    });
  } else {
    core.info(`Creating new comment in PR/issue: ${context.issue.number}`);
    await github.rest.issues.createComment({
      ...payload,
      issue_number: context.issue.number
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
