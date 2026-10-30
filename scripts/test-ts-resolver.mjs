import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const srcDirectory = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../src'
);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const target = pathToFileURL(
        path.join(srcDirectory, specifier.slice(2))
      ).href;

      try {
        return nextResolve(target, context);
      } catch {}

      try {
        return nextResolve(`${target}.ts`, context);
      } catch {}
    }

    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      !/\.[cm]?[jt]sx?$/.test(specifier)
    ) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {}
    }
    return nextResolve(specifier, context);
  },
});
