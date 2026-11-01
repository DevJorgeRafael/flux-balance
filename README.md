# Flux Balance

Offline-first personal finance app built with Expo, React Native, and local SQLite.

## Requirements

- Node.js 22 or newer.
- npm 10 or newer. The project uses `package-lock.json`; do not use pnpm.
- Android Studio, a development build, or Expo Go for manual testing.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Useful commands

- `npm start`: Start the Expo dev server.
- `npm run android`: Start on Android.
- `npm run ios`: Start on iOS.
- `npm run web`: Start on Web.
- `npm exec expo install <package>`: Install SDK-compatible packages.
- `npm run lint`: Lint code with Expo lint.
- `npx tsc --noEmit`: Run the TypeScript check.
- `npm test`: Run the `node:test` suite.
- `npm run licenses:generate`: Regenerate the third-party license catalog.
- `npm run icons:generate`: Regenerate the app icon set.

## Tests

The project uses Node's built-in test runner, not Jest. Test files are colocated with the code they cover and end in `.test.mjs`. Add every new test file to the `test` script in `package.json`.

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if script execution is restricted.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Licencia y apoyo

Flux Balance se distribuye bajo la [licencia MIT](LICENSE).

La app es gratuita y de código abierto. Si te resulta útil, puedes apoyar su desarrollo de forma voluntaria; no desbloquea funciones. El enlace de apoyo se configura en `src/constants/about.ts`.

- [Repositorio](https://github.com/DevJorgeRafael/flux-balance)
