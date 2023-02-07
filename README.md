# ts-script

Using [actions/github-script](https://github.com/actions/github-script) but missing typescript?

Enter ts-script! A wrapper that will quickly transpile your TypeScript and execute it using github-script.

Usage example, create a `*.ts` or `*.mts` file in your and pass it in using `script-file`.
This will cause ts-script to transpile to JS this and execute it using github-script like.

```yaml
- uses: flydiverny/ts-script@main
  env:
    INPUT_SOMETHING: "Nice demo run"
  with:
    script-file: .github/workflows/script.mts
    # (...) all other inputs supported by github-script@v6 will be passed thru
```

In your script ensure you have a default export which will be executed by ts-script

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
