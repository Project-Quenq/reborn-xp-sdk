# Example App: Notepad++

This application is the official code editor for the Reborn XP platform and the most advanced example in the SDK. We recommend that all developers **install this app from the App Market** to use as their primary tool for building new applications directly within the OS.

The Notepad++ app is a complete, feature-rich tool that demonstrates the full potential of a **Custom App** built with the Reborn XP APIs.

### A Fully Functional IDE
This isn't just an example. Notepad++ is a complete application with features designed to make development inside Reborn XP a professional experience:
*   **Syntax Highlighting:** Full support for JavaScript, HTML, CSS, and JSON.
*   **VFS Integration:** Complete Create, Read, and Save functionality. You can open, edit, and save files directly on any virtual drives.
*   **State Persistence:** The editor remembers your preferred theme (Light/Dark) and word wrap settings between sessions using `localStorage`.    
*   **Context-Aware Launching:** The app correctly handles being launched directly (showing an untitled file) and via "Open With" (loading the selected file).

### A Premier SDK Example
As the flagship example in this SDK, the source code (`notepad-plus-plus.js`) is the best place to learn advanced concepts:
*   **Fixing Touch/Zoom Issues with an `<iframe>`:** To solve mouse/touch coordinate issues on devices using the OS's `zoom` feature, Notepad++ runs its editor inside an isolated `<iframe>`. This is the recommended pattern for any app that uses a `<canvas>` or a complex third-party UI library.
*   **Advanced Script Loading (Iframe Injection):** Instead of using `<script src="...">`, which can fail inside dynamic iframes, this app reads its library files from the VFS as text and **injects them directly** into the iframe's `<head>`. This is a robust, network-independent pattern for loading dependencies.
*   **Resource Management:** It demonstrates how to manage state and communication between the main app window and the `<iframe>` that contains the core functionality.