# Example App: Music Player

This application is a professional example of a **Custom App** that is built with a modular architecture. It demonstrates how to separate your application's core logic from its main UI controller file.

### Features Demonstrated:
*   **Dynamic Script Loading:** This app is composed of two `.js` files. The main file (`music-player.js`) dynamically loads its own helper module (`player-logic.js`) from the app's installation folder at runtime. This is a powerful feature of the Reborn XP app platform.
*   **Modular Design:** The `player-logic.js` file contains a `PlayerEngine` class that manages all playback state and audio events. The main `music-player.js` file handles the window and UI events, and then calls methods on the `PlayerEngine` instance. This is a clean and professional way to structure complex applications.
*   **Custom UI:** The player uses native Reborn XP `<winbutton>`, `<input type="range">`, and `<wincheckbox>` components instead of the default browser audio player, creating an authentic look and feel.
*   **VFS Integration:** It uses `wm.openFileDialog()` to let the user select a file and `dm.getVfsUrl()` to get a streamable URL for the audio.
*   **Resource Cleanup:** It properly removes its dynamically loaded `player-logic.js` script from the main document when the app window is closed.

### Pro Tip: When to Use an Iframe
While this app loads scripts into the main document (which is fine for simple logic), developers should review the **Notepad++** or **SWF Wrapper** examples for the `iframe` pattern. That pattern is the recommended solution for apps that use complex UI libraries/canvases (such as games) to prevent mouse/touch coordinate issues caused by the OS's zoom feature on mobile devices.