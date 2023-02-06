const cmp = (a: string, b: string) => {
  var pa = a.split(".");
  var pb = b.split(".");
  for (var i = 0; i < 3; i++) {
    var na = Number(pa[i]);
    var nb = Number(pb[i]);
    if (na > nb) return 1;
    if (nb > na) return -1;
    if (!isNaN(na) && isNaN(nb)) return 1;
    if (isNaN(na) && !isNaN(nb)) return -1;
  }
  return 0;
};

export const deduplicate = async (basePath: string) => {
  const modDir = path.resolve(basePath, "./mods");
  const modListFp = path.resolve(modDir, "./mod-list.json");

  const modList: { mods: Array<{ name: string; enabled: boolean }> } =
    JSON.parse((await fs.readFile(modListFp)).toString());

  const allMods = (await fs.readdir(modDir))
    .filter((f) => f.endsWith(".zip"))
    .map((file) => {
      const chunks = file.replace(".zip", "").split("_");
      const version = chunks[chunks.length - 1]!;
      const name = chunks.slice(0, -1).join("_");

      return { name, version };
    })
    .filter(({ name, version }) => !!name && !!version);

  const latestMods = allMods
    .sort((a, b) => cmp(a.version, b.version))
    .reduce((acc, item) => {
      const currentVersion = acc[item.name] || "0.0.0";

      return {
        ...acc,
        [item.name]:
          cmp(currentVersion, item.version) > 0 ? currentVersion : item.version,
      };
    }, {} as Record<string, string>);

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
