#!/usr/bin/env -S npx ts-node --swc --esm
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target2) => (target2 = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target2, "default", { value: mod, enumerable: true }) : target2,
  mod
));

// input.ts
var import_cosmiconfig = require("cosmiconfig");
var import_globals2 = require("zx/globals");
var import_promises = __toESM(require("fs/promises"));

// commands.ts
var import_globals = require("zx/globals");

// deduplicate.ts
var cmp = (a, b) => {
  var pa = a.split(".");
  var pb = b.split(".");
  for (var i = 0; i < 3; i++) {
    var na = Number(pa[i]);
    var nb = Number(pb[i]);
    if (na > nb)
      return 1;
    if (nb > na)
      return -1;
    if (!isNaN(na) && isNaN(nb))
      return 1;
    if (isNaN(na) && !isNaN(nb))
      return -1;
  }
  return 0;
};
var deduplicate = async (basePath) => {
  const modDir = path.resolve(basePath, "./mods");
  const modListFp = path.resolve(modDir, "./mod-list.json");
  const modList = JSON.parse((await fs.readFile(modListFp)).toString());
  const allMods = (await fs.readdir(modDir)).filter((f) => f.endsWith(".zip")).map((file) => {
    const chunks = file.replace(".zip", "").split("_");
    const version = chunks[chunks.length - 1];
    const name = chunks.slice(0, -1).join("_");
    return { name, version };
  }).filter(({ name, version }) => !!name && !!version);
  const latestMods = allMods.sort((a, b) => cmp(a.version, b.version)).reduce((acc, item) => {
    const currentVersion = acc[item.name] || "0.0.0";
    return {
      ...acc,
      [item.name]: cmp(currentVersion, item.version) > 0 ? currentVersion : item.version
    };
  }, {});
  const toRemove = allMods.filter((mod) => {
    const modListEntry = modList.mods.find(({ name }) => name === mod.name);
    if (!modListEntry) {
      console.log("Removing:", mod.name, mod.version, "- not in config");
      return true;
    }
    if (modListEntry && !modListEntry.enabled) {
      console.log("Removing:", mod.name, mod.version, "- disabled");
      return true;
    }
    if (latestMods[mod.name] !== mod.version) {
      console.log(
        "Removing:",
        mod.name,
        mod.version,
        "<",
        latestMods[mod.name]
      );
      return true;
    }
    console.log("Keeping:", mod.name, mod.version);
    return false;
  });
  const zipsToRemove = toRemove.map(({ name, version }) => {
    return `${name}_${version}.zip`;
  });
  await Promise.all(
    zipsToRemove.map((zip) => fs.unlink(path.resolve(modDir, zip)))
  );
};

