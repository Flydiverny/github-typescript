#!/usr/bin/env -S npx ts-node --swc --esm
import { cosmiconfigSync } from "cosmiconfig";

import "zx/globals";
import fs from "fs/promises";
import { ACCEPTED_COMMANDS, cmds } from "./commands.ts";

const explorerSync = cosmiconfigSync("factorio-manager", {
  searchPlaces: [".factorio-manager.yaml", ".factorio-manager.yml"],
});

const envTarget = process.env["FMAN_TARGET"]?.replace(/\/+$/, "");

let commands = argv._;
const maybeTarget = commands[0];
const inputTarget = maybeTarget?.replace(/\/+$/, "") || "";
commands = ACCEPTED_COMMANDS.includes(inputTarget)
  ? commands
  : commands.slice(1);

const target = ACCEPTED_COMMANDS.includes(inputTarget)
  ? envTarget
  : inputTarget;

if (commands.length === 0) {
  console.error("No commands specified");
  process.exit(1);
}

const TARGET_PATH = `/opt/factorio/${target}`;
const dockerName = `factorio-${target}`;

if (maybeTarget === "list") {
  try {
    const dirs = fs.readdir("/opt/factorio");
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
    fs.access(TARGET_PATH);
  } catch (err) {
    console.error(`Target ${target} not found`);
    process.exit(1);
  }

  console.log(`Using target`, target);
}

// ----------------------------------------------------------------------------

const runCommands = async () => {
  const { config } = explorerSync.search(TARGET_PATH) || { config: {} };
  const {
    backupPath,
    factorioPath,
    version = "stable",
    port = argv["port"] ?? "34197",
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
    await cmds[command]!({
      ...config,
      backupPath,
      factorioPath,
      version,
      port,
      TARGET_PATH,
      dockerName,
      target,
    });
    echo`${command} complete`;
  }
};

runCommands();
