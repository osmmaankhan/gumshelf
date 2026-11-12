# Changing GShelf logos manually

Close GumShelf, replace the files you want, then reopen it. No rebuild, scan or AI review is needed for the PNG previews. The EXE’s embedded Windows icon is a separate step below.

## Folder for the installed PC app

<your GumShelf folder>/resources/branding/

| Filename | Put this version here | Where it appears |
| --- | --- | --- |
| app-icon.png | Square application icon PNG | Sidebar and native app window/taskbar icon. Windows may cache taskbar artwork. |
| logo-color.png | Color logo PNG with transparent background | Home in light mode. You can also copy your black/yellow PNG here if you prefer it in light mode. |
| logo-dark.png | White/yellow logo PNG with transparent background | Home in dark mode. |
| logo-light.png | Black/yellow logo PNG | Spare light-background variant, retained for testing; not displayed automatically in the current Home layout. Copy it over logo-color.png to test it there. |
| logo-color.svg | Color SVG master | Preserved vector original; current in-app logo slots render PNG files. Replacing only this SVG does not change those slots. |
| desktop-icon.ico | Windows ICO version of the square app icon | Open GumShelf shortcut. Replacing app-icon.png alone does not regenerate this ICO. |

The exact names matter. Keep .png files as PNG and .ico as ICO; changing an extension does not convert an image. Keep a copy of your originals elsewhere before trying variants.

## How to test

1. Close GumShelf normally.
2. Replace only the logo files you want to test in resources/branding.
3. Open GumShelf using Open GumShelf.lnk. Check the sidebar and Home in light/dark mode.
4. If desired, replace desktop-icon.ico too. Windows may keep the old shortcut/taskbar icon cached; the app's PNG preview is the faster way to judge a new design. An ICO containing small sizes through 256 px is suitable; the current one includes 16, 24, 32, 48, 64, 128 and 256 px. If you only have PNG, you can keep testing it inside the app and have the ICO regenerated later.

Images keep their proportions. Transparent padding inside an image affects how large the artwork looks; all files are fitted inside the same layout slot. For small-size testing a simplified mark with less lettering/glow will usually be easier to judge. The app does not recolor the original logo to match the custom accent; monochrome uses a grayscale presentation.

If a PNG is missing or unreadable, the app uses its bundled version. Files are loaded on restart; there is no live file watcher. No local library files are modified by replacing artwork.

## Source and packaging

Editable source defaults: outputs/GumShelf/branding/. These ship as resources/branding in a clean portable package. The installed resources/branding folder is your manual test location. Current installation scripts add missing default files and preserve files already in that installed folder. Keep a backup before future updates, since a future installer may have a different policy.

Bundled fallback copies live in outputs/GumShelf/app/brand*.png, brand.svg and brand.ico. Editing those source copies alone does not update the installed app.asar. Do not edit or unpack app.asar for routine logo tests.

The original source files under Downloads/GShelf are your supplied originals; the running app does not watch that folder. Replacing artwork does not change app names, folder names, product data, categories or AI summaries.

Default interface color remains #FD4C2C. Change it in Settings → Appearance & notifications → Accent color. Use theme accent restores orange independently of the logo files.

## Embedded EXE icon (0.4.19 onward)

The EXE now embeds your supplied icon too. Replacing app-icon.png updates the app/window preview after restart; replacing desktop-icon.ico updates the shortcut’s source. To embed a new ICO into the EXE in this development workspace, close GumShelf and double-click outputs/Rebuild GShelf EXE icon.cmd. It uses the existing development resource tool and keeps GumShelf.exe.icon-backup. It never opens app.asar or product data. The helper needs the sibling GumShelf development folder; it is not a general installer feature. Source npm run package now runs the same resource-branding step automatically after packaging.

Windows can cache old pinned icons. If an older pinned item still shows Electron, re-pin the newly opened GumShelf window or updated shortcut. No app data reset is needed.
