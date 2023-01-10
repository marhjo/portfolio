import { copy, readFile, mkdir, rm, writeFile } from "fs-extra";
import { promisify } from "node:util";
import { basename } from "node:path";
import glob from "glob";

const rmAsync = promisify(rm);
const mkdirAsync = promisify(mkdir);
const copyAsync = promisify(copy);
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const globAsync = promisify(glob);

const tryAsync = async (fn) => {
  try {
    await fn();
  } catch (e) {}
};

(async () => {
  await tryAsync(async () => await rmAsync("./out", { recursive: true }));
  await mkdirAsync("./out");

  await copyAsync("./src/public", "./out");

  const allFiles = (await globAsync("./**/*.html")).filter(
    (file) => !file.endsWith("layout.html")
  );

  const files = allFiles.filter((file) => !file.includes("components"));
  const components = allFiles.filter((file) => file.includes("components"));

  const layoutContent = await readFileAsync("./src/layout.html", "utf8");

  for (const file of files) {
    const fileContent = await readFileAsync(file, "utf8");

    let finalContent = `${layoutContent}`.replace("<slot />", fileContent);

    finalContent = finalContent.replace("$$_main", basename(file, ".html"));

    for (const component of components) {
      const name = basename(component, ".html");
      const content = await readFileAsync(component, "utf8");

      finalContent = finalContent.replace(`<${name}_ />`, content);
    }

    await writeFileAsync(file.replace("src", "out"), finalContent);
  }
})();
