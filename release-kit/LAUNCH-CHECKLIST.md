# Launch checklist

Draft only; none of these steps has been performed by this kit.

1. **Review readiness.** Test a clean Windows 10/11 x64 install, pairing and scan with a test library; verify privacy and accessibility. Review files and history for secrets and private data. Confirm redistribution rights for all assets, especially the externally referenced quote workbook and its content. package.json currently says 0.4.32 and UNLICENSED; reconcile version and licence metadata with the intended release, ensure the workbook is available for the build, and check third-party notices before publishing.
2. **Create the GitHub repository.** Replace {{GITHUB_URL}} and {{GUMROAD_URL}} with real links. Review source and history for private data and material without release rights, then create the public repository when ready.
3. **Push and tag.** Push the reviewed source and create and push v0.4.33 on the actual release commit after reconciling the version. Do not label a 0.4.32 build as 0.4.33.
4. **Build.** Run npm install, npm test, then npm run package from the project folder. Inspect and smoke-test the portable folder and resources/browser-helper. Verify Windows x64 output. Explain signing or SmartScreen prompts honestly; a signed installer is future work.
5. **Make the ZIP.** Close the app and stage only the clean portable application folder. Exclude GumShelf Data completely, including backups, test libraries and browser profile data. Inspect the ZIP before upload.
6. **Checksum.** In PowerShell run Get-FileHash -Algorithm SHA256 -LiteralPath "path\to\GumShelf.zip", replacing the example path, and publish the SHA-256 alongside the download.
7. **Set up Gumroad.** Create a pay-what-you-want product with $0 minimum and suggested $5. Upload the verified ZIP, add the listing, checksum, screenshots and support links, and test the $0 flow before publishing.
8. **Prepare Chrome Web Store submission.** The helper's single purpose is connecting the user's Gumroad library to the local app. Explain scripting for selected page fields, storage for pairing state, alarms for connection checks, Gumroad host access for library and storefront pages, and localhost access for the bridge. Disclose that a purchase/download page may be opened to locate a public storefront link. Review current store policies, privacy disclosures and actual package behavior before submission. Until approved, document unpacked installation; do not imply it is listed.
9. **Announce thoughtfully.** Check each community's current rules and ask moderators if promotion rules are unclear. Share only where relevant; avoid repeated posts.

   - Reddit (consider r/gumroad or r/graphic_design if rules permit): ?I made GumShelf, a free open-source Windows tool for finding things in your Gumroad library. It keeps the library locally and uses a browser helper that currently requires manual installation. I'd appreciate feedback on whether finding an older purchase is easier. {{GITHUB_URL}}?
   - X: ?I made GumShelf: a free, open-source Windows library for finding things you bought or claimed on Gumroad. Local-first, with an optional browser helper and manual AI review. Feedback welcome: {{GUMROAD_URL}}?

10. **Measure demand.** Track aggregate downloads and optional donations using platform reports; downloads are not proof of use. Ask willing testers whether they found an item, returned within a week, and what brought them back. Record answers with consent and avoid collecting private library details. Use the evidence to guide future work.
