// Architecture boundaries (see CLAUDE.md "Layout & boundaries"). Run: npm run deps
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'shared-is-leaf',
      comment: 'src/shared must not depend on app or modules.',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/(app|modules)/' },
    },
    {
      name: 'modules-not-to-app',
      comment: 'Modules must not depend on the app shell.',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'module-public-api',
      comment: 'Outside a module, import it only via its index.ts.',
      severity: 'error',
      from: { path: '^src/(app|shared|modules/[^/]+)/' },
      to: {
        path: '^src/modules/[^/]+/',
        pathNot: ['^src/$1/', '^src/modules/[^/]+/index[.]tsx?$'],
      },
    },
    {
      name: 'not-to-test',
      comment: 'Production code must not import test files.',
      severity: 'error',
      from: { pathNot: '[.]test[.]tsx?$' },
      to: { path: '[.]test[.]tsx?$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.css'],
    },
  },
};
