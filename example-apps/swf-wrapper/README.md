# Example App: SWF Game Wrapper

This is a powerful template for developers who want to package a single Flash game or animation (`.swf` file) into a self-contained, native-feeling application for Reborn XP.

### How It Works

This is a **Custom App** that acts as a dedicated launcher for one specific SWF file. It follows a professional, efficient pattern:
1.  **Iframe Isolation:** To ensure perfect 1:1 touch controls and prevent issues with the OS's zoom feature, the Ruffle player is loaded inside an `<iframe>`. This is the recommended pattern for any `<canvas>`-based application.
2.  **Dynamic Script Loading:** The app dynamically loads the single, centralized Ruffle library that is built into the Reborn XP operating system. This keeps your app bundle extremely small and ensures compatibility.
3.  **Asset Loading:** The app then uses its `installPath` to find and load a file named exactly **`game.swf`** from its own bundle. It loads the file as a `Blob` to ensure it works correctly inside the iframe.
4.  **Optional Touch Overlay:** For games that are heavily dependent on keyboard controls (like Arrow keys and Space), this template includes support for the global `SystemGamepad` API, which provides a high-quality virtual D-Pad for touch devices.
5.  **Self-Contained:** The result is an application that any user can install and run without needing to have the main "Flash Player" application installed first.

### How to Use This Template

To package your own Flash game, follow these simple steps:

1.  **Copy the Wrapper:** Copy the `swf-wrapper.js` file from this directory into your own project folder. You do not need to edit this file.
2.  **Add Your Game:** Get your Flash game file (`.swf`) and place it in the same project folder. **You must rename your file to `game.swf`**.
3.  **Add Your Icon:** Create a **100x100 `icon.png`** for your game and add it to the project folder.
4.  **Edit Window Size (Optional):** Open `swf-wrapper.js` in Notepad++ and change the `wm.setSize(hWnd, 550, 400);` line to match the optimal dimensions for your game.
5.  **Test It:** Use the `.exe` launcher method described in the main `GETTING_STARTED.md` guide to test your app locally.
6.  **Publish:** When you're ready, zip your `swf-wrapper.js` and `game.swf` files together and submit them to the App Market.
7.  **Enable Mobile Controls:** If your game requires a keyboard, ensure the `window.SystemGamepad.show()` line in the source code is active. If your game is mouse-only, you can remove or comment out that line.