import "zx/globals";
import { deduplicate } from "./deduplicate.ts";

export interface CommandArguments {
  backupPath: string;
  factorioPath: string;
  version: string;
  port: string;
  TARGET_PATH: string;
  target: string;
  dockerName: string;
}

const validate = async ({ dockerName, target }: CommandArguments) => {
  try {
    await $`docker top ${dockerName}`.quiet();

    console.warn(`${target} is running, aborting..`);
    process.exit(1);
  } catch (p) {
    // All good no container running
  }
};

export const cmds: {
  [key: string]: (args: CommandArguments) => Promise<void>;
} = {
  start: async (cfg) => {
    await validate(cfg);
    const { version, dockerName, TARGET_PATH, port } = cfg;

    await $`docker pull factoriotools/factorio:${version}`;
    await $`docker rm ${dockerName} || true`;
    await $`docker run -d \
  -p ${port}:34197/udp \
  -v ${TARGET_PATH}:/factorio \
  --name ${dockerName} \
  --restart=always \
  factoriotools/factorio:${version}`;
  },

  stop: async ({ dockerName }) => {
    await $`docker stop ${dockerName}`;
  },

  logs: async ({ dockerName }) => {
    try {
      await $`docker logs ${dockerName} --follow`;
    } catch (err) {
      // Most likely container doesn't exist, ignore it
      console.error(err);
      process.exit(1);
    }
  },
  debug: async (config) => {
    console.log("Printing config");
    console.log(JSON.stringify(config, null, 2));
    process.exit(0);
  },

  backup: async (cfg) => {
    await validate(cfg);
    const { backupPath, TARGET_PATH, target } = cfg;

    const res = await $`date +"%Y-%m-%dT%H%M%S"`.quiet();
    const date = res.stdout.trim();
    const output = `${backupPath}/${target}_${date}.zip`;
    echo(`Creating backup to ${output}`);
    await $`zip -r ${output} "${TARGET_PATH}"`;
    echo`Backup to ${output} complete`;
  },

  update: async (cfg) => {
    await cmds["backup"]!(cfg);
    await cmds["update-only"]!(cfg);
  },

  "update-only": async (cfg) => {
    await validate(cfg);
    const { factorioPath, TARGET_PATH } = cfg;

    echo`Copying mods`;
    await $`sudo cp -v ${factorioPath}/mods/*.zip ${TARGET_PATH}/mods/`.quiet();
    await $`sudo cp -v ${factorioPath}/mods/mod-list.json ${TARGET_PATH}/mods/`.quiet();
    await $`sudo cp -v ${factorioPath}/mods/mod-settings.dat ${TARGET_PATH}/mods/`.quiet();

    echo`Fixing mod file permissions`;
    await $`sudo chown 845:845 -hR ${TARGET_PATH}/mods/`;

    echo`Fixing mod file permissions`;
    await $`sudo chmod g+w -R ${TARGET_PATH}/mods/`;

    echo`Deduplicating mods`;
    await deduplicate(TARGET_PATH);

    echo`\nFinished updating mods`;
  },

  load: async (cfg) => {
    await validate(cfg);
    const { factorioPath, TARGET_PATH } = cfg;

    const saves = await fs.readdir(path.resolve(factorioPath, "./saves"));

    const found = saves.find((name) => `${argv["file"]}.zip` === name);
    if (!found) {
      console.error(
        "--file <name>, name must match one of:\n -",
        saves.map((n) => n.replace(".zip", "")).join("\n - ")
      );
      process.exit(1);
    } else {
      await $`sudo cp -v ${factorioPath}/saves/${argv["file"]}.zip ${TARGET_PATH}/saves/`;
      await $`sudo chown 845:845 -hR ${TARGET_PATH}/saves/`;
    }
  },
};

export const ACCEPTED_COMMANDS = Object.keys(cmds);