// commands.ts
var validate = async ({ dockerName: dockerName2, target: target2 }) => {
  try {
    await $`docker top ${dockerName2}`.quiet();
    console.warn(`${target2} is running, aborting..`);
    process.exit(1);
  } catch (p) {
  }
};
var cmds = {
  start: async (cfg) => {
    await validate(cfg);
    const { version, dockerName: dockerName2, TARGET_PATH: TARGET_PATH2, port } = cfg;
    await $`docker pull factoriotools/factorio:${version}`;
    await $`docker rm ${dockerName2} || true`;
    await $`docker run -d \
  -p ${port}:34197/udp \
  -v ${TARGET_PATH2}:/factorio \
  --name ${dockerName2} \
  --restart=always \
  factoriotools/factorio:${version}`;
  },
  stop: async ({ dockerName: dockerName2 }) => {
    await $`docker stop ${dockerName2}`;
  },
  logs: async ({ dockerName: dockerName2 }) => {
    try {
      await $`docker logs ${dockerName2} --follow`;
    } catch (err) {
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
    const { backupPath, TARGET_PATH: TARGET_PATH2, target: target2 } = cfg;
    const res = await $`date +"%Y-%m-%dT%H%M%S"`.quiet();
    const date = res.stdout.trim();
    const output = `${backupPath}/${target2}_${date}.zip`;
    echo(`Creating backup to ${output}`);
    await $`zip -r ${output} "${TARGET_PATH2}"`;
    echo`Backup to ${output} complete`;
  },
  update: async (cfg) => {
    await cmds["backup"](cfg);
    await cmds["update-only"](cfg);
  },
  "update-only": async (cfg) => {
    await validate(cfg);
    const { factorioPath, TARGET_PATH: TARGET_PATH2 } = cfg;
    echo`Copying mods`;
    await $`sudo cp -v ${factorioPath}/mods/*.zip ${TARGET_PATH2}/mods/`.quiet();
    await $`sudo cp -v ${factorioPath}/mods/mod-list.json ${TARGET_PATH2}/mods/`.quiet();
    await $`sudo cp -v ${factorioPath}/mods/mod-settings.dat ${TARGET_PATH2}/mods/`.quiet();
    echo`Fixing mod file permissions`;
    await $`sudo chown 845:845 -hR ${TARGET_PATH2}/mods/`;
    echo`Fixing mod file permissions`;
    await $`sudo chmod g+w -R ${TARGET_PATH2}/mods/`;
    echo`Deduplicating mods`;
    await deduplicate(TARGET_PATH2);
    echo`\nFinished updating mods`;
  },
  load: async (cfg) => {
    await validate(cfg);
    const { factorioPath, TARGET_PATH: TARGET_PATH2 } = cfg;
    const saves = await fs.readdir(path.resolve(factorioPath, "./saves"));
    const found = saves.find((name) => `${argv["file"]}.zip` === name);
    if (!found) {
      console.error(
        "--file <name>, name must match one of:\n -",
        saves.map((n) => n.replace(".zip", "")).join("\n - ")
      );
      process.exit(1);
    } else {
      await $`sudo cp -v ${factorioPath}/saves/${argv["file"]}.zip ${TARGET_PATH2}/saves/`;
      await $`sudo chown 845:845 -hR ${TARGET_PATH2}/saves/`;
    }
  }
};
var ACCEPTED_COMMANDS = Object.keys(cmds);

// input.ts
var explorerSync = (0, import_cosmiconfig.cosmiconfigSync)("factorio-manager", {
  searchPlaces: [".factorio-manager.yaml", ".factorio-manager.yml"]
});
var envTarget = process.env["FMAN_TARGET"]?.replace(/\/+$/, "");
var commands = argv._;
var maybeTarget = commands[0];
var inputTarget = maybeTarget?.replace(/\/+$/, "") || "";
commands = ACCEPTED_COMMANDS.includes(inputTarget) ? commands : commands.slice(1);
var target = ACCEPTED_COMMANDS.includes(inputTarget) ? envTarget : inputTarget;
if (commands.length === 0) {
  console.error("No commands specified");
  process.exit(1);
}
var TARGET_PATH = `/opt/factorio/${target}`;
var dockerName = `factorio-${target}`;
if (maybeTarget === "list") {
  try {
    const dirs = import_promises.default.readdir("/opt/factorio");
    console.log(dirs);
    process.exit(0);
  } catch (err) {
    console.error(`Target ${target} not found`);
    process.exit(1);
  }
}
if (!target) {
  console.error("No target specified");
  process.exit(1);
}
if (target) {
  try {
    import_promises.default.access(TARGET_PATH);
  } catch (err) {
    console.error(`Target ${target} not found`);
    process.exit(1);
  }
  console.log(`Using target`, target);
}
var runCommands = async () => {
  const { config } = explorerSync.search(TARGET_PATH) || { config: {} };
  const {
    backupPath,
    factorioPath,
    version = "stable",
    port = argv["port"] ?? "34197"
  } = config;
  if (!backupPath || !factorioPath) {
    console.error(
      "Missing config, backupPath and factorioPath must be set in .factorio-managerrc.yaml"
    );
    process.exit(1);
  }
  commands.forEach((command) => {
    if (!ACCEPTED_COMMANDS.includes(command)) {
      console.error("Invalid command:", command);
      console.error("Command must be one of:", ACCEPTED_COMMANDS.join(", "));
      process.exit(1);
    }
  });
  for await (const command of commands) {
    await cmds[command]({
      ...config,
      backupPath,
      factorioPath,
      version,
      port,
      TARGET_PATH,
      dockerName,
      target
    });
    echo`${command} complete`;
  }
};
runCommands();
