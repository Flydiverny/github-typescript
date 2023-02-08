import { myFunc } from "./lib";

declare global {
  const core: any;
  const context: any;
  const github: any;
}

const something: string = core.getInput("something");
core.info(`Got input: ${something}`);

myFunc();

const payload: { owner: string; repo: string; body: string } = {
  owner: context.repo.owner,
  repo: context.repo.repo,
  body: `Got input: ${something}`,
};

core.info(`Creating comment here: ${context.issue.number}`);
if (context.issue.number) {
  await github.rest.issues.createComment({
    ...payload,
    issue_number: context.issue.number,
  });
} else {
  core.info("Not in a PR, skipping");
}
