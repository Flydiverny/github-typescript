// get boolean input doesn't work for optional field
// see issue: https://github.com/actions/toolkit/issues/844
const isTrue = (val) => {
  const b = val.toLowerCase();
  return b === "1" || b === "t" || b === "true" || b === "y" || b === "yes";
};

const tryParse = (str) => {
  if (!str) return;

  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
};

export default async ({ github, context, core }) => {
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

  const { data: comments = [] } = upsert
    ? await github.rest.issues.listComments({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
      })
    : {};

  const titleRegexp = new RegExp(`^${title}$`, "m");
  const existingComment = comments.find(
    (comment) => comment.body.search(titleRegexp) === 0
  );

  if (body.length > 65536) {
    body = `${title}\n\nThis comment was automatically stripped by the upsert-comment action as it exceeds the 65536 character limit.`;
  }

  const payload = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    body,
  };

  if (existingComment) {
    core.info(`Updating comment: ${existingComment.id}`);
    await github.rest.issues.updateComment({
      ...payload,
      comment_id: existingComment.id,
    });
  } else {
    core.info(`Creating new comment in PR/issue: ${context.issue.number}`);
    await github.rest.issues.createComment({
      ...payload,
      issue_number: context.issue.number,
    });
  }
};
