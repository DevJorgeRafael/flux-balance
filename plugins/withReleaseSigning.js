const { createRunOncePlugin, withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_SIGNING_START = '// @flux-release-signing:start';
const RELEASE_SIGNING_END = '// @flux-release-signing:end';

const RELEASE_SIGNING_BLOCK = `        ${RELEASE_SIGNING_START}
        release {
            def signingProperties = [
                FLUX_UPLOAD_STORE_FILE: findProperty('FLUX_UPLOAD_STORE_FILE'),
                FLUX_UPLOAD_KEY_ALIAS: findProperty('FLUX_UPLOAD_KEY_ALIAS'),
                FLUX_UPLOAD_STORE_PASSWORD: findProperty('FLUX_UPLOAD_STORE_PASSWORD'),
                FLUX_UPLOAD_KEY_PASSWORD: findProperty('FLUX_UPLOAD_KEY_PASSWORD'),
            ]

            def missingSigningProperties = signingProperties.findAll { key, value ->
                value == null || value.toString().trim().isEmpty()
            }.keySet()

            if (!missingSigningProperties.isEmpty()) {
                throw new GradleException(
                    "Faltan propiedades de firma release: \${missingSigningProperties.join(', ')}. " +
                    "Defínelas en ~/.gradle/gradle.properties, fuera del repo."
                )
            }

            storeFile file(signingProperties.FLUX_UPLOAD_STORE_FILE)
            storePassword signingProperties.FLUX_UPLOAD_STORE_PASSWORD
            keyAlias signingProperties.FLUX_UPLOAD_KEY_ALIAS
            keyPassword signingProperties.FLUX_UPLOAD_KEY_PASSWORD
        }
        ${RELEASE_SIGNING_END}`;

function removeManagedReleaseSigning(contents) {
  return contents.replace(
    /\n[ \t]*\/\/ @flux-release-signing:start[\s\S]*?\/\/ @flux-release-signing:end[ \t]*/g,
    '',
  );
}

function applyReleaseSigning(contents) {
  let nextContents = removeManagedReleaseSigning(contents);

  const signingConfigsPattern =
    /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\n[ \t]*\}\n)([ \t]*\})/;

  if (!signingConfigsPattern.test(nextContents)) {
    throw new Error(
      'No se encontró el bloque signingConfigs.debug en android/app/build.gradle.',
    );
  }

  nextContents = nextContents.replace(
    signingConfigsPattern,
    `$1${RELEASE_SIGNING_BLOCK}\n$2`,
  );

  const buildTypesIndex = nextContents.indexOf('buildTypes');
  const releaseIndex =
    buildTypesIndex === -1
      ? -1
      : nextContents.indexOf('release {', buildTypesIndex);

  if (releaseIndex === -1) {
    throw new Error(
      'No se encontró el bloque buildTypes.release en android/app/build.gradle.',
    );
  }

  const beforeRelease = nextContents.slice(0, releaseIndex);
  const releaseAndAfter = nextContents.slice(releaseIndex);
  const releaseWithSigning = releaseAndAfter.replace(
    /signingConfig\s+signingConfigs\.debug/,
    'signingConfig signingConfigs.release',
  );

  nextContents = beforeRelease + releaseWithSigning;

  const releaseBlockPrefix = nextContents.slice(releaseIndex, releaseIndex + 500);

  if (!/signingConfig\s+signingConfigs\.release/.test(releaseBlockPrefix)) {
    throw new Error(
      'buildTypes.release no quedó configurado con signingConfigs.release.',
    );
  }

  if (/signingConfig\s+signingConfigs\.debug/.test(releaseBlockPrefix)) {
    throw new Error(
      'buildTypes.release sigue apuntando a signingConfigs.debug.',
    );
  }

  return nextContents;
}

function withReleaseSigning(config) {
  if (process.env.EAS_BUILD) {
    return config;
  }

  return withAppBuildGradle(config, (configWithGradle) => {
    if (configWithGradle.modResults.language !== 'groovy') {
      throw new Error(
        'withReleaseSigning solo admite android/app/build.gradle en Groovy.',
      );
    }

    configWithGradle.modResults.contents = applyReleaseSigning(
      configWithGradle.modResults.contents,
    );

    return configWithGradle;
  });
}

module.exports = createRunOncePlugin(
  withReleaseSigning,
  'with-release-signing',
  '1.0.0',
);
module.exports.applyReleaseSigning = applyReleaseSigning;
