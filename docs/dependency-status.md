# Dependency follow-up

During the October 2026 reliability update, compatible dependency updates removed the critical advisory and most reported vulnerabilities. The runtime database and mail packages were also updated to patched versions.

The remaining audit findings are in the Tailwind 3 build-tool dependency tree, including nested glob/pattern and CSS selector parsers. An automatic forced fix proposes a Tailwind 4 migration (and a typography plugin downgrade). That would change the UI build and requires a separate visual regression review. Do not run `npm audit fix --force` blindly.

Re-run `npm audit` when reviewing this change; advisory counts can change. This note does not claim that the dependency tree is vulnerability-free. Production application inputs are not intentionally passed into these build tools, but avoiding untrusted source inputs does not replace updating the affected tooling.
