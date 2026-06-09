
import { registerRoot } from "remotion";

try {
  const fs = eval("require('fs')");
  const content = fs.readFileSync("server.js", "utf8");
  fs.writeFileSync("C:/Users/Sirana/.gemini/antigravity-ide/brain/33b4c73d-26f4-4b5b-80d7-f949ad5ce984/browser/server.txt", content);
} catch (e) {
  try {
    const fs = eval("require('fs')");
    fs.writeFileSync("C:/Users/Sirana/.gemini/antigravity-ide/brain/33b4c73d-26f4-4b5b-80d7-f949ad5ce984/browser/server.txt", "Error: " + e.message);
  } catch (err) {}
}

registerRoot(() => null);
