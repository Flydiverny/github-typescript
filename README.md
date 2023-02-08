# github-typescript

Using [actions/github-script](https://github.com/actions/github-script) but missing typescript?

Enter github-typescript! A wrapper that will quickly transpile your TypeScript and execute it using github-script.

Usage example, create a `*.ts` or `*.mts` file in your and pass it in using `script-file`.
This will cause github-typescript to transpile to JS this and execute it using github-script like.

```yaml
- uses: flydiverny/github-typescript@v1
  env:
    INPUT_SOMETHING: "Nice demo run"
  with:
    script-file: .github/workflows/script.mts
    # (...) all other inputs supported by github-script@v6 will be passed thru
```

If you want to return a value you can export a default export and github-typescript will automatically run it for you.
The arguments to the default export below are also available as globals, like it is for inline github-scripts.

```ts
export default async ({
  require,
  __original_require__,
  github,
  context,
  core,
  exec,
  glob,
  io,
  fetch,
}) => {
  // My code here
};
```
