import fs from 'fs';
import path from 'path';

const root = 'src/app/api';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(filePath, files);
    } else if (ent.name === 'route.ts' || ent.name === 'route.tsx') {
      files.push(filePath);
    }
  }
  return files;
}

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const hadOldId = content.includes('{ params: { id: string } }');
  const hadOldUsername = content.includes('{ params: { username: string } }');
  const hasIdContext = content.includes('IdRouteContext');
  const hasUsernameContext = content.includes('UsernameRouteContext');

  if (!hadOldId && !hadOldUsername && !hasIdContext && !hasUsernameContext) {
    return false;
  }

  const usesPermissions = file.includes(String.raw`permissions\[id]`);

  if (hadOldId || hadOldUsername) {
    const contextType = hadOldUsername ? 'UsernameRouteContext' : 'IdRouteContext';
    const importLine = `import { ${contextType} } from '@lib/types/next-route-context';\n`;
    if (!content.includes(importLine.trim())) {
      const importBlock = content.match(/^((?:import .+\n)+)/);
      content = importBlock
        ? importBlock[1] + importLine + content.slice(importBlock[1].length)
        : importLine + content;
    }
    content = content.replace(
      hadOldUsername
        ? /\{ params \}: \{ params: \{ username: string \} \}/g
        : /\{ params \}: \{ params: \{ id: string \} \}/g,
      `{ params }: ${contextType}`
    );
    content = content.replace(
      /const \{ username \} = params;/g,
      'const { username } = await params;'
    );
    content = content.replace(
      /const \{ id \} = params;/g,
      'const { id } = await params;'
    );
    content = content.replace(
      /(\w+Schema\.(?:safeParse|parse))\(params\)/g,
      '$1(await params)'
    );
    if (usesPermissions) {
      content = content.replace(
        /const \{ id \} = PermissionIdSchema\.parse\(\{ id: params\.id \}\)/g,
        'const { id } = PermissionIdSchema.parse({ id: routeId })'
      );
      content = content.replace(/params\.id/g, 'routeId');
    } else {
      content = content.replace(/params\.id/g, 'id');
    }
    content = content.replace(/params\.username/g, 'username');
  }

  content = content.replace(
    /((?:export )?async function \w+\([\s\S]*?\{ params \}: (?:IdRouteContext|UsernameRouteContext)[\s\S]*?\)(?:[\s\S]*?)?\{)\n(\s*)try \{/g,
    (match, open, indent) => {
      if (match.includes('await params')) {
        return match;
      }
      if (open.includes('UsernameRouteContext')) {
        return `${open}\n${indent}try {\n${indent}  const { username } = await params;`;
      }
      if (usesPermissions) {
        return `${open}\n${indent}try {\n${indent}  const { id: routeId } = await params;`;
      }
      return `${open}\n${indent}try {\n${indent}  const { id } = await params;`;
    }
  );

  content = content.replace(
    /const \{ username \} = await params;\n(\s*)const \{ username \} = await params;\n/g,
    'const { username } = await params;\n'
  );
  content = content.replace(
    /const \{ id \} = await params;\n(\s*)const \{ id \} = await params;\n/g,
    'const { id } = await params;\n'
  );

  fs.writeFileSync(file, content);
  return true;
}

for (const file of walk(root)) {
  if (patchFile(file)) {
    console.log(`patched ${file}`);
  }
}
