<!-- GENERATED-HEADER-START -->

## upsert-comment

Action to create or update an existing pull request comment.

### Inputs

| Name   | Description                                                                        | Required | Default |
| ------ | ---------------------------------------------------------------------------------- | -------- | ------- |
| upsert | Update the same comment on consecutive runs                                        | No       | `true`  |
| body   | String which should be used as comment body, first line will be used for upserting | No       | N/A     |
| file   | Absolute file path which should be loaded to set the body                          | No       | N/A     |

<!-- GENERATED-HEADER-END -->

## Example usage - basic

```yaml
name: upsert comment
on: pull_request

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Create or update comment
        uses: doktor-se/composite-actions/upsert-comment
        with:
          body: |
            Successfully built: ${{ github.sha }}
```

## Example usage - advanced

```yaml
name: upsert comment
on: pull_request

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Add deployment comment on PR
        uses: actions/github-script@v6
        id: comment
        with:
          script: |
            const sites = {
              "Doktor": "doktorapi.se",
              "Anicura": "anicuraapi.se",
            }

            return `Successful builds will be deployed to:

            | Partner | Link |
            | :------ | :---- |
            ${Object.entries(sites).map(([site, tld]) => `| ${site} | https://carealot.staging.${tld}/ |`).join("\n")}

            Last successful build: ${{ github.sha }}
            `;

      - name: Create or update comment
        uses: doktor-se/composite-actions/upsert-comment
        with:
          body: ${{ steps.comment.outputs.result }}
```
