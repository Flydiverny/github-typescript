export default async ({ github, context, core }) => {
  const something: string = core.getInput("something");
  core.info(`Got input: ${something}`);

  const payload: { owner: string; repo: string; body: string } = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: `Got input: ${something}`,
  };

  core.info(`Creating new comment in PR/issue: ${context.issue.number}`);
  await github.rest.issues.createComment({
    ...payload,
    issue_number: context.issue.number,
  });
};
